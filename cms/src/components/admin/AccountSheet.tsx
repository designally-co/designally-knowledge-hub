'use client'

import React from 'react'
import { useAuth } from '@payloadcms/ui'

import { ApiKeyBox, useApiAccess } from './ApiAccess'
import { Dialog } from './ConfirmDialog'
import { Switch } from './Switch'
import { TranslationModel } from './TranslationModel'

import './AccountSheet.css'

/**
 * Your account, as a sheet over wherever you are — not a page you leave for.
 *
 * WHAT A PAGE WAS FOR, THERE IS NOTHING LEFT OF. The account screen was
 * Payload's document form for the signed-in user: an email input, a password
 * section this admin refuses, a language select with one option, and the API
 * key. The address is the Google account's and cannot be changed; there is no
 * password; there is one language. What is left is who you are and whether
 * the account holds the key Content Studio publishes with — an address, its
 * role as a chip beside it, and one switch, which is a sheet's worth, opened
 * from the account menu and closed back onto the work. When the account was
 * made was here too, and nobody needed it.
 *
 * THE ADDRESS IS PRINTED, NOT OFFERED. It is the account's identity: the Google
 * callback finds the account by it, and a renamed address would sign in to a
 * new, empty account. It is also locked where it is stored (`access.update` on
 * the field, Users.ts), so this is not the only thing stopping it.
 *
 * Above the key, which Claude model writes the Thai translations — a setting for the
 * whole Hub rather than this account, kept here because this is where the
 * people who run it already look (TranslationModel.tsx).
 *
 * THE SWITCH WRITES WHEN IT MOVES, as it does on the user list — the sheet ends
 * in Done, and with nothing to cancel to there is nothing to hold back.
 */
export function AccountSheet({ onClose, open }: { onClose: () => void; open: boolean }) {
  const { user } = useAuth()
  const id = user?.id as number | string | undefined
  const email = (user?.email as string | undefined) ?? ''

  const access = useApiAccess({
    id,
    initialEnabled: Boolean((user as { enableAPIKey?: unknown } | null)?.enableAPIKey),
    visible: open,
  })
  const { enabled, error, showKey, sync } = access

  /* `useAuth` holds the user as they were at sign-in, and access may have been
     switched since — here, or on the user list. Each opening starts from what
     the server says now. */
  React.useEffect(() => {
    if (!open || !id) return
    let live = true
    void (async () => {
      try {
        const res = await fetch(`/api/users/${id}?depth=0`, { credentials: 'include' })
        if (!res.ok) return
        const doc = (await res.json()) as { enableAPIKey?: boolean }
        if (live) sync(Boolean(doc.enableAPIKey))
      } catch {
        // The sheet shows what sign-in knew; the switch still writes.
      }
    })()
    return () => {
      live = false
    }
  }, [id, open, sync])

  return (
    <>
      <Dialog aside={null} onClose={onClose} open={open} title="Account">
        <div className="da-account-sheet">
          <dl className="da-account-sheet__facts">
            <div className="da-account-sheet__fact">
              <dt>Email</dt>
              <dd className="da-account-sheet__who">
                <span className="da-account-sheet__email">{email}</span>
                {/* Everyone who can sign in to this admin has all of it, so the
                    role is a tag on the address rather than a fact of its own. */}
                <span className="da-account-sheet__role">Admin</span>
              </dd>
            </div>
          </dl>

          <TranslationModel open={open} />

          <div className="da-account-sheet__api">
            <div className="da-account-sheet__api-head">
              <span className="da-account-sheet__api-lead">
                <span className="da-account-sheet__api-title">API access</span>
                <span className="da-account-sheet__api-sub">
                  {enabled
                    ? 'Content Studio publishes with this key.'
                    : 'No key. Content Studio cannot publish with this account.'}
                </span>
              </span>
              <Switch checked={enabled} label="API access" onChange={(next) => void access.toggle(next)} />
            </div>
            {showKey ? <ApiKeyBox access={access} /> : null}
            {error ? <p className="da-api-cell__error">{error}</p> : null}
          </div>

          <div className="da-confirm__actions">
            <button className="da-confirm__button da-confirm__button--primary" onClick={onClose} type="button">
              Done
            </button>
          </div>
        </div>
      </Dialog>

      {access.confirmation}
    </>
  )
}
