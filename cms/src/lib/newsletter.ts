import { Resend } from 'resend'
import type { Payload } from 'payload'

import { siteURL } from './siteURL'
import { confirmToken, unsubscribeToken } from './unsubscribeToken'

/**
 * The email that goes out when something is published.
 *
 * IT IS INERT UNTIL IT IS CONFIGURED. With no `RESEND_API_KEY` this builds the
 * email, says what it would have done, and sends nothing — so a local database
 * and a preview deploy cannot mail anybody, and the publish flow is testable
 * long before the DNS is verified.
 *
 * `NEWSLETTER_TEST_TO` IS THE OTHER HALF OF THAT. Set it to your own address
 * and every send goes there and nowhere else, with the real subject, the real
 * template and the real article. It is the difference between believing this
 * works and having seen it.
 *
 * ONE PER PUBLISH, GUARDED BY A TIMESTAMP THE CALLER WRITES. Payload's
 * `afterChange` runs on every save, and an article is saved plenty of times
 * after it goes live — a typo fix at midday must not mail the list a second
 * time. See the hook in collections/newsletterOnPublish.
 *
 * BATCHED, BECAUSE A LIST IS NOT A LOOP. Resend takes 100 messages per call;
 * sending one request per subscriber would be 3,000 round trips on a list of
 * 3,000 and would pass Vercel's 60-second function ceiling long before that.
 * Each message is still addressed individually — nobody is BCC'd into a
 * stranger's inbox, and each carries its own unsubscribe link.
 */

const BATCH = 100

export type Announcement = {
  kind: 'article' | 'resource'
  title: string
  /** The one-line promise under the headline. Optional; some resources have none. */
  summary?: string
  /** Absolute or root-relative; made absolute before it is sent. */
  image?: string
  /** Root-relative path on the site, e.g. `/articles/how-grids-work`. */
  path: string
}

type Recipient = { email: string }

const absolute = (path?: string) =>
  !path ? undefined : path.startsWith('http') ? path : `${siteURL}${path}`

const escape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * The message. Table-based and inline-styled on purpose: every email client
 * that matters still renders like it is 2005, and a stylesheet in the head is
 * the first thing most of them throw away.
 */
export function render(item: Announcement, unsubscribeUrl: string): string {
  const url = `${siteURL}${item.path}`
  const image = absolute(item.image)
  const label = item.kind === 'article' ? 'New article' : 'New resource'

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escape(item.title)}</title></head>
<body style="margin:0;padding:0;background:#f9f6f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f4;padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;">
    ${
      image
        ? `<tr><td><img src="${escape(image)}" alt="" width="560" style="display:block;width:100%;height:auto;border:0;"/></td></tr>`
        : ''
    }
    <tr><td style="padding:32px 32px 8px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4a453d;">${label}</p>
      <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#12100d;font-weight:700;">${escape(item.title)}</h1>
      ${item.summary ? `<p style="margin:0 0 24px;font-size:16px;line-height:1.55;color:#4a453d;">${escape(item.summary)}</p>` : ''}
      <p style="margin:0 0 32px;">
        <a href="${escape(url)}" style="display:inline-block;padding:13px 22px;border-radius:999px;background:#12100d;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">Read it on the Hub</a>
      </p>
    </td></tr>
    <tr><td style="padding:0 32px 28px;">
      <p style="margin:0;font-size:13px;line-height:1.5;color:#4a453d;border-top:1px solid #e6e2dd;padding-top:20px;">
        You are getting this because you subscribed to the Designally Knowledge Hub.
        <a href="${escape(unsubscribeUrl)}" style="color:#4a453d;">Unsubscribe</a>.
      </p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
}

