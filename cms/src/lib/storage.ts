import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'
import {
  getFileKey,
  getFilePrefix,
  initClientUploads,
} from '@payloadcms/plugin-cloud-storage/utilities'
import { createHmac, randomUUID, timingSafeEqual } from 'crypto'
import fs from 'fs'
import type {
  CollectionConfig,
  FileData,
  PayloadHandler,
  PayloadRequest,
  Plugin,
  TypeWithID,
} from 'payload'

/**
 * Where the media library's files live.
 *
 * ON VERCEL: Cloudflare R2, under `hub/`, in the bucket the Content Generator
 * also writes to. The prefix is the whole of the separation — the generator's
 * files sit at the bucket root — so nothing here ever reads, writes or deletes
 * a key outside it.
 *
 * EVERYWHERE ELSE: `cms/media/` on local disk, with a warning at startup. Off
 * Vercel is development, and R2 is not used there even when its variables are
 * set, so an upload made on a laptop cannot land in the production bucket.
 *
 * A row's `prefix` says its file is in R2 (`hub`). Every row has one: the files
 * that lived in Supabase Storage were copied across on 11 September 2026, and
 * Supabase is not read for media at all any more.
 */

export const HUB_PREFIX = 'hub'

/** All five, or none. Listed once so every message names the same set. */
export const R2_VARS = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
] as const

type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  /** The bucket's public origin — `https://host`, no trailing slash. */
  publicUrl: string
}

/**
 * The R2 variables, or null when none of them is set. Some but not all is an
 * error naming the missing ones — never a value.
 */
function readR2Config(): R2Config | null {
  const values = R2_VARS.map((name) => process.env[name]?.trim() ?? '')
  const missing = R2_VARS.filter((_, index) => !values[index])
  if (missing.length === R2_VARS.length) return null
  if (missing.length > 0) {
    throw new Error(`Media storage: R2 is only partly configured — ${missing.join(', ')} not set.`)
  }
  const [accountId, accessKeyId, secretAccessKey, bucket, publicUrl] = values
  let origin: URL
  try {
    origin = new URL(publicUrl)
  } catch {
    throw new Error('Media storage: R2_PUBLIC_URL is not a URL.')
  }
  /* A bare https origin, because a file's URL is this plus its key: a path
     here would sit in front of every key and point at nothing. */
  if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('Media storage: R2_PUBLIC_URL must be an https origin with no path.')
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl: origin.origin }
}

export type MediaStorageMode = { kind: 'r2'; config: R2Config } | { kind: 'local' }

/**
 * Decided once, when the config is built — so a deployment missing R2 fails
 * its BUILD, and the previous deployment goes on serving. Refusing at runtime
 * instead would take the live site down to report a configuration mistake.
 */
function decideMode(): MediaStorageMode {
  /* `=== '1'`, the exact value Vercel sets, not merely present. The env file
     `vercel env pull` writes (`.env.production.local`) carries VERCEL=1 too, and
     Payload's CLI loads it for any production-mode command — so running
     `payload migrate` against production from a laptop would demand R2 it
     never uses. Such a command runs with VERCEL=0, which the env loader leaves
     alone because it never overrides a variable that is already set. */
  if (process.env.VERCEL === '1') {
    const config = readR2Config()
    if (!config) {
      throw new Error(
        `Media storage: R2 is required on Vercel and none of it is configured. Set ${R2_VARS.join(', ')}.`,
      )
    }
    return { kind: 'r2', config }
  }

  // Once per process, not once per config rebuild — dev recompiles the config
  // on every change, and a warning repeated on every save is one nobody reads.
  const flag = globalThis as { __hubMediaStorageWarned?: boolean }
  if (!flag.__hubMediaStorageWarned) {
    flag.__hubMediaStorageWarned = true
    const ignored = R2_VARS.some((name) => process.env[name])
      ? ' The R2_* variables are set and deliberately IGNORED off Vercel, so nothing uploaded here reaches the production bucket.'
      : ''
    console.warn(
      `\n  Media storage: uploads are saved to cms/media/ on local disk — development only.${ignored}\n`,
    )
  }
  return { kind: 'local' }
}

export const mediaStorage: MediaStorageMode = decideMode()

let r2Client: S3Client | null = null
function r2(config: R2Config): S3Client {
  r2Client ??= new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    /* The SDK now adds CRC checksums to every request by default, which
       S3-compatible stores do not all accept. Cloudflare's guidance is to send
       them only when an operation requires one. */
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
  return r2Client
}

/** A file's key in the bucket: `hub/<sanitised filename>`. */
function r2Key(filename: string): string {
  return getFileKey({ collectionPrefix: HUB_PREFIX, docPrefix: HUB_PREFIX, filename }).fileKey
}

