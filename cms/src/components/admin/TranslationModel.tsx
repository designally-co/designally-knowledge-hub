'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'

import { TRANSLATE_MODELS } from '../../lib/translateModels'

/**
 * Which Claude model writes the Thai translations, as a dropdown in the
 * account sheet.
 *
 * A SITE SETTING IN A PERSONAL SHEET. The value lives in the `settings` global
 * (globals/Settings.ts) — one for the whole Hub, not one per account — but the
 * account sheet is where the people who run the Hub already go, so it is here
 * rather than on a nav entry of its own.
 *
 * IT WRITES WHEN IT CHANGES, like the API switch below it: the sheet ends in
 * Done, with nothing to cancel to. The line under the title says what the
 * picked model is for, then whether the change was kept.
 */
export function TranslationModel({ open }: { open: boolean }) {
  const id = React.useId()
  const [model, setModel] = React.useState<string | null>(null)
  const [state, setState] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Each opening reads what the server holds now; someone else may have changed it.
  React.useEffect(() => {
    if (!open) return
    let live = true
    setState('idle')
    void (async () => {
      try {
        const res = await fetch('/api/globals/settings?depth=0', { credentials: 'include' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const doc = (await res.json()) as { translateModel?: string | null }
        if (live) setModel(doc.translateModel ?? null)
      } catch {
        if (live) setState('error')
      }
    })()
    return () => {
      live = false
    }
  }, [open])

  const change = async (next: string) => {
    const was = model
    setModel(next)
    setState('saving')
    try {
      const res = await fetch('/api/globals/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translateModel: next }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setState('saved')
    } catch {
      setModel(was)
      setState('error')
    }
  }

  const known = TRANSLATE_MODELS.find((option) => option.value === model)
  const sub =
    state === 'saving'
      ? 'Saving…'
      : state === 'error'
        ? 'Could not reach the setting. Close and try again.'
        : state === 'saved'
          ? `Saved. The next translation uses ${known?.label ?? model}.`
          : (known?.note ?? 'The Claude model that writes the Thai version.')

  return (
    <div className="da-account-sheet__model">
      <span className="da-account-sheet__api-lead">
        <label className="da-account-sheet__api-title" htmlFor={id}>
          Thai translation
        </label>
        <span aria-live="polite" className="da-account-sheet__api-sub">
          {sub}
        </span>
      </span>
      <span className="da-model-select">
        <select
          disabled={model === null || state === 'saving'}
          id={id}
          onChange={(event) => void change(event.target.value)}
          value={model ?? ''}
        >
          {model === null ? <option value="">Loading…</option> : null}
          {/* A model set through TRANSLATE_MODEL that the list does not name
              is still the one in use, so it is shown rather than hidden. */}
          {model && !known ? <option value={model}>{model}</option> : null}
          {TRANSLATE_MODELS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="da-model-select__chevron" size={16} strokeWidth={1.75} />
      </span>
    </div>
  )
}
