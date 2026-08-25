'use client'
import { useField } from '@payloadcms/ui'
import type { SelectFieldClientComponent } from 'payload'
import React from 'react'

import { CATEGORIES, TAXONOMY, categoryForTag, type Category } from '../../lib/tags'
import './TagSelector.css'

/**
 * The article's `tag` — exactly one, from a taxonomy of 34 across 3 categories.
 *
 * WHY THIS IS A RADIO GROUP. It used to be a row of toggle buttons carrying
 * `aria-pressed`, which is the markup for "any number of these can be on", laid
 * out as a cloud of identical chips, which is what a multi-select looks like.
 * Both said "pick as many as you like" about a field that takes one value. A
 * radio group says the true thing in the markup as well as in the picture:
 * arrow keys move the selection, a screen reader announces "3 of 10", and
 * choosing is inherently a replacement.
 *
 * The chips are real `<input type="radio">` elements, visually hidden but not
 * `display: none`, so the keyboard behaviour is the browser's rather than
 * something reimplemented here.
 *
 * NO CLEAR BUTTON. The selected tag used to render with an "×", and clicking
 * the selected chip toggled it off. `tag` is `required`, so both did the same
 * thing: put the document into a state that cannot be saved, from a control
 * that looked like tidying up. Choosing a different tag is the only way to
 * change it, which is what "required, exactly one" means.
 *
 * The categories are a filter over the list, not a second choice — the tag
 * determines the category, never the other way round.
 */
export const TagSelector: SelectFieldClientComponent = ({ path }) => {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const selected = typeof value === 'string' && value ? value : ''
  const selectedCategory = selected ? categoryForTag(selected) : undefined

  // Open on the category the current tag belongs to, so editing an existing
  // article lands on the tab you would expect rather than always the first.
  const initialCat = React.useMemo<Category>(() => {
    const found = CATEGORIES.find((c) => (TAXONOMY[c] as readonly string[]).includes(selected))
    return found ?? CATEGORIES[0]
    // Only for the first render — changing tabs afterwards is the editor's call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [activeCat, setActiveCat] = React.useState<Category>(initialCat)

  // Scopes the radios' shared `name` to this field, so two tag fields on one
  // screen could never end up in the same native radio group.
  const groupName = `tag-${String(path).replace(/[^\w-]/g, '-')}`
  const panelId = `${groupName}-options`

  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  /** Arrow/Home/End across the category tabs, per the ARIA tabs pattern. */
  const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End']
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const last = CATEGORIES.length - 1
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? last
          : e.key === 'ArrowRight'
            ? (i + 1) % CATEGORIES.length
            : (i - 1 + CATEGORIES.length) % CATEGORIES.length
    setActiveCat(CATEGORIES[next])
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="tag-selector">
      <span className="tag-selector__label">Tag</span>

      {/* The choice, stated once and plainly. Not a removable token: this is
          the record of what is filed where, and the only way to change it is
          to choose another. */}
      {/* ONE MESSAGE, NOT TWO. On the create form this line read "Not filed yet
          — choose one below." in the accent, while Payload's own "This field is
          required." sat below the options in a second, near-identical red eight
          degrees away. One field, one problem, two wordings, two colours.
          The state readout is the right place for it, because it is where the
          answer already is, so when validation fails this line carries the
          message and the separate paragraph goes. */}
      <p
        className={`tag-selector__current${selected ? '' : ' tag-selector__current--empty'}${
          showError ? ' tag-selector__current--error' : ''
        }`}
        role={showError ? 'alert' : undefined}
      >
        {selected ? (
          <>
            Filed under <strong>{selectedCategory ?? 'Unknown category'}</strong>
            <span aria-hidden="true"> · </span>
            <strong>{selected}</strong>
          </>
        ) : showError && errorMessage ? (
          errorMessage
        ) : (
          'Not filed yet — choose one below.'
        )}
      </p>

      {/* A REAL TABLIST, OR NONE AT ALL.
          `role="tab"` is a promise about the keyboard: a screen reader
          announces "tab", and the ARIA pattern says the group is ONE stop with
          arrow keys moving between the tabs inside it. This announced itself as
          a tablist and then ignored every arrow key, so someone following the
          convention pressed Right, nothing happened, and the 24 tags behind the
          other two categories stayed undiscovered.
          Roving tabIndex makes the promise true: only the active tab is
          reachable by Tab, and Left/Right/Home/End move between them. */}
      <div className="tag-selector__tabs" role="tablist" aria-label="Category">
        {CATEGORIES.map((c, i) => (
          <button
            type="button"
            key={c}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            role="tab"
            aria-controls={panelId}
            aria-selected={activeCat === c}
            tabIndex={activeCat === c ? 0 : -1}
            className={`tag-selector__tab${activeCat === c ? ' is-active' : ''}`}
            onClick={() => setActiveCat(c)}
            onKeyDown={(e) => onTabKeyDown(e, i)}
          >
            {c}
            {selectedCategory === c ? (
              <span aria-hidden="true" className="tag-selector__tab-dot" />
            ) : null}
          </button>
        ))}
      </div>

      <div
        className="tag-selector__options"
        id={panelId}
        role="radiogroup"
        aria-label={`Tag, in ${activeCat}`}
      >
        {TAXONOMY[activeCat].map((tag) => {
          const on = selected === tag
          return (
            <label className={`tag-opt${on ? ' tag-opt--on' : ''}`} key={tag}>
              <input
                checked={on}
                className="tag-opt__input"
                name={groupName}
                onChange={() => setValue(tag)}
                type="radio"
                value={tag}
              />
              <span aria-hidden="true" className="tag-opt__mark" />
              <span className="tag-opt__text">{tag}</span>
            </label>
          )
        })}
      </div>

      <p className="tag-selector__hint">
        One tag per article. It also decides the article&rsquo;s category.
      </p>
    </div>
  )
}

export default TagSelector