/**
 * The URL a row's file is fetched from: its public address, straight from
 * Cloudflare — the Hub is not in the path, which is the point. A row with no
 * prefix has no file in R2 (none exist since the move); it gets Payload's own
 * address, which answers 404.
 */
function fileURL(config: R2Config, filename: string, prefix?: string | null): string {
  if (!prefix) return `/api/media/file/${encodeURIComponent(filename)}`
  return `${config.publicUrl}/${r2Key(filename).split('/').map(encodeURIComponent).join('/')}`
}

/**
 * The only types a browser is handed to display. Everything else — a PDF, any
 * document, and SVG, which can carry script — is sent as a download. It is also
 * what makes a resource's download link work at all: the page's `download`
 * attribute is ignored by browsers for a file on another domain, and R2 is one.
 * An `<img>` ignores this header, so an SVG still shows where it is embedded.
 */
const INLINE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'])

function contentDisposition(mimeType: string, filename: string): string | undefined {
  if (INLINE_TYPES.has(mimeType)) return undefined
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}

const r2Adapter =
  (config: R2Config): Adapter =>
  () => ({
    name: 'r2',
    generateURL: ({ filename, prefix }) => fileURL(config, filename, prefix),

    /* Called once per file — the original and every generated size — so the
       variants land beside it under `hub/`, not only the upload itself. */
    handleUpload: async ({ data, file }) => {
      const body = file.tempFilePath ? await fs.promises.readFile(file.tempFilePath) : file.buffer
      await r2(config).send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: r2Key(file.filename),
          Body: body,
          ContentType: file.mimeType,
          ContentDisposition: contentDisposition(file.mimeType, file.filename),
        }),
      )
      /* A ROW WITHOUT A PREFIX — none exist now, but a row restored from an
         old backup would be one. Its new file is in R2, and the row has to say
         so or its URL goes on pointing at nothing. Returned metadata is written
         back to the row by the plugin; an empty object writes nothing. */
      if (data?.prefix === HUB_PREFIX) return {}
      return { prefix: HUB_PREFIX } as unknown as Partial<FileData & TypeWithID>
    },

    /* R2 files only, and only under `hub/`. An empty prefix must never be
       treated as the bucket root: that is where the Content Generator's files
       are. */
    handleDelete: async ({ doc, filename }) => {
      if (doc?.prefix !== HUB_PREFIX) return
      await r2(config).send(new DeleteObjectCommand({ Bucket: config.bucket, Key: r2Key(filename) }))
    },

    /* The file route is answered by `mediaFileRedirect`. The plugin calls this
       for ONE thing: a direct upload, where Payload asks for the bytes the
       browser just put in R2 (see DIRECT UPLOADS below). It is handed a staged
       key, never a caller's choice of address — anything outside the staging
       area is refused, so this cannot be pointed at another file. */
    staticHandler: (_req, { params }) => {
      if (params.clientUploadContext === undefined) {
        return Response.redirect(fileURL(config, params.filename, HUB_PREFIX), 302)
      }
      const key = (params.clientUploadContext as { key?: unknown } | null)?.key
      if (!isStagingKey(key)) throw new Error('Direct upload: not a staged file.')
      return Response.redirect(publicURLForKey(config, key), 302)
    },

    /* The browser uploads the bytes itself; see DIRECT UPLOADS below. */
    clientUploads: true,
  })

/** The media library's storage, as a Payload plugin. */
export function mediaStoragePlugin(): Plugin {
  const config = mediaStorage.kind === 'r2' ? mediaStorage.config : null
  const storage = cloudStoragePlugin({
    enabled: Boolean(config),
    /* The `prefix` column exists in every environment, not only where the
       plugin is on — so development's schema, and the generated types, match
       production's. */
    alwaysInsertFields: true,
    collections: {
      media: {
        adapter: config ? r2Adapter(config) : null,
        prefix: HUB_PREFIX,
        /* Files are served by Cloudflare, not proxied through the Hub. Media is
           publicly readable already (`read: () => true`), so no access check is
           skipped — only the Vercel function and its bandwidth. */
        disablePayloadAccessControl: true,
        ...(config
          ? { generateFileURL: ({ filename, prefix }) => fileURL(config, filename, prefix) }
          : {}),
      },
    },
  })

  return (incoming) => {
    /* Registered in every environment so the import map is the same one in
       development and production; `enabled` is what switches it on, and off
       Vercel there is no R2 to upload to, so uploads there stay multipart. */
    initClientUploads({
      clientHandler: '/components/admin/MediaUploadHandler#MediaUploadHandler',
      collections: { media: { prefix: HUB_PREFIX } },
      config: incoming,
      enabled: Boolean(config),
      serverHandler: directUploadURLHandler,
      serverHandlerPath: DIRECT_UPLOAD_URL_PATH,
    })
    if (config) {
      incoming.endpoints = [
        ...(incoming.endpoints ?? []),
        { path: DIRECT_UPLOAD_PROXY_PATH, method: 'post', handler: directUploadProxyHandler },
      ]
    }
    return storage(incoming)
  }
}

