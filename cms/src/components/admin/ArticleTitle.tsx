'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'

import './ArticleTitle.css'

/**
 * The article's title, as a headline you can read.
 *
 * A TEXTAREA, BECAUSE AN INPUT CANNOT WRAP. Set at 34px on the writing surface,
 * a single-line `<input>` runs the headline off the side of the sheet and
 * scrolls it: measured on a real article, 1311px of text inside a 722px box,
 * with the end of the sentence simply not on screen while you write it. Titles
 * here are long — they arrive from Content Studio as full editorial sentences —
 * so the one thing this field must do is show all of itself.
 *
 * NOTHING ABOUT THE DATA CHANGES. The field is still `title`, still `type:
 * 'text'`, still a string in the same column; this replaces the control Payload
 * renders for it and nothing else. `useField` reads and writes the same form
 * state the default input did.
 *
 * ENTER DOES NOT INSERT A NEWLINE. The box wraps because the headline is long,
 * not because it is multi-line: a title with a line break in it would carry that
 * break into the page's `<h1>`, the card, the browser tab and the share card.
 * Enter moves on instead, which is what it does in every other single-line field
 * in this form.
 */
export function ArticleTitle({ path, field }: { path: string; field?: { label?: unknown } }) {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const ref = React.useRef<HTMLTextAreaElement | null>(null)

  /* Grow to the text. Height is reset to `auto` first because `scrollHeight`
     only ever reports the larger of content and current height — without the
     reset the box can grow and never shrink back. */
  const fit = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  React.useEffect(() => {
    fit()
  }, [fit, value])

  return (
    <div className="field-type text da-title">
      {/* Clipped, not removed: the placeholder names the box on screen, but a
          placeholder is not an accessible name and disappears once you type. */}
      <label className="field-label da-title__label" htmlFor="field-title">
        Title
      </label>
      <textarea
        className="da-title__input"
        id="field-title"
        name="title"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault()
        }}
        placeholder="Title"
        ref={ref}
        rows={1}
        value={value || ''}
      />
      {showError && errorMessage ? (
        <p className="da-title__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
