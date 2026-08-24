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
  const payload = await getPayload({ config })

  /* Find or create. Matching on email is what lets an existing account keep its
     identity — and its API key, if it holds the one Content Studio publishes
     with. A new record is only made for an address that has never signed in.

     Everyone on the domain is an admin, which is this CMS's whole access model:
     there are no roles to assign, so there is nothing to set here. */
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  let user = existing.docs[0]
  if (!user) {
    user = await payload.create({
      collection: 'users',
      data: {
        email,
        // Payload requires a password on the local strategy even for an account
        // that will never use one. A long random value nobody holds is the
        // point: it cannot be guessed and it is never written down. When step 2
        // disables the local strategy this becomes moot.
        password: crypto.randomUUID() + crypto.randomUUID(),
      },
      overrideAccess: true,
    })
  }

  /* Hand over to Payload. From here the session is an ordinary Payload session
     — same cookie, same expiry, same everything a password login produces. */
  const collectionConfig = payload.collections.users.config

  /* A SESSION ROW, not just a token. Payload 3 defaults `auth.useSessions` to
     true, and its JWT strategy then refuses any token whose `sid` claim does
     not match a session stored on the user — so a correctly signed token with
     no `sid` authenticates as nobody, silently. That was this route's second
     bug, and it presents identically to the first: sign-in completes, the
     redirect lands, and you are still logged out. */
  const localReq = await createLocalReq({}, payload)
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
