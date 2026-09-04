import { addDataAndFileToRequest, type PayloadHandler } from 'payload'

/**
 * POST /api/media/from-url
 *
 * Create a media doc from a URL the Hub fetches ITSELF, instead of from bytes
 * the caller pushes up in the request body.
 *
 * WHY THIS EXISTS: VERCEL CAPS A REQUEST BODY AT 4.5MB, AND IT IS THE PLATFORM
 * THAT ENFORCES IT — the request is refused at the edge with a 413 before any
 * route, any auth check, or Payload itself ever runs. Measured against
 * production: a 4MB upload reached Payload and was correctly rejected as
 * unauthorized, while 5MB came back 413 with no Payload error body at all.
 *
 * Content Studio uploads its generated cover to /api/media as multipart. Once
 * generated covers grew past that ceiling every publish lost its image, and
 * because the 413 body is not Payload JSON there was no error message to
 * report — just a silent coverless article. It also explains why republishing
 * with a NEW image kept the old one: the upload failed, so no `coverImage` was
 * sent, and the Hub correctly left the cover it already had alone.
 *
 * The fix is to stop moving the bytes through the request at all. The caller
 * sends a signed URL — a few hundred bytes — and the Hub fetches the file
 * server-side, where no such limit applies. Payload still receives a real
 * buffer, so `imageSizes` derivatives and dimensions work exactly as they do
 * for a normal upload.
 *
 * Body: { url, alt, filename? }
 * Returns Payload's own shape, `{ doc: { id } }`, so callers can treat this
 * and /api/media as interchangeable.
 */

/** Enough for any cover; small enough that a wrong URL cannot exhaust memory. */
const MAX_BYTES = 25 * 1024 * 1024
const FETCH_TIMEOUT_MS = 30_000

/**
 * FETCHING A URL A CALLER SUPPLIES IS A SERVER-SIDE REQUEST FORGERY PRIMITIVE,
 * so the host is checked against an allowlist rather than the URL merely being
 * parsed. Content Studio's images live in Supabase Storage; anything else has
 * to be named deliberately in MEDIA_FETCH_HOSTS (comma-separated).
 */
function hostAllowed(host: string): boolean {
  const extra = (process.env.MEDIA_FETCH_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
  const lower = host.toLowerCase()
  return lower === 'supabase.co' || lower.endsWith('.supabase.co') || extra.includes(lower)
}

type Body = {
  url?: string
  alt?: string
  filename?: string
}

export const mediaFromUrlHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json(
      { error: 'Unauthorized. Provide a valid `users` API key.' },
      { status: 401 },
    )
  }

  await addDataAndFileToRequest(req)
  const { url, alt, filename } = (req.data ?? {}) as Body

  if (!url || !alt) {
    return Response.json({ error: 'Requires `url` and `alt`.' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return Response.json({ error: '`url` is not a valid URL.' }, { status: 400 })
  }

  /* https only: a signed URL sent over http would put the signature on the
     wire in clear, and it is the credential for the object. */
  if (parsed.protocol !== 'https:') {
    return Response.json({ error: '`url` must be https.' }, { status: 400 })
  }
  if (!hostAllowed(parsed.hostname)) {
    return Response.json(
      { error: `Refusing to fetch from ${parsed.hostname}. Add it to MEDIA_FETCH_HOSTS to allow it.` },
      { status: 400 },
    )
  }

  let data: Buffer
  let mimetype: string
  try {
    const response = await fetch(parsed.toString(), {
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!response.ok) {
      /* The caller's signed URL may simply have expired, which is worth saying
         plainly rather than reporting as a Hub failure. */
      return Response.json(
        { error: `Could not fetch the image: the source responded ${response.status}.` },
        { status: 502 },
      )
    }

    /* Trust the header enough to reject early, but check the real length after
       reading too — a source is free to lie or omit it. */
    const declared = Number(response.headers.get('content-length') ?? '0')
    if (declared > MAX_BYTES) {
      return Response.json(
        { error: `The image is ${Math.round(declared / 1e6)}MB; the limit is ${MAX_BYTES / 1e6}MB.` },
        { status: 413 },
      )
    }

    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.byteLength > MAX_BYTES) {
      return Response.json(
        { error: `The image is ${Math.round(bytes.byteLength / 1e6)}MB; the limit is ${MAX_BYTES / 1e6}MB.` },
        { status: 413 },
      )
    }

    data = bytes
    mimetype = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png'
  } catch (error) {
    return Response.json(
      {
        error: `Could not fetch the image: ${error instanceof Error ? error.message : 'unknown error'}.`,
      },
      { status: 502 },
    )
  }

  if (!mimetype.startsWith('image/')) {
    return Response.json(
      { error: `That URL returned ${mimetype}, which is not an image.` },
      { status: 400 },
    )
  }

  try {
    /* `overrideAccess: false` with the authenticated user, so this endpoint
       grants exactly what a normal create through /api/media would and no
       more. */
    const doc = await req.payload.create({
      collection: 'media',
      overrideAccess: false,
      user: req.user,
      data: { alt },
      file: {
        data,
        mimetype,
        name: filename || parsed.pathname.split('/').pop() || 'cover.png',
        size: data.byteLength,
      },
    })
    return Response.json({ doc: { id: doc.id } }, { status: 201 })
  } catch (error) {
    return Response.json(
      {
        errors: [
          { message: error instanceof Error ? error.message : 'The media document could not be created.' },
        ],
      },
      { status: 500 },
    )
  }
}
