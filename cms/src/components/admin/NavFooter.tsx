'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@payloadcms/ui'

import './NavFooter.css'

/**
 * The account, at the foot of the nav.
 *
 * IT CAME DOWN FROM THE TOP BAR, which carried an account popup on its right
 * and so was a control strip that also happened to show a breadcrumb. Who you
 * are now sits at the bottom of the column that says where you are, and the
 * header is left doing one job.
 *
 * THE LANGUAGE PAIR WAS HERE TOO and has moved on to the two screens where it
 * means something — see LocaleSwitch. It was global, and half the collections
 * it appeared on have no localized field at all.
 */
export function NavFooter() {
  const { user } = useAuth()

  const name = (user?.name as string | undefined)?.trim() || ''
  const email = (user?.email as string | undefined) || ''
  /* The name if there is one, otherwise the address — never "U" from a missing
     field, which tells you nothing about whose session this is. */
  const initials =
    (name || email)
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '·'

  return (
    <div className="da-navfoot">
      {/* Just the account. Sign out was here — first as Payload's own control
          and then as a glyph beside the avatar — and moved to the account
          screen it signs you out of, which is the page about who you are.
          See SignOut. */}
      <div className="da-navfoot__account">
        <Link className="da-navfoot__who-link" href="/admin/account">
          <span aria-hidden="true" className="da-navfoot__avatar">
            {initials}
          </span>
          <span className="da-navfoot__who">
            {name ? <span className="da-navfoot__name">{name}</span> : null}
            <span className="da-navfoot__email">{email}</span>
          </span>
        </Link>
      </div>
    </div>
  )
}