/* ---- DIRECT UPLOADS -------------------------------------------------------
 *
 * WHY THE BROWSER UPLOADS THE FILE ITSELF. Vercel refuses any request body
 * over 4.5MB at its edge, before the Hub sees it — so a multipart upload of a
 * font family, an ebook or a wallpaper pack could never reach Payload at all.
 * The bytes now go to R2 without passing through a Vercel function:
 *
 *   1. The admin asks `/api/media-upload-url` for a staging key: a signed PUT
 *      URL and a signed token, both for `hub/_incoming/<uuid>/<name>`.
 *   2. It uploads there — through `/api/media-upload-proxy` when the file is
 *      4MB or less, which needs nothing from the bucket; straight to R2 with
 *      the signed URL when it is larger, which needs the bucket's CORS rule to
 *      admit the Hub's origin.
 *   3. It submits the form with the key instead of the bytes. Payload fetches
 *      the staged file back (the adapter's staticHandler, above) — a download,
 *      which no request limit applies to.
 *   4. Media's `beforeOperation` then turns it back into an ordinary upload, so
 *      the name, the download headers and the derivatives are made by the same
 *      server path every other file takes; `afterChange` deletes the staged
 *      copy. See collections/Media.ts.
 *
 * The staging area is inside `hub/`, so nothing here comes near the Content
 * Generator's keys at the bucket root.
 */

export const DIRECT_UPLOAD_URL_PATH = '/media-upload-url'
export const DIRECT_UPLOAD_PROXY_PATH = '/media-upload-proxy'
const STAGING_PREFIX = `${HUB_PREFIX}/_incoming/`
/** Under Vercel's 4.5MB request ceiling, with room for the request itself. */
const PROXY_MAX_BYTES = 4 * 1024 * 1024
const STAGING_TTL_MS = 15 * 60 * 1000

function isStagingKey(key: unknown): key is string {
  return (
    typeof key === 'string' &&
    key.startsWith(STAGING_PREFIX) &&
    !key.includes('..') &&
    key.length < 400
  )
}

function publicURLForKey(config: R2Config, key: string): string {
  return `${config.publicUrl}/${key.split('/').map(encodeURIComponent).join('/')}`
}

/** A staging key: its own folder, so two files of the same name never meet. */
function stagingKeyFor(filename: string): string {
  const safe =
    filename
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(-120) || 'file'
  return `${STAGING_PREFIX}${randomUUID()}/${safe}`
}

type StagingClaim = { key: string; mimeType: string; exp: number }

function signingKey(): string {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is not set.')
  return `media-upload:${secret}`
}

/** The proxy only writes keys this server handed out, and only for a while. */
function signClaim(claim: StagingClaim): string {
  const body = Buffer.from(JSON.stringify(claim)).toString('base64url')
  const mac = createHmac('sha256', signingKey()).update(body).digest('base64url')
  return `${body}.${mac}`
}

function readClaim(token: string | null): StagingClaim | null {
  if (!token) return null
  const [body, mac] = token.split('.')
  if (!body || !mac) return null
  const expected = createHmac('sha256', signingKey()).update(body).digest()
  const given = Buffer.from(mac, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    const claim = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as StagingClaim
    if (!isStagingKey(claim.key) || typeof claim.mimeType !== 'string') return null
    if (!(claim.exp > Date.now())) return null
    return claim
  } catch {
    return null
  }
}

/** Only someone who may add to the library may stage a file for it. */
async function mayUpload(req: PayloadRequest): Promise<boolean> {
  if (!req.user) return false
  const access = req.payload.collections.media.config.access?.create
  if (!access) return true
  return Boolean(await access({ req }))
}

