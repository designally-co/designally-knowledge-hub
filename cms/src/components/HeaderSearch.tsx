'use client'

import React from 'react'
import Link from 'next/link'

import { Icon } from './ds'
import { searchHub, type HubSearchResults } from '@/lib/searchHub'
import type { Dictionary, Locale } from '@/lib/i18n'

/**
 * Search that opens in place: the glyph becomes a field, and what it finds
 * appears in a panel under the header — the same gesture the category links
 * already make, so search behaves like the rest of the masthead rather than
 * throwing the reader onto a page of its own.
 *
 * Below the nav breakpoint the glyph is not in the bar at all; search moves
 * into the drawer with the rest of the navigation, so the phone header stays
 * wordmark + Subscribe + menu.
 *
 * Results are a way in, not a results page. Five articles and three resources,
 * no pagination: a list long enough to scroll would want the page this exists
 * to avoid.
 */
const DEBOUNCE_MS = 220
const MIN_QUERY = 2

/** Query state shared by both surfaces. Debounced so a typed word costs one
 *  query rather than one per keystroke. */
function useHubSearch(locale: Locale, active: boolean) {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<HubSearchResults | null>(null)
  const [pending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (!active) return
    const q = query.trim()
    if (q.length < MIN_QUERY) {
      setResults(null)
      return
    }
    const timer = setTimeout(() => {
      startTransition(async () => setResults(await searchHub(q, locale)))
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, active, locale])

  const reset = React.useCallback(() => {
    setQuery('')
    setResults(null)
  }, [])

  const q = query.trim()
  return { query, setQuery, results, pending, reset, q, searching: q.length >= MIN_QUERY }
}

/** The hits themselves, identical in the header panel and the drawer. */
function SearchResults({
  results,
  pending,
  q,
  dict,
  onNavigate,
}: {
  results: HubSearchResults | null
  pending: boolean
  q: string
  dict: Dictionary
  onNavigate: () => void
}) {
  if (!results && pending) return <p className="search-panel__note">{dict.search.label}…</p>
  if (results && results.total === 0) {
    return <p className="search-panel__note">{dict.search.empty.replace('{q}', q)}</p>
  }
  if (!results) return null

  return (
    <>
      {results.articles.length > 0 && (
        <section className="search-panel__group">
          <p className="search-panel__label">{dict.search.articles}</p>
          <ul className="search-panel__list">
            {results.articles.map((item) => (
              <li key={item.href}>
                <Link className="search-panel__hit" href={item.href} onClick={onNavigate}>
                  <span className="search-panel__hit-title">{item.title}</span>
                  {item.date && <span className="search-panel__hit-meta">{item.date}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.resources.length > 0 && (
        <section className="search-panel__group">
          <p className="search-panel__label">{dict.search.resources}</p>
          <ul className="search-panel__list">
            {results.resources.map((item) => (
              <li key={item.id}>
                <Link className="search-panel__hit" href={item.href} onClick={onNavigate}>
                  <span className="search-panel__hit-title">{item.title}</span>
                  {item.category && <span className="search-panel__hit-meta">{item.category}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Header — the glyph that becomes a field                                     */
/* -------------------------------------------------------------------------- */

export function HeaderSearch({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [open, setOpen] = React.useState(false)
  const search = useHubSearch(locale, open)
  const { reset } = search

  const wrapRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const close = React.useCallback(() => {
    setOpen(false)
    reset()
  }, [reset])

  // Focus lands in the field the moment it exists, so opening and typing are
  // one motion rather than two.
  React.useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, close])

  return (
    <div className="header-search" ref={wrapRef}>
      {open ? (
        <div className="header-search__field">
          <Icon name="search" size={17} className="header-search__glyph" />
          {/* type="text", not "search": WebKit gives type="search" its own clear
              button, which would sit next to this field's close button as a
              second, near-identical ✕ with a different meaning. */}
          <input
            ref={inputRef}
            type="text"
            className="header-search__input"
            value={search.query}
            onChange={(e) => search.setQuery(e.target.value)}
            placeholder={dict.search.placeholder}
            aria-label={dict.search.label}
            autoComplete="off"
          />
          <button
            type="button"
            className="header-search__close"
            onClick={close}
            aria-label={dict.nav.closeMenu}
          >
            <Icon name="x" size={17} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="site-nav__link site-header__search"
          onClick={() => setOpen(true)}
          aria-label={dict.search.label}
          aria-expanded={false}
        >
          <Icon name="search" size={19} />
        </button>
      )}

      {open && search.searching && (
        <div className="search-panel" role="region" aria-label={dict.search.label}>
          <div className="shell search-panel__inner">
            <SearchResults {...search} dict={dict} onNavigate={close} />
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Drawer — the phone's search, standing open above the menu                   */
/* -------------------------------------------------------------------------- */

/**
 * On a phone the field is already open — there is no glyph to press, because
 * the drawer is a place you went to on purpose. While a query is live the hits
 * take the body: you asked for these, so you shouldn't have to scroll past the
 * menu to reach them. Clearing the field puts the menu back.
 *
 * `children` is that menu.
 */
export function DrawerSearch({
  locale,
  dict,
  onNavigate,
  children,
}: {
  locale: Locale
  dict: Dictionary
  onNavigate: () => void
  children: React.ReactNode
}) {
  const search = useHubSearch(locale, true)

  return (
    <>
      <div className="drawer-search">
        <Icon name="search" size={17} className="header-search__glyph" />
        <input
          type="text"
          className="header-search__input"
          value={search.query}
          onChange={(e) => search.setQuery(e.target.value)}
          placeholder={dict.search.placeholder}
          aria-label={dict.search.label}
          autoComplete="off"
        />
        {search.query && (
          <button
            type="button"
            className="header-search__close"
            onClick={search.reset}
            aria-label={dict.nav.closeMenu}
          >
            <Icon name="x" size={17} />
          </button>
        )}
      </div>

      {search.searching ? (
        <div className="drawer-search__results">
          <SearchResults {...search} dict={dict} onNavigate={onNavigate} />
        </div>
      ) : (
        children
      )}
    </>
  )
}
