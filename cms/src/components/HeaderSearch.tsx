'use client'

import React from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

import { ArticleCard, Icon, Tabs } from './ds'
import { SearchHitGrid } from './search/SearchHitGrid'
import { getSearchIdle, searchHub } from '@/lib/searchHub'
import {
  countLabel,
  groupLabel,
  MIN_QUERY,
  searchHref,
  type HubSearchResults,
  type SearchGroupKey,
  type SearchIdle,
} from '@/lib/searchShared'
import { tagLabel, type Dictionary, type Locale } from '@/lib/i18n'

/**
 * Search: the glyph in the header opens a frosted overlay over the whole page,
 * at every width — on phones too, where it sits in the bar beside the menu.
 *
 * Before a query it offers a way in: this browser's recent searches, the tags
 * most articles are filed under, and the newest articles. Typing turns it into
 * results, tabbed All / each category / Resources with their counts, the first
 * cards of each, and a way through to the /search page for the rest. Enter goes
 * there too.
 */
const DEBOUNCE_MS = 220
const RECENT_KEY = 'designally:recent-searches'
const RECENT_MAX = 6

/** Idle content per locale for the life of the page: it does not change while you read. */
const idleCache: Partial<Record<Locale, SearchIdle>> = {}

function readRecent(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(value)
      ? value.filter((term): term is string => typeof term === 'string').slice(0, RECENT_MAX)
      : []
  } catch {
    return []
  }
}

function writeRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch {
    /* Storage blocked (private mode, site data off): recents simply don't persist. */
  }
}

