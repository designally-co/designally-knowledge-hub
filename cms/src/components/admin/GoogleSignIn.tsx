'use client'

import React from 'react'

import './GoogleSignIn.css'

/**
 * "Continue with Google" above Payload's login form.
 *
 * Rendered through `admin.components.beforeLogin`. The email/password form that
 * used to sit under it is hidden — see the login rules in custom.scss for why
 * it is hidden rather than disabled.
 *
 * The mark and the wording match Content Studio's sign-in, which took them from
 * the platform, so the three products introduce themselves the same way.
 */

const REASONS: Record<string, string> = {
  unconfigured: 'Google sign-in is not configured on this deployment.',
  cancelled: 'Sign-in was cancelled.',
  nocode: 'Google did not complete the sign-in. Try again.',
  state: 'That sign-in link had expired. Try again.',
  exchange: 'Could not complete sign-in with Google. Try again.',
  domain: `Use a Designally account. Personal Google accounts cannot sign in here.`,
}

export const GoogleSignIn: React.FC = () => {
  const [reason, setReason] = React.useState<string | null>(null)

  React.useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('sso')
    if (code) setReason(REASONS[code] || 'Sign-in failed. Try again.')
  }, [])

  return (
    <div className="da-sso">
      {reason ? (
        <p className="da-sso__error" role="alert">
          {reason}
        </p>
      ) : null}

      <a className="da-sso__btn" href="/auth/google">
        Continue with Google
      </a>

      <p className="da-sso__note">Designally accounts only.</p>
    </div>
  )
}

export default GoogleSignIn