/** The plain-text half. A message with no text part is a message some clients score as spam. */
function renderText(item: Announcement, unsubscribeUrl: string): string {
  return [
    item.kind === 'article' ? 'New article' : 'New resource',
    '',
    item.title,
    item.summary ?? '',
    '',
    `Read it: ${siteURL}${item.path}`,
    '',
    '---',
    'You are getting this because you subscribed to the Designally Knowledge Hub.',
    `Unsubscribe: ${unsubscribeUrl}`,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
}

/** Everyone who has not left. */
async function recipients(payload: Payload): Promise<Recipient[]> {
  const { docs } = await payload.find({
    collection: 'subscribers',
    where: { status: { equals: 'subscribed' } },
    limit: 10000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    select: { email: true },
  })
  return docs.map((d) => ({ email: d.email })).filter((d) => Boolean(d.email))
}

export type SendResult = {
  sent: number
  skipped?: string
  testMode?: boolean
}

export async function announce(payload: Payload, item: Announcement): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.NEWSLETTER_FROM
  const testTo = process.env.NEWSLETTER_TEST_TO

  if (!key || !from) {
    console.info(
      `[newsletter] not configured — would have announced "${item.title}". ` +
        'Set RESEND_API_KEY and NEWSLETTER_FROM to send.',
    )
    return { sent: 0, skipped: 'not configured' }
  }

  /* One address, chosen by you, standing in for the whole list. */
  const list: Recipient[] = testTo ? [{ email: testTo }] : await recipients(payload)

  if (list.length === 0) {
    console.info(`[newsletter] nobody to tell about "${item.title}".`)
    return { sent: 0, skipped: 'no subscribers' }
  }

  const resend = new Resend(key)
  const subject = item.title
  let sent = 0

  for (let i = 0; i < list.length; i += BATCH) {
    const slice = list.slice(i, i + BATCH)

    const messages = slice.map((person) => {
      const unsubscribeUrl = `${siteURL}/api/unsubscribe?token=${unsubscribeToken(person.email)}`
      return {
        from,
        to: [person.email],
        subject,
        html: render(item, unsubscribeUrl),
        text: renderText(item, unsubscribeUrl),
        /* The header Gmail and Apple Mail turn into their own one-click
           unsubscribe control, above the message. Honouring it is what keeps
           "report spam" from being the easier option. */
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }
    })

    try {
      const { error } = await resend.batch.send(messages)
      if (error) {
        console.error('[newsletter] a batch was refused', error)
        continue
      }
      sent += slice.length
    } catch (error) {
      /* One failed batch is not a reason to abandon the rest of the list. */
      console.error('[newsletter] a batch threw', error)
    }
  }

  console.info(`[newsletter] announced "${item.title}" to ${sent} of ${list.length}.`)
  return { sent, ...(testTo ? { testMode: true } : {}) }
}


/* -------------------------------------------------------------------------- */
/* Confirming an address                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The one email that goes to an address nobody has confirmed yet.
 *
 * DOUBLE OPT-IN EXISTS BECAUSE A SIGN-UP FORM IS AN OPEN DOOR. Anyone can type
 * anyone else's address into it, and without a confirmation step that person is
 * on a list they never joined and starts receiving mail they will report as
 * spam — which is charged against the sending domain, not against whoever typed
 * it. A typo behaves the same way, quietly, at a stranger's address.
 *
 * It is also the only honest basis for the consent the list claims to have:
 * a confirmed address is a record that the person holding it said yes.
 *
 * NO UNSUBSCRIBE FOOTER, because there is nothing yet to unsubscribe FROM. An
 * address that never confirms is never mailed again — the request simply
 * expires by being ignored, which is what "unconfirmed" should mean.
 */
export async function sendConfirmation(email: string, locale: 'en' | 'th' = 'en'): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.NEWSLETTER_FROM
  const url = `${siteURL}/api/subscribe/confirm?token=${confirmToken(email)}`

  if (!key || !from) {
    /* Inert without configuration, like `announce` — but the link is printed,
       because otherwise a local sign-up could never be completed and the whole
       flow would be untestable without a live mail provider. */
    console.info(`[subscribe] not configured — confirmation link would be: ${url}`)
    return false
  }

  const heading = locale === 'th' ? 'ยืนยันการสมัครรับข่าวสาร' : 'Confirm your subscription'
  const body =
    locale === 'th'
      ? 'มีการใช้อีเมลนี้สมัครรับจดหมายข่าวจาก Designally Knowledge Hub หากใช่ กรุณายืนยัน'
      : 'This address was used to sign up for the Designally Knowledge Hub newsletter. If that was you, confirm it below.'
  const action = locale === 'th' ? 'ยืนยันอีเมล' : 'Confirm my email'
  const ignore =
    locale === 'th'
      ? 'หากไม่ใช่คุณ ไม่ต้องทำอะไร เราจะไม่ส่งอีเมลถึงที่อยู่นี้อีก'
      : 'If it was not you, do nothing. This address will not be mailed again.'

  const html = `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escape(heading)}</title></head>
<body style="margin:0;padding:0;background:#f9f6f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f4;padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;">
    <tr><td style="padding:32px 32px 8px;">
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#12100d;font-weight:700;">${escape(heading)}</h1>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.55;color:#4a453d;">${escape(body)}</p>
      <p style="margin:0 0 28px;">
        <a href="${escape(url)}" style="display:inline-block;padding:13px 22px;border-radius:999px;background:#12100d;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">${escape(action)}</a>
      </p>
      <p style="margin:0 0 32px;font-size:13px;line-height:1.5;color:#4a453d;">${escape(ignore)}</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`

  const text = [heading, '', body, '', url, '', ignore].join('\n')

  try {
    const resend = new Resend(key)
    const { error } = await resend.emails.send({ from, to: [email], subject: heading, html, text })
    if (error) {
      console.error('[subscribe] the confirmation was refused', error)
      return false
    }
    return true
  } catch (error) {
    console.error('[subscribe] the confirmation threw', error)
    return false
  }
}
