'use client'

import React from 'react'

import './SignIn.css'

/**
 * The door, and it is the same door as the other two products'.
 *
 * PORTED FROM designally-platform `src/app/sign-in/page.tsx`, which Content
 * Studio already ported once: the Cut with the Point sitting on it, the lockup,
 * one line saying what the product is for, and one pill. Three internal
 * products that share a Google Workspace login should not have three different
 * front doors, and this was the one still showing Payload's — a logo over a
 * card with a hidden password form inside it.
 *
 * IT IS RENDERED THROUGH `beforeLogin`, which is the only slot Payload offers
 * on this screen. So the composition arrives inside Payload's login card and
 * the card is taken apart around it in CSS — the brand block, the form and the
 * forgotten-password link are all hidden, and the page's own `<section>`
 * becomes the composition's container. See SignIn.css.
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
    <div className="da-signin">
      {/* THE CUT, WITH THE POINT ON IT. The brand's own graphic rather than a
          logo floating above a form: the rule is the same orange as the disc,
          so it reads as coming out of it rather than passing behind it. Above
          1080 the rule stands up and becomes the window's left rail, which is
          the platform's own signature composition. */}
      <div className="sl-cut">
        <span className="brandmark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Designally" height={256} src="/designally-mark.png" width={290} />
        </span>
      </div>

      <h1 className="sl-lockup">Designally Knowledge Hub</h1>

      {/* What the product is for, in the one place the team sees it stated. The
          Hub is where the public site's articles and downloads are written and
          filed; it does not write them for you. */}
      <p className="sl-line">The library the site is made of.</p>

      {reason ? (
        <p className="sl-error" role="alert">
          {reason}
        </p>
      ) : null}

      {/* A LINK, NOT A FORM. The other two products post to a server action;
          here the whole OAuth dance lives behind one GET, so this is an anchor
          to it. It carries the same class, the same shape and the same motion —
          the `form` the platform animates is this. */}
      <div className="sl-go">
        <a className="sl-cta" href="/auth/google">
          Continue with Google
        </a>
      </div>
    </div>
  )
}

export default SignIn