export function HeaderSearch({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const close = React.useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  return (
    <div className="header-search">
      <button
        ref={triggerRef}
        type="button"
        className="site-nav__link site-header__search"
        onClick={() => setOpen(true)}
        aria-label={dict.search.label}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="search" size={19} />
      </button>
      {open && createPortal(<SearchOverlay locale={locale} dict={dict} onClose={close} />, document.body)}
    </div>
  )
}

function SearchOverlay({
  locale,
  dict,
  onClose,
}: {
  locale: Locale
  dict: Dictionary
  onClose: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<HubSearchResults | null>(null)
  const [pending, startTransition] = React.useTransition()
  const [active, setActive] = React.useState<SearchGroupKey>('all')
  const [idle, setIdle] = React.useState<SearchIdle | null>(idleCache[locale] ?? null)
  const [recent, setRecent] = React.useState<string[]>([])

  const dialogRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const latestQuery = React.useRef('')

  const q = query.trim()
  const searching = q.length >= MIN_QUERY
  latestQuery.current = q

  // Recents belong to this browser, so they are read after mount.
  React.useEffect(() => {
    setRecent(readRecent())
  }, [])

  React.useEffect(() => {
    if (idleCache[locale]) return
    let live = true
    getSearchIdle(locale)
      .then((data) => {
        idleCache[locale] = data
        if (live) setIdle(data)
      })
      .catch(() => {
        if (live) setIdle({ trending: [], keywords: [] })
      })
    return () => {
      live = false
    }
  }, [locale])

  // Debounced, and a reply is only kept if it still answers what is in the field.
  React.useEffect(() => {
    if (!searching) {
      setResults(null)
      return
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const next = await searchHub(q, locale)
        if (next.query === latestQuery.current) setResults(next)
      })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [q, searching, locale])

  // A new query starts on All.
  React.useEffect(() => {
    setActive('all')
  }, [q])

  // Open: focus the field, hold the page still, keep Tab inside, close on Escape.
  React.useEffect(() => {
    inputRef.current?.focus()
    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = [
        ...dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input'),
      ]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      root.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const remember = React.useCallback((term: string) => {
    const t = term.trim()
    if (t.length < MIN_QUERY) return
    setRecent((list) => {
      const next = [t, ...list.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, RECENT_MAX)
      writeRecent(next)
      return next
    })
  }, [])

  const forget = (term: string) => {
    setRecent((list) => {
      const next = list.filter((x) => x !== term)
      writeRecent(next)
      return next
    })
  }

  const useTerm = (term: string) => {
    setQuery(term)
    inputRef.current?.focus()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searching) {
      inputRef.current?.focus()
      return
    }
    remember(q)
    onClose()
    router.push(searchHref(locale, q, active))
  }

  // Following any link out of the overlay (a result, a trending article, View
  // all) closes it, and a query that led somewhere is worth remembering.
  const onLinkClick = (e: React.MouseEvent) => {
    if (!(e.target as Element).closest('a[href]')) return
    if (searching) remember(q)
    onClose()
  }

  const tabs = results ? results.groups.filter((g) => g.key === 'all' || g.total > 0) : []
  const group = results?.groups.find((g) => g.key === active) ?? results?.groups[0]

  return (
    <div
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={dict.search.label}
      ref={dialogRef}
    >
      <button type="button" className="search-overlay__close" onClick={onClose}>
        <span className="search-overlay__close-disc" aria-hidden="true">
          <Icon name="x" size={22} strokeWidth={1.6} />
        </span>
        <span className="search-overlay__close-label">{dict.search.close}</span>
      </button>

      <div className="search-overlay__inner" onClick={onLinkClick}>
        <h2 className="search-overlay__title">{dict.search.title}</h2>

        <form className="search-field" role="search" onSubmit={submit}>
          {/* type="text", not "search": WebKit adds its own clear button to a
              search input, a second ✕ beside the overlay's Close. */}
          <input
            ref={inputRef}
            type="text"
            className="search-field__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.search.placeholder}
            aria-label={dict.search.label}
            autoComplete="off"
            enterKeyHint="search"
          />
          <button type="submit" className="search-field__submit" aria-label={dict.search.submit}>
            <Icon name="search" size={16} strokeWidth={2.4} />
          </button>
        </form>

        {searching ? (
          !results || !group ? (
            <p className="search-note" aria-live="polite">
              {dict.search.searching}
            </p>
          ) : results.total === 0 ? (
            <p className="search-note" aria-live="polite">
              {dict.search.empty.replace('{q}', results.query)}
            </p>
          ) : (
            <>
              {/* One bar: the tabs on the left, the count and the way to the
                  full list on the right. */}
              <div className="search-bar">
                <Tabs
                  className="search-tabs"
                  label={dict.search.label}
                  items={tabs.map((g) => ({
                    key: g.key,
                    label: `${groupLabel(g.key, locale, dict)} (${g.total})`,
                    active: g.key === group.key,
                    onClick: () => setActive(g.key),
                  }))}
                />

                <div className="search-summary">
                  <p className="search-summary__count" aria-live="polite">
                    {countLabel(group.total, dict)}
                  </p>
                  <Link className="search-summary__all" href={searchHref(locale, results.query, group.key)}>
                    {dict.search.viewAll}
                    <Icon name="arrow-right" size={18} />
                  </Link>
                </div>
              </div>

              <SearchHitGrid hits={group.hits} className={pending ? 'is-pending' : undefined} />
            </>
          )
        ) : (
          <div className="search-idle">
            <div className="search-idle__lists">
              {recent.length > 0 && (
                <section className="search-block">
                  <h3 className="search-block__title">{dict.search.recent}</h3>
                  <ul className="search-chips">
                    {recent.map((term) => (
                      <li key={term} className="search-chip search-chip--recent">
                        <button type="button" className="search-chip__term" onClick={() => useTerm(term)}>
                          {term}
                        </button>
                        <button
                          type="button"
                          className="search-chip__remove"
                          onClick={() => forget(term)}
                          aria-label={dict.search.removeRecent.replace('{q}', term)}
                        >
                          <Icon name="x" size={14} strokeWidth={2.2} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {idle && idle.keywords.length > 0 && (
                <section className="search-block">
                  <h3 className="search-block__title">{dict.search.popular}</h3>
                  <ul className="search-chips">
                    {idle.keywords.map((tag) => (
                      <li key={tag}>
                        <button
                          type="button"
                          className="search-chip search-chip--keyword"
                          onClick={() => useTerm(tagLabel(tag, locale))}
                        >
                          {tagLabel(tag, locale)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {idle && idle.trending.length > 0 && (
              <section className="search-block search-idle__trending">
                <h3 className="search-block__title">{dict.search.trending}</h3>
                <div className="search-trending">
                  {idle.trending.map((item) => (
                    <ArticleCard
                      key={item.href}
                      title={item.title}
                      date={item.date}
                      tags={item.tags}
                      image={item.image}
                      ratio={item.ratio}
                      href={item.href}
                      titleSize="md"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
