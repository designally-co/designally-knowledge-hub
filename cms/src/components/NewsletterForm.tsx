'use client'

import React from 'react'

import type { Dictionary, Locale } from '@/lib/i18n'

/**
 * The sign-up field and its note.
 *
 * EXTRACTED SO THERE IS ONE OF THEM. The band at the foot of every page and the
 * newsletter page's own hero are the same control in two places; written twice
 * they would drift the first time the button's wording or the note changed.
 *
 * IT NOW GOES SOMEWHERE. It posts to `/api/subscribe`, which appends to the
 * Hub's own Subscribers collection — see that route for why the list lives here
 * rather than at a provider. Everything below is about the seconds between the
 * press and the answer.
 *
 * THE STATE IS ON THE BUTTON AND THE MESSAGE, NOT ON A REDIRECT. A sign-up
 * band appears at the foot of an article someone is halfway through; taking
 * them to a confirmation page to say one sentence would cost them their place
 * in the reading. So the form answers where it stands.
 *
 * THE FIELD DISAPPEARS ON SUCCESS. Leaving it there invites the same address a
 * second time, and the second press produces the identical sentence, which
 * reads as though the first one failed.
 */
/*
 * WHICH LANGUAGE THEY WERE READING, TAKEN FROM THE URL. The band appears on
 * nearly every page and none of its callers pass a locale; threading one
 * through all of them to record a single field would be a lot of churn for a
 * fact the address bar already states. Thai lives under `/th`, English is
 * unprefixed — the same rule the middleware routes by.
 */
function localeFromPath(): Locale {
  if (typeof window === 'undefined') return 'en'
  return window.location.pathname.startsWith('/th') ? 'th' : 'en'
}

export function NewsletterForm({ dict, locale }: { dict: Dictionary; locale?: Locale }) {
  const c = dict.cta

  const [state, setState] = React.useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = React.useState('')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'sending') return

    const form = event.currentTarget
    const data = new FormData(form)

    setState('sending')
    setMessage('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.get('email'),
          company: data.get('company'),
          locale: locale ?? localeFromPath(),
          /* Which page earned the sign-up. Read here rather than passed in, so
             every placement reports itself without being told to. */
          source: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
      })

      const result = (await response.json()) as { ok?: boolean; message?: string }

      if (response.ok && result.ok) {
        setState('done')
        setMessage(result.message ?? 'Thanks — you are on the list.')
        form.reset()
        return
      }

      setState('error')
      setMessage(result.message ?? 'That did not go through. Try again.')
    } catch {
      /* Offline, or the request never left. Naming the likely cause beats a
         generic failure, because the reader can act on it. */
      setState('error')
      setMessage('No connection. Try again when you are back online.')
    }
  }

  if (state === 'done') {
    return (
      <p aria-live="polite" className="cta__note cta__note--done">
        {message}
      </p>
    )
  }

  return (
    <>
      <form className="cta__form" noValidate onSubmit={onSubmit}>
        <input
          aria-label={c.placeholder}
          className="cta__input"
          disabled={state === 'sending'}
          name="email"
          placeholder={c.placeholder}
          required
          type="email"
        />
        {/*
          THE HONEYPOT. Not `display: none` — some bots skip what is not
          rendered, and some screen readers would still reach a hidden input
          that is merely off-screen. `aria-hidden` with `tabIndex={-1}` takes it
          out of both the reading order and the tab ring, which is what makes it
          invisible to a person and visible to something reading the DOM.
        */}
        <input
          aria-hidden="true"
          autoComplete="off"
          className="cta__honeypot"
          name="company"
          tabIndex={-1}
          type="text"
        />
        <button className="cta__submit" disabled={state === 'sending'} type="submit">
          {state === 'sending' ? '…' : c.button}
        </button>
      </form>
      <p aria-live="polite" className={`cta__note${state === 'error' ? ' cta__note--error' : ''}`}>
        {message || c.note}
      </p>
    </>
  )
}
