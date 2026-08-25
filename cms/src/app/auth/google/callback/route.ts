import { createLocalReq, getFieldsToSign, getPayload, jwtSign } from 'payload'
import { addSessionToUser, generatePayloadCookie } from 'payload/shared'
import { NextResponse } from 'next/server'

import config from '@payload-config'
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  STATE_COOKIE,
  decodeIdToken,
  googleConfigured,
  isAllowed,
  originFrom,
  redirectURI,
} from '../../../../lib/googleAuth'

/** Every failure lands back on the login page saying which step failed. The
 *  reasons are deliberately coarse — enough to debug, not enough to tell
 *  someone probing it whether an address exists. */
const fail = (origin: string, reason: string) =>
  NextResponse.redirect(`${origin}/admin/login?sso=${reason}`)

export async function GET(req: Request) {
  const origin = originFrom(req)
  if (!googleConfigured) return fail(origin, 'unconfigured')

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  if (url.searchParams.get('error')) return fail(origin, 'cancelled')
  if (!code) return fail(origin, 'nocode')

  // CSRF: the state must match the cookie set when the flow started.
  const cookieState = req.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.split('=')[1]
  if (!state || !cookieState || state !== cookieState) return fail(origin, 'state')

  // Exchange the code. This is server-to-server and authenticated with the
  // client secret, which is what makes the id_token that comes back trustworthy
  // without a separate signature check.
  let idToken: string | undefined
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectURI(origin),
      }),
    })
    if (!res.ok) return fail(origin, 'exchange')
    idToken = ((await res.json()) as { id_token?: string }).id_token
  } catch {
    return fail(origin, 'exchange')
  }
  if (!idToken) return fail(origin, 'exchange')

  const claims = decodeIdToken(idToken)
  if (!isAllowed(claims)) return fail(origin, 'domain')

  const email = claims.email.toLowerCase()

  try {
    return await issueSession(email)
  } catch (err) {
    /* WHY THE MESSAGE IS SHOWN RATHER THAN SWALLOWED.
     *
     * Everything below this point runs against Payload, and an uncaught throw
     * there is a blank 500 with no `?sso=` reason and nothing on the page — the
     * least debuggable outcome this route has, and the one it actually produced
     * in production. Vercel's logs hold the stack, but the person who cannot
     * sign in is rarely the person who can read them.
     *
     * Showing the message is safe HERE specifically, and nowhere earlier: this
     * line is only reachable after `isAllowed` has passed, which means the
     * caller has already completed a Google sign-in as a verified
     * designally.co account. There is no anonymous path to this text.
     */
    const message = err instanceof Error ? err.message : String(err)
    return new NextResponse(
      `<!doctype html><meta charset="utf-8"><title>Sign-in failed — Designally Hub</title>
<div style="font:14px/1.6 system-ui;max-width:44rem;padding:3rem 2rem">
<h1 style="font-size:1.25rem;margin:0 0 .5rem">Signed in with Google, but the Hub could not start a session.</h1>
<p style="color:#555;margin:0 0 1.5rem">Google accepted the account. The failure is on this side.</p>
<pre style="white-space:pre-wrap;background:#f5f3ee;border-radius:8px;padding:1rem;font:12px/1.5 ui-monospace,monospace">${message.replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;'))}</pre>
<p style="margin-top:1.5rem"><a href="/admin/login">Back to sign in</a></p>
</div>`,
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }
}

