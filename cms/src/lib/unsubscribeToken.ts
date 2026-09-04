import crypto from 'crypto'

/**
 * The link at the foot of every newsletter.
 *
 * IT IS NOT OPTIONAL. Marketing email owes a working one-click way out under
 * UK and EU law and under Thailand's PDPA, and a list that cannot be left is
 * also the fastest way to be marked as spam by the people who wanted to leave.
 *
 * A SIGNATURE, NOT A STORED TOKEN. The alternative is a random string saved on
 * each subscriber, which means a column to migrate, a lookup on every click and
 * a decision about expiry. An HMAC of the address needs none of that: the link
 * proves the server issued it, the address is right there in it, and nothing
 * has to be remembered between sending and clicking.
 *
 * IT DOES NOT EXPIRE, deliberately. Someone unsubscribing from a two-year-old
 * email is exactly the person who most wants out, and an expired link would
 * hand them a dead end instead.
 *
 * THE SECRET IS PAYLOAD'S OWN. It is already required, already secret, and
 * already rotated as one thing; a second secret would be a second thing to
 * forget. Rotating it invalidates outstanding links, which is a real cost —
 * anyone who then clicks an old one is told the link is no longer valid rather
 * than being silently ignored.
 */

const secret = () => process.env.PAYLOAD_SECRET || ''

const sign = (email: string) =>
  crypto.createHmac('sha256', secret()).update(email.toLowerCase()).digest('base64url')

/** `email:signature`, base64url so it survives a query string untouched. */
export function unsubscribeToken(email: string): string {
  return `${Buffer.from(email.toLowerCase()).toString('base64url')}.${sign(email)}`
}

/** The address a token vouches for, or null if it vouches for nothing. */
export function emailFromToken(token: string): string | null {
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  let email: string
  try {
    email = Buffer.from(encoded, 'base64url').toString('utf8')
  } catch {
    return null
  }

  const expected = sign(email)
  /* Constant time: a plain `===` leaks how much of a forged signature was
     right, one character at a time. */
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  return email
}
