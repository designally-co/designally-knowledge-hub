'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

/*
 * Sidebar button that (re)generates the Thai version of the current resource
 * from its English source, via POST /api/resources/:id/translate-to-thai.
 * Registered as the Field component of the `translateToThai` UI field.
 */
export function TranslateToThaiButton() {
  const { id } = useDocumentInfo()
  const [state, setState] = React.useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = React.useState('')

  const run = async () => {
    if (!id) return
    setState('loading')
    setError('')
    try {
      const res = await fetch(`/api/resources/${id}/translate-to-thai`, {
        method: 'POST',
        credentials: 'include',
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setState('done')
      // Reload so the Thai locale shows the freshly translated content.
      setTimeout(() => window.location.reload(), 700)
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div style={{ marginBlock: '0.75rem' }}>
      <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.6, margin: '0 0 6px' }}>
        Thai translation
      </p>
      {id ? (
        <>
          <button
            type="button"
            className="btn btn--style-secondary btn--size-small"
            onClick={run}
            disabled={state === 'loading'}
            style={{ margin: 0 }}
          >
            {state === 'loading' ? 'Translating…' : 'Translate to Thai'}
          </button>
          {state === 'done' && (
            <p style={{ fontSize: '0.75rem', margin: '6px 0 0' }}>Done — reloading…</p>
          )}
          {state === 'error' && (
            <p style={{ fontSize: '0.75rem', color: 'var(--theme-error-500)', margin: '6px 0 0' }}>
              Failed: {error}
            </p>
          )}
          <p style={{ fontSize: '0.72rem', opacity: 0.65, margin: '6px 0 0' }}>
            Regenerates Thai from the English source. Switch the locale (top-right) to review.
          </p>
        </>
      ) : (
        <p style={{ fontSize: '0.75rem', opacity: 0.65, margin: 0 }}>Save the article first.</p>
      )}
    </div>
  )
}