/** The Payload half of the callback: find-or-create, then issue a session. */
async function issueSession(email: string): Promise<NextResponse> {
  const payload = await getPayload({ config })
  const collectionConfig = payload.collections.users.config
  const localReq = await createLocalReq({}, payload)

  /* THE RAW ROW, NOT THE COLLECTION API'S VIEW OF IT — and this is load-bearing.
   *
   * `addSessionToUser` does not write a session row. It appends to `user.sessions`
   * and writes THE WHOLE USER DOCUMENT back:
   *
   *     await payload.db.updateOne({ id: user.id, data: user, … })
   *                                  — payload/src/auth/sessions.ts
   *
   * That is the database layer, so no beforeChange hooks run and nothing is
   * re-encrypted. Hand it a document that came from `payload.find()` and the
   * afterRead hook has already DECRYPTED `apiKey` — so signing in writes the
   * plaintext key back over the encrypted one.
   *
   * The account then destroys its own ability to sign in. Every later read of
   * that user throws `Invalid initialization vector` (a raw key is not
   * `iv(32 hex) + ciphertext`), including the `payload.findByID` inside
   * `JWTAuthentication` — which swallows it and returns `user: null`. Sign-in
   * completes, the cookie is set and valid, and the admin bounces to the login
   * screen anyway. That is this route's third bug of exactly this shape.
   *
   * Reading through `payload.db` skips the field hooks in both directions, so
   * the encrypted value goes back exactly as it came out. It also means `user`
   * here is a raw row — fine, since all that is needed below is `id` and `email`.
   *
   * Only accounts with an API key were ever affected, which is why this stayed
   * hidden: the CMS worked for months, then broke the moment a key was enabled
   * on the account people actually sign in with.
   */
  let user = await payload.db.findOne({
    collection: 'users',
    where: { email: { equals: email } },
    req: localReq,
  })

  /* Matching on email is what lets an existing account keep its identity — and
     its API key, if it holds the one Content Studio publishes with. A new record
     is only made for an address that has never signed in.

     Everyone on the domain is an admin, which is this CMS's whole access model:
     there are no roles to assign, so there is nothing to set here. */
  if (!user) {
    await payload.create({
      collection: 'users',
      data: {
        email,
        // Payload requires a password on the local strategy even for an account
        // that will never use one. A long random value nobody holds is the
        // point: it cannot be guessed and it is never written down.
        password: crypto.randomUUID() + crypto.randomUUID(),
      },
      overrideAccess: true,
    })
    // Re-read raw, so the session write below goes through the same path as an
    // existing account rather than a second, subtly different one.
    user = await payload.db.findOne({
      collection: 'users',
      where: { email: { equals: email } },
      req: localReq,
    })
  }

  /* Hand over to Payload. From here the session is an ordinary Payload session
     — same cookie, same expiry, same everything a password login produces.

     A SESSION ROW, not just a token. Payload 3 defaults `auth.useSessions` to
     true, and its JWT strategy then refuses any token whose `sid` claim does
     not match a session stored on the user — so a correctly signed token with
     no `sid` authenticates as nobody, silently. That was this route's second
     bug, and it presents identically to the first: sign-in completes, the
     redirect lands, and you are still logged out. */
  const { sid } = await addSessionToUser({
    collectionConfig,
    payload,
    req: localReq,
    user: user as Parameters<typeof addSessionToUser>[0]['user'],
  })

  const fieldsToSign = getFieldsToSign({
    collectionConfig,
    email,
    sid,
    user: { ...user, collection: 'users' } as Parameters<typeof getFieldsToSign>[0]['user'],
  })

  const { token } = await jwtSign({
    fieldsToSign,
    secret: payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  })

  const cookie = generatePayloadCookie({
    collectionAuthConfig: collectionConfig.auth,
    cookiePrefix: payload.config.cookiePrefix,
    returnCookieAsObject: false,
    token,
  })

  /* BOTH cookies go on as raw headers. Mixing the two APIs does not work:
     appending a Set-Cookie header and then calling `res.cookies.set()` on the
     same response drops the appended one — and, measured on this version of
     Next, drops BOTH, leaving no Set-Cookie header at all.

     That was this route's first bug, and it was invisible from the outside:
     the sign-in completed, the redirect landed on /admin, and an editor who
     already had a session simply stayed logged in under the old one. It was
     only caught by reading the session's own expiry and finding it predated
     the Google round trip. */
  /* A PAGE, NOT A REDIRECT — and this is the subtle one.

     Payload's `extractJWT` refuses a cookie on a request whose
     `Sec-Fetch-Site` is `cross-site`. Redirecting straight to /admin from here
     keeps the browser inside the navigation Google started, so that header is
     `cross-site` all the way through the redirect chain: the cookie is set
     correctly, then discarded on the very next request, and the admin bounces
     to the login screen. Measured — the same token authenticates under
     `same-origin` and `none`, and is rejected under `cross-site`.

     So the hand-off is a document served from this origin which then navigates
     itself. That second navigation is initiated by this page, making it
     `same-origin`, and the cookie is accepted. The meta refresh is the
     fallback for a browser with scripting disabled. */
  const html = `<!doctype html><meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=/admin">
<title>Signing in…</title>
<p style="font:14px/1.5 system-ui;padding:2rem">Signing in… <a href="/admin">continue</a></p>
<script>location.replace('/admin')</script>`

  const res = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  res.headers.append('Set-Cookie', cookie)
  res.headers.append(
    'Set-Cookie',
    `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
  )
  return res
}
