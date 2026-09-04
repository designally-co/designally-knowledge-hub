import { getPayload } from 'payload'
import config from '@payload-config'

import { emailFromToken } from '@/lib/unsubscribeToken'

/**
 * Leaving the list, in one click and no questions.
 *
 * GET, NOT POST, AND THAT IS THE POINT. A mail client opens links; it does not
 * submit forms. Anything that asks the reader to confirm on a page, sign in, or
 * "manage preferences" is a list that is hard to leave, which is how you earn a
 * spam complaint from someone who would have left quietly.
 *
 * THE STATUS CHANGES; THE ROW STAYS. Deleting it loses the one thing they told
 * you, and the next import would mail them again.
 *
 * AN UNKNOWN OR FORGED TOKEN IS STILL A CALM PAGE. Whoever clicked wanted out,
 * and a stack trace or a bare 400 does not serve them. The only case worth
 * naming is a signature that does not verify, which means the link was mangled
 * in transit or the signing secret has been rotated — and then the honest thing
 * is to say so and give them an address to write to.
 */

const page = (title: string, body: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>${title} — Designally Knowledge Hub</title>
<style>
  :root { color-scheme: light }
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         background:#f9f6f4; color:#12100d; padding:24px;
         font:400 16px/1.55 ui-sans-serif, system-ui, -apple-system, sans-serif }
  main { max-width:32rem; text-align:center }
  h1 { margin:0 0 12px; font-size:clamp(28px,5vw,40px); line-height:1.1; font-weight:400 }
  p { margin:0 0 24px; color:#4a453d }
  a { display:inline-block; padding:12px 20px; border-radius:999px;
      background:#12100d; color:#fff; text-decoration:none; font-weight:600 }
</style></head>
<body><main><h1>${title}</h1><p>${body}</p>
<a href="/">Back to the Hub</a></main></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') ?? ''
  const email = emailFromToken(token)

  if (!email) {
    return page(
      'That link is no longer valid',
      'It may have been altered in transit. Write to clients@designally.co and we will take you off the list by hand.',
      400,
    )
  }

  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    /* Already gone, or never here: the same page either way. Someone who has
       clicked unsubscribe wants to be told they are off the list, not to be
       told their address was not on it. */
    if (docs[0] && docs[0].status !== 'unsubscribed') {
      await payload.update({
        collection: 'subscribers',
        id: docs[0].id,
        data: { status: 'unsubscribed' },
        overrideAccess: true,
      })
    }

    return page('You are unsubscribed', 'No more newsletters. Nothing else changes.')
  } catch (error) {
    console.error('[unsubscribe] failed', error)
    return page(
      'That did not go through',
      'Something failed at our end. Write to clients@designally.co and we will take you off the list by hand.',
      500,
    )
  }
}
