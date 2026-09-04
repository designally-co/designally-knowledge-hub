import { getPayload } from 'payload'
import config from '@payload-config'

import { LOCALES, type Locale } from '@/lib/i18n'
import { sendConfirmation } from '@/lib/newsletter'

/**
 * The newsletter form's other half.
 *
 * WHY A ROUTE AND NOT A SERVER ACTION. The form is a client component inside a
 * band that appears on nearly every page; a route keeps the submit a plain
 * `fetch` with a JSON reply, which is what lets the button show "thanks" or an
 * error without a navigation. It sits at `/api/subscribe` rather than under
 * Payload's `/api/[...slug]` catch-all — see the note in searchHub about not
 * arguing with that route for a path.
 *
 * IT SAYS THE SAME THING TO AN ALREADY-SUBSCRIBED ADDRESS as to a new one.
 * Telling a stranger "that email is already on the list" turns the form into a
 * way to test whether someone subscribed, which is theirs to know and not the
 * internet's. Both answers are 200 and the same sentence.
 *
 * NOBODY JOINS THE LIST BY BEING TYPED INTO IT. A sign-up creates a `pending`
 * row and sends one confirmation email; only the link in it makes an address a
 * subscriber. Anyone can type anyone else's address into a public form, and
 * without this that person receives mail they never asked for and reports it as
 * spam — which is charged to the sending domain. It is also the only honest
 * basis for the consent this list claims: a confirmed address is a record that
 * the person holding it said yes.
 *
 * THE HONEYPOT IS THE BOT DEFENCE, and a deliberately modest one. A field no
 * human can see, filled in by anything crawling the DOM; when it has a value
 * the request is accepted and dropped. It costs a bot nothing to defeat if it
 * is looking, but most are not — and the alternative, a CAPTCHA, is a tax on
 * every real person to stop the few who are.
 */

type Body = {
  email?: unknown
  locale?: unknown
  source?: unknown
  /** The honeypot. Any value means "not a person". */
  company?: unknown
}

/* Deliberately permissive: an address either routes or it does not, and the
   only way to know is to send to it. This rejects what is obviously not an
   address rather than adjudicating the ones that are unusual. */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* One sentence for every outcome a stranger could provoke — new address,
   pending, already subscribed, honeypot. Saying anything more specific would
   turn the form into a way to test whether a given person is on the list. */
const CHECK_INBOX = 'Thanks — check your inbox to confirm.'

const reply = (ok: boolean, message: string, status = 200) =>
  Response.json({ ok, message }, { status })

export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return reply(false, 'That did not arrive as expected. Try again.', 400)
  }

  /* Accepted and dropped: a bot told it failed learns what to change. */
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return reply(true, CHECK_INBOX)
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!LOOKS_LIKE_EMAIL.test(email)) {
    return reply(false, 'That does not look like an email address.', 400)
  }

  const locale: Locale =
    typeof body.locale === 'string' && (LOCALES as readonly string[]).includes(body.locale)
      ? (body.locale as Locale)
      : 'en'
  const source = typeof body.source === 'string' ? body.source.slice(0, 200) : undefined

  try {
    const payload = await getPayload({ config })

    /* Already here? Say the same thing and change nothing — except to bring
       someone who had unsubscribed back, which is what asking again means. */
    const { docs } = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (docs[0]) {
      /* ALREADY CONFIRMED: nothing to do, and nothing to say that would
         distinguish this case from a new address. Re-sending a confirmation to
         someone already on the list would be mail they did not ask for. */
      if (docs[0].status === 'subscribed') return reply(true, CHECK_INBOX)

      /* Pending, or previously unsubscribed and asking again. Both mean the
         same thing — prove the address — so both get a fresh link. Coming back
         after leaving requires confirming again: the earlier `unsubscribed` is
         a record that they once said no, and only a new yes overrides it. */
      await payload.update({
        collection: 'subscribers',
        id: docs[0].id,
        data: { status: 'pending', locale },
        overrideAccess: true,
      })
      await sendConfirmation(email, locale)
      return reply(true, CHECK_INBOX)
    }

    await payload.create({
      collection: 'subscribers',
      data: { email, locale, source, status: 'pending' },
      overrideAccess: true,
    })
    /* The row is written first and the mail sent after, so a mail provider
       having a bad minute loses the email and not the request — asking again
       re-sends it. */
    await sendConfirmation(email, locale)

    return reply(true, CHECK_INBOX)
  } catch (error) {
    /* The address is never logged: an error report is not a place for someone
       else's email. */
    console.error('[subscribe] failed to record a sign-up', error)
    return reply(false, 'Something went wrong at our end. Try again in a moment.', 500)
  }
}
