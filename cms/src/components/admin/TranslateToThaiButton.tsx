'use client'

import React from 'react'
import { useDocumentInfo, useFormModified } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

import './TranslateToThaiButton.css'

/*
 * Sidebar button that (re)generates the Thai version of the current resource
 * from its English source, via POST /api/<collection>/:id/translate-to-thai.
 * Registered as the Field component of the `translateToThai` UI field.
 *
 * THIS BUTTON REWRITES A WHOLE LOCALE, AND USED TO DO IT BLIND.
 *
 * Three things made it the most dangerous control in the CMS:
 *
 *   1. It called `window.location.reload()` 700ms after success. Payload v3's
 *      unsaved-changes guard is router-based, not `beforeunload`-based, so a
 *      hard reload walked straight past it and took any unsaved English edits
 *      with it — no prompt, and no version history to recover from.
 *   2. It regenerated unconditionally. A Thai deck a reviewer had corrected by
 *      hand was replaced with machine output on a single click.
 *   3. It read "Translate to Thai" whether Thai was absent, present or
 *      hand-edited — so the one fact that decides whether pressing it is safe
 *      was the one fact the panel never showed.
 *
 * All three are addressed here: the button refuses while the form is dirty,
 * asks before replacing existing Thai, states what it will do before the
 * click, and refreshes through the router instead of reloading the page.
 *
 * WHY THE STATE IS PROBED RATHER THAN STORED. There is no `thaiTranslatedAt`
 * field, deliberately — a timestamp column that only this button writes is a
 * schema change carrying one bit of information. Instead the panel asks the API
 * for the document in `th` with `fallbackLocale=none`: the same sentinel the
 * dashboard uses to see past Payload's locale fallback, and the only way to
 * distinguish "written in Thai" from "falling back to English".
 */

type ThaiState = 'unknown' | 'present' | 'absent'
type RunState = 'idle' | 'loading' | 'done' | 'error'

export function TranslateToThaiButton() {
  // The button is mounted on both Articles and Resources, so the target has to
  // come from the document being edited rather than being hardcoded.
  const { id, collectionSlug } = useDocumentInfo()
  const modified = useFormModified()
  const router = useRouter()

  const [thai, setThai] = React.useState<ThaiState>('unknown')
  const [state, setState] = React.useState<RunState>('idle')
  const [confirming, setConfirming] = React.useState(false)
  const [error, setError] = React.useState('')

  /* Ask whether a Thai version exists. `fallbackLocale=none` is load-bearing:
     without it Payload answers with the English text and every document looks
     translated. */
  const probe = React.useCallback(async () => {
    if (!id || !collectionSlug) return
    try {
      const res = await fetch(
        `/api/${collectionSlug}/${id}?locale=th&fallbackLocale=none&depth=0`,
        { credentials: 'include' },
      )
      if (!res.ok) {
        setThai('unknown')
        return
      }
      const doc = (await res.json()) as { title?: string | null }
      setThai(doc?.title ? 'present' : 'absent')
    } catch {
      // A failed probe is not a failed translation. Say nothing rather than
      // claim a state that was never read.
      setThai('unknown')
    }
  }, [collectionSlug, id])

  React.useEffect(() => {
    void probe()
  }, [probe])

  const run = async () => {
    if (!id) return
    setConfirming(false)
    setState('loading')
    setError('')
    try {
      const res = await fetch(`/api/${collectionSlug}/${id}/translate-to-thai`, {
        method: 'POST',
        credentials: 'include',
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setState('done')
      await probe()
      /* A ROUTER REFRESH, NOT A PAGE RELOAD. This re-runs the server render so
         the Thai locale shows the new content, while the client form state —
         including anything typed and not yet saved — survives. */
      router.refresh()
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const label = <p className="da-thai__label">Thai translation</p>

  if (!id) {
    return (
      <div className="da-thai">
        {label}
        <p className="da-thai__blocked">
          Save the article first. There is nothing to translate until it exists.
        </p>
      </div>
    )
  }

  /* Refuse while the document is dirty, and say why. Beyond protecting unsaved
     work, the translation reads the SAVED English from the database — so
     running it now would translate the previous draft and quietly disagree with
     what is on screen. */
  if (modified) {
    return (
      <div className="da-thai">
        {label}
        <p className="da-thai__blocked">
          Save your changes first. Translation reads the saved English, so it would
          work from the previous version of this document.
        </p>
      </div>
    )
  }

  return (
    <div className="da-thai">
      {label}

      {thai !== 'unknown' && (
        <p className={`da-thai__state${thai === 'absent' ? ' da-thai__state--absent' : ''}`}>
          {thai === 'absent' ? (
            <>
              <strong>No Thai yet.</strong> Thai readers see the English text.
            </>
          ) : (
            <>
              <strong>Thai is written.</strong> Switch the locale to ไทย to read it.
            </>
          )}
        </p>
      )}

      {confirming ? (
        <div className="da-thai__confirm">
          <p>
            Replace the Thai title, deck and body with a fresh translation of the saved
            English? Any wording corrected by hand will be overwritten.
          </p>
          <div className="da-thai__actions">
            <button
              type="button"
              className="btn btn--style-primary btn--size-small"
              onClick={run}
            >
              Replace Thai
            </button>
            <button
              type="button"
              className="btn btn--style-secondary btn--size-small"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small da-thai__btn"
          onClick={() => (thai === 'present' ? setConfirming(true) : run())}
          disabled={state === 'loading'}
        >
          {state === 'loading'
            ? 'Translating…'
            : thai === 'present'
              ? 'Re-translate Thai'
              : 'Translate to Thai'}
        </button>
      )}

      {state === 'done' && <p className="da-thai__note">Translated.</p>}
      {state === 'error' && (
        <p className="da-thai__note da-thai__note--error">Failed: {error}</p>
      )}
    </div>
  )
}