const directUploadURLHandler: PayloadHandler = async (req) => {
  if (mediaStorage.kind !== 'r2') return Response.json({ error: 'Not available.' }, { status: 404 })
  if (!(await mayUpload(req))) return Response.json({ error: 'Sign in to upload.' }, { status: 401 })

  const body = (await req.json?.().catch(() => null)) as {
    filename?: unknown
    mimeType?: unknown
    size?: unknown
  } | null
  const filename = typeof body?.filename === 'string' ? body.filename.trim() : ''
  const mimeType =
    typeof body?.mimeType === 'string' && body.mimeType ? body.mimeType : 'application/octet-stream'
  const size = Number(body?.size)
  if (!filename || !Number.isFinite(size) || size <= 0) {
    return Response.json({ error: 'That file has no name or no size.' }, { status: 400 })
  }

  const { config } = mediaStorage
  const key = stagingKeyFor(filename)
  const url = await getSignedUrl(
    r2(config),
    new PutObjectCommand({ Bucket: config.bucket, Key: key, ContentType: mimeType }),
    { expiresIn: STAGING_TTL_MS / 1000 },
  )
  const token = signClaim({ key, mimeType, exp: Date.now() + STAGING_TTL_MS })
  return Response.json({ key, url, token, proxyMaxBytes: PROXY_MAX_BYTES })
}

const directUploadProxyHandler: PayloadHandler = async (req) => {
  if (mediaStorage.kind !== 'r2') return Response.json({ error: 'Not available.' }, { status: 404 })
  if (!(await mayUpload(req))) return Response.json({ error: 'Sign in to upload.' }, { status: 401 })

  const token = req.url ? new URL(req.url).searchParams.get('token') : null
  const claim = readClaim(token)
  if (!claim) {
    return Response.json({ error: 'That upload link has expired. Try again.' }, { status: 403 })
  }
  if (typeof req.arrayBuffer !== 'function') {
    return Response.json({ error: 'No file arrived.' }, { status: 400 })
  }
  const bytes = Buffer.from(await req.arrayBuffer())
  if (bytes.length === 0) return Response.json({ error: 'No file arrived.' }, { status: 400 })
  if (bytes.length > PROXY_MAX_BYTES) {
    return Response.json({ error: 'Too large to send this way.' }, { status: 413 })
  }

  const { config } = mediaStorage
  await r2(config).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: claim.key,
      Body: bytes,
      ContentType: claim.mimeType,
    }),
  )
  return Response.json({ ok: true })
}

/** Removes a staged upload once the real file is saved. Staging keys only. */
export async function deleteStagedUpload(key: unknown): Promise<void> {
  if (mediaStorage.kind !== 'r2' || !isStagingKey(key)) return
  const { config } = mediaStorage
  await r2(config).send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }))
}

type UploadHandler = NonNullable<
  Extract<NonNullable<CollectionConfig['upload']>, object>['handlers']
>[number]

/**
 * `/api/media/file/<name>` — the address every file had before the move to R2,
 * and still the one in sent newsletters, link previews and anywhere a cover
 * was copied. It redirects to the file's R2 address; a name no row owns is a
 * 404. Nothing is streamed through the Hub and Supabase is never consulted.
 *
 * In development it answers nothing, and Payload serves `cms/media/` from disk.
 */
export const mediaFileRedirect: UploadHandler = (req, { params }) => {
  if (mediaStorage.kind !== 'r2') return
  /* A direct upload's bytes are fetched through the adapter; see above. */
  if (params.clientUploadContext !== undefined) return
  return redirectToR2(req, params.filename, mediaStorage.config)
}

async function redirectToR2(req: PayloadRequest, filename: string, config: R2Config): Promise<Response> {
  const collection = req.payload.collections.media.config
  const prefix = await getFilePrefix({ collection, filename, req })
  if (!prefix) return new Response('Not found', { status: 404 })
  return Response.redirect(fileURL(config, filename, prefix), 302)
}

/**
 * Whether the R2 credentials can reach the bucket, for /api/health. A one-key
 * listing under `hub/`: the cheapest call an object-scoped token is certain to
 * be allowed, and one that answers a 403 honestly rather than for a missing
 * key. `ok: null` means R2 could not be reached, which is not the same as
 * being refused.
 */
export async function probeR2(): Promise<{ ok: boolean | null; ms: number; note?: string }> {
  const t0 = Date.now()
  if (mediaStorage.kind !== 'r2') return { ok: true, ms: 0, note: 'local disk (development)' }
  const { config } = mediaStorage
  try {
    await r2(config).send(new ListObjectsV2Command({ Bucket: config.bucket, Prefix: `${HUB_PREFIX}/`, MaxKeys: 1 }), {
      abortSignal: AbortSignal.timeout(6000),
    })
    return { ok: true, ms: Date.now() - t0 }
  } catch (error) {
    const name = (error as { name?: string })?.name
    const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode
    const ms = Date.now() - t0
    if (status === 401 || status === 403) return { ok: false, ms, note: 'credentials rejected' }
    if (name === 'NoSuchBucket') return { ok: false, ms, note: 'no bucket by that name' }
    if (status) return { ok: false, ms, note: `${name} (${status})` }
    return { ok: null, ms, note: `unreachable: ${name ?? 'unknown'}` }
  }
}
