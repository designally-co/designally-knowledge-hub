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
 * Hosts this app may build a redirect URI for.
 *
 * The Host header is attacker-controllable in principle, so it is checked
 * rather than trusted: a forged one could otherwise make us hand Google a
 * redirect_uri pointing somewhere else. Google would reject it for not being
 * registered, but "the other side catches it" is not a reason to send it.
 */
const TRUSTED_HOST = /^(localhost|([a-z0-9-]+\.)*designally\.co|([a-z0-9-]+\.)*vercel\.app)$/i

/**
 * This deployment's own origin, for building the redirect URI.
 *
 * IT FOLLOWS THE HOST YOU ARE ACTUALLY ON. It used to prefer `SITE_URL` and
 * then Vercel's production hostname, falling back to the request only if
 * neither was set — which meant that signing in from a second domain sent
 * Google the FIRST domain's callback. The round trip then started on one host
 * and finished on another, the `state` cookie was scoped to the host it
 * started on, and the callback could not find it. What the reader saw was
 * "that sign-in link had expired" on a domain they had not asked for. Nothing
 * had expired and nothing was misconfigured in Google; the two halves of the
 * handshake were simply on different hosts.
 *
 * Preferring the request's own origin makes every domain the app is served on
 * work by itself, which is what having more than one domain means. Each origin
 * still needs its callback registered — Google allows no wildcards:
 *   http://localhost:3000/auth/google/callback
 *   https://designally-knowledge-hub.vercel.app/auth/google/callback
 *   https://hub.designally.co/auth/google/callback
 *
 * `SITE_URL` remains as the override for a host we would not otherwise trust —
 * a proxy that rewrites Host, say — and as the answer when the request origin
 * is not one of ours.
 */
export function originFrom(req: Request): string {
  const requested = new URL(req.url)
  if (TRUSTED_HOST.test(requested.hostname)) return requested.origin
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return requested.origin
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
