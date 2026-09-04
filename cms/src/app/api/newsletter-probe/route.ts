import crypto from 'crypto'
import { Resend } from 'resend'

/**
 * Ask Resend why it refused, and say so out loud.
 *
 * WHY THIS EXISTS. The send is deliberately quiet — it must never break a
 * publish — so a refusal is logged and swallowed. That is right for a writer
 * pressing Save and useless for anyone trying to find out what is wrong: an
 * article published, no email arrived, and the only record was a line in a
 * runtime log nobody watching the site can reach. This endpoint performs the
 * same send and RETURNS the error instead of hiding it.
 *
 * IT IS SIGNED, NOT PUBLIC. It sends real mail, so an open URL would be a way
 * for a stranger to fill an inbox. The caller must present an HMAC of a fixed
 * string under `PAYLOAD_SECRET` — the same secret the unsubscribe links are
 * signed with. No new secret, nothing to store, and nobody without it can fire
 * this.
 *
 * IT ONLY EVER MAILS `NEWSLETTER_TEST_TO`. Not the list, not an address from
 * the query string — one address, chosen in the environment, or nothing at all.
 * A diagnostic that can be pointed at an arbitrary recipient is a spam relay.
 *
 * DELETE IT once the newsletter is known to work. It is a splint, not a limb.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const expected = () =>
  crypto
    .createHmac('sha256', process.env.PAYLOAD_SECRET || '')
    .update('newsletter-probe')
    .digest('base64url')

export async function GET(request: Request) {
  const given = new URL(request.url).searchParams.get('sig') ?? ''
  const want = expected()

  const a = Buffer.from(given)
  const b = Buffer.from(want)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return Response.json({ ok: false, error: 'bad signature' }, { status: 403 })
  }

  const key = process.env.RESEND_API_KEY
  const from = process.env.NEWSLETTER_FROM
  const to = process.env.NEWSLETTER_TEST_TO

  if (!key || !from || !to) {
    return Response.json({
      ok: false,
      stage: 'config',
      hasKey: Boolean(key),
      hasFrom: Boolean(from),
      hasTestTo: Boolean(to),
    })
  }

  const resend = new Resend(key)

  /* The single-message endpoint first: its errors are the clearest, and if the
     account cannot send at all this is where it says so. */
  const single = await resend.emails
    .send({
      from,
      to: [to],
      subject: 'Hub newsletter probe',
      html: '<p>If this arrived, sending works.</p>',
      text: 'If this arrived, sending works.',
    })
    .then((r) => ({ id: r.data?.id ?? null, error: r.error ?? null }))
    .catch((e: unknown) => ({ id: null, error: { threw: String(e).slice(0, 300) } }))

  /* Then the batch path the newsletter actually uses, with the same headers,
     because a difference between the two IS the answer. */
  const batch = await resend.batch
    .send([
      {
        from,
        to: [to],
        subject: 'Hub newsletter probe (batch)',
        html: '<p>Batch path.</p>',
        text: 'Batch path.',
        headers: {
          'List-Unsubscribe': '<https://example.com/unsub>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      },
    ])
    .then((r) => ({ ok: !r.error, error: r.error ?? null }))
    .catch((e: unknown) => ({ ok: false, error: { threw: String(e).slice(0, 300) } }))

  return Response.json({
    ok: !single.error && batch.ok,
    from,
    single,
    batch,
  })
}
