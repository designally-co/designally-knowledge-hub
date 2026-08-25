'use client'

import { useDocumentInfo, useField } from '@payloadcms/ui'
import React from 'react'

import './RelatedPicker.css'

/**
 * `related` — up to four other articles, chosen as cards rather than as rows.
 *
 * Payload's default is a token input: you type, a dropdown of titles appears,
 * and what you end up with is a list of strings. What is actually being chosen
 * is articles, and an article is recognised by its cover and its headline long
 * before its title has been read to the end — so the slots show both, and the
 * empty ones are visibly slots waiting to be filled.
 *
 * FOUR, because four is what the published page lays out. Beyond that the grid
 * still renders whatever is stored — existing data is never hidden — but no
 * further slot is offered.
 *
 * The picker is an inline panel rather than a modal: it needs a search box and
 * a list, and a dialog would bring focus trapping and a scroll lock for no gain
 * inside a field that is already the width of the column.
 */

const MAX = 4

/** How many search results are rendered. The list says when it has more, rather
 *  than silently ending — someone searching for a title they know exists and
 *  not seeing it concludes the search is broken, not that the list was cut. */
const SHOWN = 40

type Media = { url?: string | null; sizes?: Record<string, { url?: string | null }> }
type Article = {
  id: string | number
  title?: string | null
  coverUrl?: string | null
  coverImage?: Media | string | number | null
}

type Value = Array<string | number | { id: string | number }> | null | undefined

const idOf = (v: string | number | { id: string | number }): string =>
  String(typeof v === 'object' && v !== null ? v.id : v)

/** The cover, from whichever of the two fields holds one. Mirrors the rule the
 *  dashboard and the public site use: an upload if there is one, else the URL. */
function coverOf(a: Article | undefined): string | null {
  if (!a) return null
  const img = a.coverImage
  if (img && typeof img === 'object') {
    return img.sizes?.thumbnail?.url || img.sizes?.card?.url || img.url || null
  }
  return a.coverUrl?.trim() || null
}

export const RelatedPicker: React.FC<{ path?: string; field?: { label?: unknown } }> = ({
  path = 'related',
  field,
}) => {
  const { value, setValue } = useField<Value>({ path })
  const { id: currentId } = useDocumentInfo()

  const [all, setAll] = React.useState<Article[] | null>(null)
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const pickerRef = React.useRef<HTMLDivElement | null>(null)

  /* A WAY OUT THAT IS NOT THE BUTTON THAT OPENED IT.
     The panel had no Escape handler and no outside-click close, so once open
     the only exit was to Shift-Tab back to a "+" and press it again — every
     other dismissable surface in this admin closes on Escape, and a keyboard
     user reasonably expects it here too. */
  React.useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node
      // The "+" buttons toggle it themselves; closing here as well would
      // reopen-and-close on the same click.
      if (pickerRef.current?.contains(t)) return
      if ((t as HTMLElement).closest?.('.rel__add')) return
      setOpen(false)
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  const selectedIds = React.useMemo(() => (value || []).map(idOf), [value])

  // One request for the whole picker, on first open rather than on mount: a
  // field nobody touches should not cost a round trip.
  React.useEffect(() => {
    if (!open || all) return
    let alive = true
    const p = new URLSearchParams({ depth: '1', limit: '200', sort: '-updatedAt' })
    p.set('select[title]', 'true')
    p.set('select[coverUrl]', 'true')
    p.set('select[coverImage]', 'true')
    fetch(`/api/articles?${p.toString()}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((j) => alive && setAll((j.docs || []) as Article[]))
      .catch(() => alive && setAll([]))
    return () => {
      alive = false
    }
  }, [open, all])

  // Cards for what is already chosen. Rendered from the field's own value, so
  // they appear the moment something is picked rather than waiting on a fetch.
  const byId = React.useMemo(() => {
    const m = new Map<string, Article>()
    for (const a of all || []) m.set(String(a.id), a)
    for (const v of value || []) {
      if (typeof v === 'object' && v !== null) m.set(String(v.id), v as Article)
    }
    return m
  }, [all, value])

  const options = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return (all || [])
      .filter((a) => String(a.id) !== String(currentId))
      .filter((a) => !selectedIds.includes(String(a.id)))
      .filter((a) => (q ? (a.title || '').toLowerCase().includes(q) : true))
  }, [all, currentId, selectedIds, query])

  const add = (id: string | number) => {
    setValue([...(value || []), id])
    setQuery('')
    if (selectedIds.length + 1 >= MAX) setOpen(false)
  }

  const remove = (id: string) => {
    setValue((value || []).filter((v) => idOf(v) !== id))
  }

  const label = typeof field?.label === 'string' ? field.label : 'Related'
  const emptySlots = Math.max(0, MAX - selectedIds.length)

  return (
    <div className="rel">
      <span className="rel__label">{label}</span>
      <p className="rel__hint">Up to four, shown at the foot of the article.</p>

      <ul className="rel__grid">
        {selectedIds.map((id) => {
          const a = byId.get(id)
          const cover = coverOf(a)
          return (
            <li className="rel__slot rel__slot--filled" key={id}>
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="rel__cover" src={cover} />
              ) : (
                <span aria-hidden="true" className="rel__cover rel__cover--none" />
              )}
              <span className="rel__title">{a?.title || `Article ${id}`}</span>
              <button
                aria-label={`Remove ${a?.title || `article ${id}`}`}
                className="rel__remove"
                onClick={() => remove(id)}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          )
        })}

        {/* Each empty slot needs its OWN name. All four read "Add article", so a
            screen reader announced the same button four times with nothing to
            tell them apart and no position in the set. They do the same thing,
            which is precisely why the name has to say which one you are on. */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <li className="rel__slot rel__slot--empty" key={`empty-${i}`}>
            <button
              aria-expanded={open}
              aria-label={`Add related article, slot ${selectedIds.length + i + 1} of ${MAX}`}
              className="rel__add"
              onClick={() => setOpen((o) => !o)}
              type="button"
            >
              <span aria-hidden="true" className="rel__plus">
                +
              </span>
              <span className="rel__add-text">Add article</span>
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <div className="rel__picker" ref={pickerRef}>
          <input
            aria-label="Search articles"
            className="rel__search"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            type="text"
            value={query}
          />
          {all === null ? (
            <p className="rel__state">Loading…</p>
          ) : options.length === 0 ? (
            <p className="rel__state">
              {query ? 'Nothing matches that.' : 'No other articles to choose from.'}
            </p>
          ) : (
            <ul className="rel__options">
              {options.slice(0, SHOWN).map((a) => (
                <li key={a.id}>
                  <button className="rel__option" onClick={() => add(a.id)} type="button">
                    {coverOf(a) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="rel__option-thumb" src={coverOf(a) as string} />
                    ) : (
                      <span aria-hidden="true" className="rel__option-thumb" />
                    )}
                    <span className="rel__option-title">{a.title || `Article ${a.id}`}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {options.length > SHOWN && (
            <p className="rel__state">
              Showing {SHOWN} of {options.length}. Keep typing to narrow it down.
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default RelatedPicker
