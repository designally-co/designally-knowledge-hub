/**
 * Google sign-in for the CMS admin.
 *
 * WHY NOT NEXTAUTH, which is what Content Studio uses: the Hub is Payload, and
 * Payload already has a session, a cookie and a user collection. Adding NextAuth
 * would mean two session systems to keep in step — and it wants to live under
 * `/api/*`, which Payload already owns through `(payload)/api/[...slug]`.
 *
 * So the exchange happens here and the result is handed to Payload: find or
 * create the user, sign PAYLOAD's own token, set PAYLOAD's own cookie. From
 * that point every request authenticates exactly as it did with a password, and
 * nothing downstream — access control, `req.user`, the API key CG publishes
 * with — knows anything changed.
 */

export const ALLOWED_DOMAIN = 'designally.co'

/** The same client as Content Studio, so there is one consent screen to manage. */
export const GOOGLE_CLIENT_ID = process.env.AUTH_GOOGLE_ID || ''
export const GOOGLE_CLIENT_SECRET = process.env.AUTH_GOOGLE_SECRET || ''

export const googleConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET)

/** Guards the OAuth `state` cookie. Short-lived; it only spans the redirect. */
export const STATE_COOKIE = 'da-oauth-state'
export const STATE_MAX_AGE = 600 // seconds

/**
 * This deployment's own origin, for building the redirect URI.
 *
 * It has to match a URI registered on the OAuth client EXACTLY, and Google
 * allows no wildcards — so this is derived rather than guessed, and the two
 * registered values are:
 *   http://localhost:3000/auth/google/callback
 *   https://designally-knowledge-hub.vercel.app/auth/google/callback
 */
export function originFrom(req: Request): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return new URL(req.url).origin
}

export const redirectURI = (origin: string) => `${origin}/auth/google/callback`

type IdTokenClaims = {
  email?: string
  email_verified?: boolean | string
  hd?: string
  name?: string
}

/**
 * Read the claims out of an id_token.
 *
 * Deliberately a decode rather than a signature verification. This token did
 * not arrive from the browser — it came back on our own server-to-server POST
 * to Google's token endpoint, authenticated with the client secret over TLS.
 * Verifying a signature on a document a trusted party just handed us directly
 * adds a JWKS fetch and no security. (An id_token arriving any OTHER way — from
 * a client, from a redirect fragment — would have to be verified properly.)
 */
export function decodeIdToken(idToken: string): IdTokenClaims | null {
  const parts = idToken.split('.')
  if (parts.length !== 3) return null
  try {
    const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
      'utf8',
    )
    return JSON.parse(json) as IdTokenClaims
  } catch {
    return null
  }
}

/**
 * The domain gate, in three parts — the same one Content Studio uses.
 *
 * One check is not enough. `hd` on the authorisation request only narrows the
 * account chooser and can be ignored; the `hd` CLAIM is what Google asserts
 * server-side, and it is absent for personal accounts. And a personal Gmail
 * address can end in the right characters, so the address is checked too.
 */
export function isAllowed(claims: IdTokenClaims | null): claims is IdTokenClaims & { email: string } {
  if (!claims?.email) return false
  const verified = claims.email_verified === true || claims.email_verified === 'true'
  if (!verified) return false
  if (claims.hd !== ALLOWED_DOMAIN) return false
  return claims.email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)
}
