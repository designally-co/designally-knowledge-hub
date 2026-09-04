import { getPayload } from 'payload'
import config from '@payload-config'

import { emailFromConfirmToken } from '@/lib/unsubscribeToken'

/**
 * The other end of the confirmation email — where a request becomes a subscriber.
 *
 * GET, because a mail client opens links and does not submit forms. The same
 * reasoning as the unsubscribe route, and the same shape of page.
 *
 * IT IS IDEMPOTENT. People click the link twice, mail clients pre-fetch it, and
 * a security scanner on a corporate mail server will open every URL in a message
 * before the recipient ever sees it. Confirming an address that is already
 * confirmed must therefore be a no-op that still says yes, or the second click
 * reads as a failure.
 *
 * A CONFIRMED ADDRESS THAT LATER UNSUBSCRIBED IS NOT QUIETLY RESUBSCRIBED. An
 * old confirmation link is not consent to rejoin a list you have since left —
 * `unsubscribed` is the more recent and more specific instruction, and it wins.
 * Signing up again is the way back, and that sends a new link.
 *
 * THE TOKEN IS SIGNED FOR THIS PURPOSE ALONE. It is an HMAC over `confirm:` plus
 * the address, so the unsubscribe link at the foot of every newsletter cannot be
 * spent here — otherwise anyone holding a forwarded newsletter could confirm an
 * address that never agreed.
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
  const email = emailFromConfirmToken(token)

  if (!email) {
    return page(
      'That link is no longer valid',
      'It may have been altered in transit. Sign up again and we will send a fresh one.',
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
    const subscriber = docs[0]

    /* No row at all means the request was never recorded — the signature is
       valid, so the link is genuine, but there is nothing here to confirm.
       Asking again is the honest instruction. */
    if (!subscriber) {
      return page(
        'We could not find that sign-up',
        'The request may have been removed. Sign up again and we will send a new confirmation.',
        404,
      )
    }

    if (subscriber.status === 'unsubscribed') {
      return page(
        'You are not on the list',
        'This address unsubscribed after that link was sent, so it has been left alone. Sign up again if you would like to rejoin.',
      )
    }

    if (subscriber.status !== 'subscribed') {
      await payload.update({
        collection: 'subscribers',
        id: subscriber.id,
        data: { status: 'subscribed' },
        overrideAccess: true,
      })
    }

    return page(
      'You are on the list',
      'One email when something new is published, and an unsubscribe link in every one.',
    )
  } catch (error) {
    /* The address is never logged: an error report is not a place for someone
       else's email. */
    console.error('[subscribe] failed to confirm a sign-up', error)
    return page(
      'That did not go through',
      'Something failed at our end. Try the link again in a moment, or write to clients@designally.co.',
      500,
    )
  }
}
