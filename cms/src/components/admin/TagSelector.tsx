'use client'
import { useField } from '@payloadcms/ui'
import type { SelectFieldClientComponent } from 'payload'
import React from 'react'

import { CATEGORIES, TAXONOMY, type Category } from '../../lib/tags'
import './TagSelector.css'

/**
 * Custom admin field for an article's `tag`. Replaces the default long select
 * with the 4 categories as sub-tabs and each category's tags as chips.
 *
 * Single value. An article's tag determines its category — each tag belongs to
 * exactly one — so two tags would make the category ambiguous. Picking a chip
 * replaces whatever was selected rather than adding to it; picking the selected
 * chip again clears the field.
 */
export const TagSelector: SelectFieldClientComponent = ({ path }) => {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const selected = typeof value === 'string' && value ? value : ''

  // Open on the category the current tag belongs to, so editing an existing
  // article lands on the tab you would expect rather than always the first.
  const initialCat = React.useMemo<Category>(() => {
    const found = CATEGORIES.find((c) => (TAXONOMY[c] as readonly string[]).includes(selected))
    return found ?? CATEGORIES[0]
    // Only for the first render — changing tabs afterwards is the editor's call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [activeCat, setActiveCat] = React.useState<Category>(initialCat)

  const choose = (tag: string) => {
    setValue(selected === tag ? '' : tag)
  }

  return (
    <div className="tag-selector">
      <div className="tag-selector__head">
        <span className="tag-selector__label">Tag</span>
      </div>

      {selected && (
        <div className="tag-selector__selected">
          <button
            type="button"
            className="tag-chip tag-chip--on"
            onClick={() => choose(selected)}
            title="Remove"
          >
            {selected}
            <span className="tag-chip__x" aria-hidden="true">
              ×
            </span>
          </button>
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
          const on = selected === tag
          return (
            <button
              type="button"
              key={tag}
              className={`tag-chip${on ? ' tag-chip--on' : ''}`}
              aria-pressed={on}
              onClick={() => choose(tag)}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {showError && errorMessage ? (
        <p className="tag-selector__error">{errorMessage}</p>
      ) : (
        <p className="tag-selector__hint">Pick one tag. It also sets the category.</p>
      )}
    </div>
  )
}

export default TagSelector
