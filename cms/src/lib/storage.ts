import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'
import { getFileKey, getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import fs from 'fs'
import type { CollectionConfig, FileData, PayloadRequest, Plugin, TypeWithID } from 'payload'

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

    // Unused: with `disablePayloadAccessControl` the plugin never mounts it, and
    // the file route is answered by `mediaFileRedirect`. Required by the type.
    staticHandler: (_req, { params }) =>
      Response.redirect(fileURL(config, params.filename, HUB_PREFIX), 302),
  })

/** The media library's storage, as a Payload plugin. */
export function mediaStoragePlugin(): Plugin {
  const config = mediaStorage.kind === 'r2' ? mediaStorage.config : null
  return cloudStoragePlugin({
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
