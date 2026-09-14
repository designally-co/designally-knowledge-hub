'use client'

import React from 'react'

import './SignIn.css'

/**
 * The door, and it is Article Studio's door.
 *
 * PORTED FROM Content Studio `src/app/login/page.tsx`, which retired the
 * platform's Cut-and-Point composition for one made of what every other screen
 * is made of: one white plate on the ground, the flat mark, an eyebrow, a
 * heading in the display face, a deck, and the primary button. The Hub carried
 * the retired one; two products behind one Google Workspace login should not
 * have two different front doors.
 *
 * IT IS RENDERED THROUGH `beforeLogin`, which is the only slot Payload offers
 * on this screen. So the composition arrives inside Payload's login card and
 * the card is taken apart around it in CSS — the brand block, the form and the
 * forgotten-password link are all hidden, and the page's own `<section>`
 * becomes the ground the plate sits on. See SignIn.css.
 *
 * ONE WAY IN. Google on a Designally account. The password endpoint still
 * exists — `POST /api/users/login` is the recovery path if the OAuth client is
 * ever misconfigured in production — but it has no form in front of it, because
 * a second way in that is only sometimes correct is the one nobody checks.
 */

/* Why the last attempt failed, in the words of the thing that failed. `/auth/google`
   redirects back here with `?sso=<code>` rather than dropping somebody at a
   blank door with no idea whether it was them or us. */
const REASONS: Record<string, string> = {
  cancelled: 'Sign-in was cancelled.',
  domain: 'Use a Designally account. Personal Google accounts cannot sign in here.',
  exchange: 'Could not complete sign-in with Google. Try again.',
  nocode: 'Google did not complete the sign-in. Try again.',
  state: 'That sign-in link had expired. Try again.',
  unconfigured: 'Google sign-in is not configured on this deployment.',
}

export const SignIn: React.FC = () => {
  const [reason, setReason] = React.useState<null | string>(null)

  /* Read in an effect, not during render: this is a client component inside a
     server-rendered page, and the query string is not something the server
     rendering this markup can be asked for. */
  React.useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('sso')
    if (code) setReason(REASONS[code] || 'Sign-in failed. Try again.')
  }, [])

  return (
    /* THE PLATE. The dock's own vocabulary — white, a hairline, the 16px
       corner — at the width of a form. No shadow: elevation here is
       structural, and the hairline is what says "object" on this ground. */
    <section aria-labelledby="signin-title" className="da-signin">
      {/* The flat mark, the one the side nav carries: the D in ink, the full
          stop in the accent. */}
      <span aria-label="Designally" className="da-signin__mark" role="img">
        <i className="da-signin__mark-d" />
        <i className="da-signin__mark-dot" />
      </span>

      {/* Eyebrow, heading, deck — the side nav's lockup and every page heading
          are built from these same lines. */}
      <p className="da-signin__eyebrow">Designally</p>
      <h1 className="da-signin__title" id="signin-title">
        Knowledge Hub
      </h1>
      {/* What the product is for. The Hub is where the public site's articles
          and downloads are written and filed; it does not write them for you. */}
      <p className="da-signin__deck">The library the site is made of.</p>

      {reason ? (
        <p className="da-signin__error" role="alert">
          {reason}
        </p>
      ) : null}

      {/* A LINK, NOT A FORM. Studio posts to a server action; here the whole
          OAuth dance lives behind one GET, so this is an anchor to it, drawn
          as the primary button: full width, the accent, eight pixels. */}
      <a className="da-signin__cta" href="/auth/google">
        <GoogleGlyph />
        Continue with Google
      </a>

      {/* Who can come in, stated under the door rather than discovered at it. */}
      <p className="da-signin__note">Designally Google Workspace accounts only.</p>
    </section>
  )
}

/** Google's "G", in one colour — the button's own white, so the glyph sits on
 *  the accent the way every icon on an accent button does. */
function GoogleGlyph() {
  return (
    <svg aria-hidden className="da-signin__glyph" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7zM12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24zM5.3 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l3.9-3.1zM12 4.7c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.5l3.9 3.1c1-2.8 3.6-4.9 6.7-4.9z" />
    </svg>
  )
}

export default SignIn
