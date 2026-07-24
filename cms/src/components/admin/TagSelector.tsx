'use client'
import { useField } from '@payloadcms/ui'
import type { SelectFieldClientComponent } from 'payload'
import React from 'react'

import { CATEGORIES, TAXONOMY, type Category } from '../../lib/tags'
import './TagSelector.css'

const MAX = 2

/**
 * Custom admin field for `tags`. Replaces the default long multi-select with:
 *  - the 4 categories as sub-tabs,
 *  - each category's tags as toggle chips,
 *  - a HARD live cap of 2 (a 3rd chip is disabled until you deselect one) —
 *    the field-level `validate` is the server-side backstop.
 */
export const TagSelector: SelectFieldClientComponent = ({ path }) => {
  const { value, setValue, showError, errorMessage } = useField<string[]>({ path })
  const selected = React.useMemo(() => (Array.isArray(value) ? value : []), [value])
  const [activeCat, setActiveCat] = React.useState<Category>(CATEGORIES[0])

  const atMax = selected.length >= MAX

  const toggle = (tag: string) => {
    if (selected.includes(tag)) setValue(selected.filter((t) => t !== tag))
    else if (!atMax) setValue([...selected, tag])
  }

  return (
    <div className="tag-selector">
      <div className="tag-selector__head">
        <span className="tag-selector__label">Tags</span>
        <span className={`tag-selector__count${atMax ? ' is-max' : ''}`}>
          {selected.length} / {MAX}
        </span>
      </div>

      {selected.length > 0 && (
        <div className="tag-selector__selected">
          {selected.map((t) => (
            <button
              type="button"
              key={t}
              className="tag-chip tag-chip--on"
              onClick={() => toggle(t)}
              title="Remove"
            >
              {t}
              <span className="tag-chip__x" aria-hidden="true">
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="tag-selector__tabs" role="tablist">
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c}
            role="tab"
            aria-selected={activeCat === c}
            className={`tag-selector__tab${activeCat === c ? ' is-active' : ''}`}
            onClick={() => setActiveCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="tag-selector__chips">
        {TAXONOMY[activeCat].map((tag) => {
          const on = selected.includes(tag)
          const disabled = !on && atMax
          return (
            <button
              type="button"
              key={tag}
              className={`tag-chip${on ? ' tag-chip--on' : ''}`}
              aria-pressed={on}
              disabled={disabled}
              onClick={() => toggle(tag)}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {showError && errorMessage ? (
        <p className="tag-selector__error">{errorMessage}</p>
      ) : (
        <p className="tag-selector__hint">Pick 1–2 tags. Order doesn’t matter.</p>
      )}
    </div>
  )
}

export default TagSelector
