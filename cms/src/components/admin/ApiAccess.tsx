'use client'

import React from 'react'
import { Check, Copy, Eye, EyeOff } from 'lucide-react'

import { ConfirmDialog } from './ConfirmDialog'
import './UserApiCell.css'

/**
 * An account's API access — the state, the writes, and the key box — in one
 * place, because two surfaces decide it: the user list (a row on a desk, a
 * sheet on a phone) and the account popup. Written twice, the confirmation's
 * wording and the rule that turning access on must make a key would drift.
 *
 * IT WRITES THROUGH THE API, because neither surface has a form around it: the
 * same `PATCH /api/users/:id` the document screen sent, with the same hooks and
 * the same access control behind it.
 */

export const ICON = { size: 16, strokeWidth: 1.75 } as const

/* The same shape Payload's own button produced — a v4 UUID — from the browser's
   own generator rather than a package this app does not depend on directly. */
const newKey = () => crypto.randomUUID()

export type ApiAccess = ReturnType<typeof useApiAccess>

export function useApiAccess({
  id,
  initialEnabled,
  visible,
}: {
  id: number | string | undefined
  initialEnabled: boolean
  /** Whether the surface that would show the key is open. */
  visible: boolean
}) {
  const [enabled, setEnabled] = React.useState(initialEnabled)
  const [apiKey, setApiKey] = React.useState<null | string>(null)
  const [shown, setShown] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<null | string>(null)
  const [confirming, setConfirming] = React.useState(false)

  const showKey = enabled && visible

  /* The key is fetched for the surface that is open, and only that one — it is
     not a column, and it should not be: a list of credentials on a screen
     anyone can leave open. */
  React.useEffect(() => {
    if (!showKey || !id || apiKey) return
    let live = true
    void (async () => {
      try {
        const res = await fetch(`/api/users/${id}?depth=0`, { credentials: 'include' })
        if (!res.ok) return
        const doc = (await res.json()) as { apiKey?: string }
        if (live && typeof doc.apiKey === 'string') setApiKey(doc.apiKey)
      } catch {
        // Access still says on; a key that will not load is a network fault,
        // not a state worth printing.
      }
    })()
    return () => {
      live = false
    }
  }, [apiKey, id, showKey])

  const save = React.useCallback(
    async (patch: Record<string, unknown>) => {
      if (!id) return false
      setBusy(true)
      setError(null)
      try {
        const res = await fetch(`/api/users/${id}`, {
          body: JSON.stringify(patch),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        })
        if (!res.ok) throw new Error(String(res.status))
        return true
      } catch {
        setError('Could not save. Try again.')
        return false
      } finally {
        setBusy(false)
      }
    },
    [id],
  )

  const toggle = async (next: boolean): Promise<boolean> => {
    /* Turning it on with no key would leave access enabled and nothing to
       authenticate with, which reads as working and is not. */
    const key = next && !apiKey ? newKey() : undefined
    const ok = await save(key ? { apiKey: key, enableAPIKey: true } : { enableAPIKey: next })
    if (!ok) return false
    if (key) setApiKey(key)
    setEnabled(next)
    setShown(false)
    return true
  }

  const regenerate = async () => {
    const key = newKey()
    const ok = await save({ apiKey: key, enableAPIKey: true })
    if (!ok) return
    setApiKey(key)
    setConfirming(false)
  }

  const copy = async () => {
    if (!apiKey) return
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Refused clipboard access says nothing useful here; the key is on screen.
    }
  }

  /** Back to what the server says, when a surface opens on stale state. */
  const sync = React.useCallback((next: boolean) => {
    setEnabled(next)
    setShown(false)
    setError(null)
  }, [])

  /* The question worth asking twice: the key in Content Studio stops working
     the moment this one is written, and nothing on either screen would say why
     publishing had stopped. Render it beside whichever surface is in use; it
     portals over it either way. */
  const confirmation = (
    <ConfirmDialog
      confirmLabel="Generate new key"
      description="Content Studio publishes with the current key. It stops working the moment a new one is made, until the new key is pasted into Content Studio."
      onCancel={() => setConfirming(false)}
      onConfirm={regenerate}
      open={confirming}
      title="Replace this key?"
    />
  )

  return {
    apiKey,
    askRegenerate: () => setConfirming(true),
    busy,
    confirmation,
    copied,
    copy,
    enabled,
    error,
    setError,
    setShown,
    showKey,
    shown,
    sync,
    toggle,
  }
}

/** Dots until asked. A key is read character by character when it is checked. */
export const MASK = '••••••••••••••••••••••••••••••••••••'

/**
 * The key in a sheet: the value and the eye that reveals it on one line, and
 * the two things done WITH it as two equal buttons under it.
 */
export function ApiKeyBox({ access }: { access: ApiAccess }) {
  const { apiKey, askRegenerate, busy, copied, copy, setShown, shown } = access

  return (
    <div className="da-api-sheet__key">
      {/* The eye is about the characters beside it, not about the key as a
          thing to act on — so it shares their line. */}
      <div className="da-api-sheet__line">
        <span className="da-api-cell__value">{shown ? apiKey ?? 'Loading…' : MASK}</span>
        <button
          aria-label={shown ? 'Hide key' : 'Show key'}
          className="da-api-cell__icon"
          disabled={!apiKey}
          onClick={() => setShown((was) => !was)}
          type="button"
        >
          {shown ? <EyeOff aria-hidden="true" {...ICON} /> : <Eye aria-hidden="true" {...ICON} />}
        </button>
      </div>

      {/* Each a word, so neither is an icon to be recognised. */}
      <div className="da-api-sheet__actions">
        <button className="da-api-sheet__button" disabled={!apiKey} onClick={copy} type="button">
          {copied ? <Check aria-hidden="true" {...ICON} /> : <Copy aria-hidden="true" {...ICON} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button className="da-api-sheet__button" disabled={busy} onClick={askRegenerate} type="button">
          Generate new
        </button>
      </div>
    </div>
  )
}
