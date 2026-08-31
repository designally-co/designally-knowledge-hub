'use client'

import React from 'react'

import type { Dictionary } from '@/lib/i18n'

/**
 * The sign-up field and its note.
 *
 * EXTRACTED SO THERE IS ONE OF THEM. The band at the foot of every page and the
 * newsletter page's own hero are the same control in two places; written twice
 * they would drift the first time the button's wording or the note changed.
 *
 * IT IS STILL UI-ONLY. No newsletter provider is wired to this site, and the
 * submit does what it has always done here: nothing but stop the page
 * reloading. The one place to wire it is now this file.
 */
export function NewsletterForm({ dict }: { dict: Dictionary }) {
  const c = dict.cta

  return (
    <>
      <form className="cta__form" onSubmit={(event) => event.preventDefault()}>
        <input
          aria-label={c.placeholder}
          className="cta__input"
          name="email"
          placeholder={c.placeholder}
          required
          type="email"
        />
        <button className="cta__submit" type="submit">
          {c.button}
        </button>
      </form>
      <p className="cta__note">{c.note}</p>
    </>
  )
}
