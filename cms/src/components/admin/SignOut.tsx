'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth, useDocumentInfo } from '@payloadcms/ui'

import './SignOut.css'

/**
 * Signing out, on the account it signs you out of.
 *
 * IT WAS IN THE NAV, twice over — first as Payload's own control at the bottom
 * of the column, then as a glyph beside the avatar. Both put the one action
 * that ends the session permanently on screen, a few pixels from the four links
 * used all day. It belongs on the account screen, which is the page about who
 * you are and the only place you would go looking for it.
 *
 * ONLY ON YOUR OWN ACCOUNT. This is a field on the Users collection, so it
 * renders on every user document — including someone else's, where a "Sign out"
 * button would either be a lie or a trap. It compares the document being edited
 * with the signed-in user and renders nothing when they differ.
 *
 * A LABEL, NOT A GLYPH. The rule elsewhere in this admin is an icon unless a
 * word is required; a word is required here. The door glyph read as "log out"
 * only because it sat beside an avatar — alone on a settings page, with no
 * neighbouring context, it would be a guess.
 */
export function SignOut() {
  const { user } = useAuth()
  const { id } = useDocumentInfo()

  /* Both are compared as strings: the document id arrives as a number from a
     Postgres collection and as a string elsewhere, and `1 !== '1'` would hide
     the control on exactly the account it belongs to. */
  if (!user?.id || id === undefined || String(user.id) !== String(id)) return null

  return (
    <div className="da-signout">
      <p className="da-signout__note">You are signed in as {user.email}.</p>
      <Link className="da-signout__btn" href="/admin/logout">
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          viewBox="0 0 24 24"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="m16 17 5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        Sign out
      </Link>
    </div>
  )
}
