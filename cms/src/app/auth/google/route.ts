import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'

import {
  GOOGLE_CLIENT_ID,
  STATE_COOKIE,
  STATE_MAX_AGE,
  ALLOWED_DOMAIN,
  googleConfigured,
  originFrom,
  redirectURI,
} from '../../../lib/googleAuth'

/** Start the sign-in: hand the browser to Google. */
export function GET(req: Request) {
  const origin = originFrom(req)

  if (!googleConfigured) {
    // Fails closed, and says which variables are missing rather than showing a
    // broken Google page. Email/password still works, which is the whole point
    // of shipping this alongside it.
    return NextResponse.redirect(`${origin}/admin/login?sso=unconfigured`)
  }

  /* CSRF. The state is a one-time value held in an httpOnly cookie and compared
     on the way back, so a callback someone else initiated cannot log you in. */
  const state = randomUUID()

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectURI(origin),
    response_type: 'code',
    scope: 'openid email profile',
    // Narrows the account chooser to the workspace. NOT a security control —
    // it is a hint the client can drop, which is why the `hd` claim is checked
    // again on the way back.
    hd: ALLOWED_DOMAIN,
    prompt: 'select_account',
    state,
  })

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: origin.startsWith('https://'),
    path: '/',
    maxAge: STATE_MAX_AGE,
  })
  return res
}
