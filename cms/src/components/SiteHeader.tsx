'use client'

import React from 'react'
import Link from 'next/link'

import { Button, IconButton, Icon } from './ds'
import { LocaleSwitcher } from './LocaleSwitcher'
import { CATEGORIES, TAXONOMY, TAG_OPTIONS, tagSlug, type Category } from '@/lib/tags'
import {
  categoryLabel,
  localeHref,
  tagLabel,
  type Dictionary,
  type Locale,
} from '@/lib/i18n'

/*
 * SiteHeader — sticky masthead, ported from the standalone Vite app. Locale-aware:
 * links are prefixed for the active locale (English unprefixed, Thai under /th),
 * category/tag labels and chrome strings come from the dictionary, and a language
 * switcher swaps between EN / ไทย for the current page.
 *
 * Desktop (>=64em, pointer): the four category links reveal a full-width panel of
 * that category's tags, with debounced hover intent. Below 64em / on touch the nav
 * collapses into the drawer.
 */

const WORDMARK = 'Designally'

/** Homepage anchor for a category section, in the given locale. */
function categoryAnchor(category: string, locale: Locale): string {
  return localeHref(locale, `/#cat-${category.toLowerCase().replace(/\s+/g, '-')}`)
}

const DRAWER_TOPICS = TAG_OPTIONS.slice(0, 8)

// Hover intent. Opening is near-instant; closing lags so the cursor can cross
// the gap between the trigger row and the panel without dismissing it.
const OPEN_DELAY = 90
const CLOSE_DELAY = 180

function useLockBodyScroll() {
  React.useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])
}

/* -------------------------------------------------------------------------- */
/* Desktop category panel                                                      */
/* -------------------------------------------------------------------------- */

function NavPanel({ category, locale, dict }: { category: Category; locale: Locale; dict: Dictionary }) {
  const tags = TAXONOMY[category]

  return (
    <div className="nav-panel" id={`nav-panel-${tagSlug(category)}`}>
      <div className="shell nav-panel__inner">
        <div className="nav-panel__rail">
          <span className="nav-panel__title">{categoryLabel(category, locale)}</span>
          <Link className="nav-panel__all" href={categoryAnchor(category, locale)}>
            {dict.nav.viewAll}
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>

        <ul className="nav-panel__tags">
          {tags.map((tag, i) => (
            <li key={tag} style={{ '--i': i } as React.CSSProperties}>
              <Link className="nav-panel__tag" href={localeHref(locale, `/tag/${tagSlug(tag)}`)}>
                <span>{tagLabel(tag, locale)}</span>
                <Icon name="arrow-right" size={14} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Mobile drawer                                                               */
/* -------------------------------------------------------------------------- */

type DrawerProps = {
  onClose: () => void
  returnFocusTo: React.RefObject<HTMLButtonElement | null>
  locale: Locale
  dict: Dictionary
}

function Drawer({ onClose, returnFocusTo, locale, dict }: DrawerProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)

  useLockBodyScroll()

  React.useEffect(() => {
    closeRef.current?.focus()
    const restoreTo = returnFocusTo

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables?.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
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
      document.removeEventListener('keydown', onKeyDown)
      restoreTo?.current?.focus()
    }
  }, [onClose, returnFocusTo])

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label={dict.nav.menu} ref={panelRef}>
        <div className="drawer__head">
          <span className="wordmark" aria-hidden="true">
            {WORDMARK}
          </span>
          <button
            type="button"
            className="icon-btn icon-btn--bare icon-btn--md"
            aria-label={dict.nav.closeMenu}
            onClick={onClose}
            ref={closeRef}
          >
            <Icon name="x" size={22} />
          </button>
        </div>

        <nav aria-label={dict.nav.menu}>
          <ul className="drawer__list">
            {CATEGORIES.map((item) => (
              <li key={item}>
                <Link className="drawer__link" href={categoryAnchor(item, locale)} onClick={onClose}>
                  {categoryLabel(item, locale)}
                </Link>
              </li>
            ))}
            <li>
              <Link className="drawer__link" href={localeHref(locale, '/resources')} onClick={onClose}>
                {dict.nav.resources}
              </Link>
            </li>
          </ul>
        </nav>

        <p className="drawer__label">{dict.nav.topics}</p>
        <div className="drawer__topics">
          {DRAWER_TOPICS.map((t) => (
            <Link
              key={t}
              className="topic-chip"
              href={localeHref(locale, `/tag/${tagSlug(t)}`)}
              onClick={onClose}
            >
              {tagLabel(t, locale)}
            </Link>
          ))}
        </div>

        <Button href={localeHref(locale, '/')} className="drawer__cta" onClick={onClose}>
          {dict.nav.subscribe}
        </Button>

        <LocaleSwitcher locale={locale} className="drawer__locale" />
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Header                                                                      */
/* -------------------------------------------------------------------------- */

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [openCategory, setOpenCategory] = React.useState<Category | null>(null)
  const toggleRef = React.useRef<HTMLButtonElement>(null)
  const navRef = React.useRef<HTMLDivElement>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  const scheduleOpen = (category: Category) => {
    clearTimer()
    timer.current = setTimeout(() => setOpenCategory(category), OPEN_DELAY)
  }

  const scheduleClose = () => {
    clearTimer()
    timer.current = setTimeout(() => setOpenCategory(null), CLOSE_DELAY)
  }

  const closeNow = React.useCallback(() => {
    clearTimer()
    setOpenCategory(null)
  }, [])

  React.useEffect(() => clearTimer, [])

  // Escape closes the panel and hands focus back to the trigger row.
  React.useEffect(() => {
    if (!openCategory) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const active = document.activeElement
      closeNow()
      if (active instanceof HTMLElement && navRef.current?.contains(active)) active.blur()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openCategory, closeNow])

  return (
    <>
      <header
        className={['site-header', openCategory ? 'site-header--open' : ''].filter(Boolean).join(' ')}
        onMouseLeave={scheduleClose}
      >
        <div className="shell site-header__bar">
          <Link className="wordmark" href={localeHref(locale, '/')} onFocus={closeNow}>
            {WORDMARK}
          </Link>

          <nav className="site-nav" aria-label={dict.nav.menu} ref={navRef}>
            {CATEGORIES.map((item) => {
              const isOpen = openCategory === item
              return (
                <Link
                  key={item}
                  className={['site-nav__link', isOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
                  href={categoryAnchor(item, locale)}
                  aria-expanded={isOpen}
                  aria-controls={`nav-panel-${tagSlug(item)}`}
                  onMouseEnter={() => scheduleOpen(item)}
                  onFocus={() => setOpenCategory(item)}
                  onClick={closeNow}
                >
                  {categoryLabel(item, locale)}
                </Link>
              )
            })}

            {/* Resources has no sub-tags — a plain link, no panel. */}
            <Link
              className="site-nav__link"
              href={localeHref(locale, '/resources')}
              onMouseEnter={scheduleClose}
              onFocus={closeNow}
            >
              {dict.nav.resources}
            </Link>
          </nav>

          <div className="site-header__actions">
            <LocaleSwitcher locale={locale} className="site-header__locale" />
            <Button size="sm" href={localeHref(locale, '/')} className="site-header__subscribe">
              {dict.nav.subscribe}
            </Button>
            {/* TODO: wire search once a search route exists. */}
            <IconButton icon="search" variant="bare" size="sm" label="Search" />
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={drawerOpen}
              aria-label={drawerOpen ? dict.nav.closeMenu : dict.nav.menu}
              onClick={() => setDrawerOpen((v) => !v)}
              ref={toggleRef}
            >
              <Icon name={drawerOpen ? 'x' : 'menu'} size={24} />
            </button>
          </div>
        </div>

        {openCategory && (
          <div onMouseEnter={clearTimer} onMouseLeave={scheduleClose}>
            <NavPanel category={openCategory} locale={locale} dict={dict} />
          </div>
        )}
      </header>

      {drawerOpen && (
        <Drawer
          onClose={() => setDrawerOpen(false)}
          returnFocusTo={toggleRef}
          locale={locale}
          dict={dict}
        />
      )}
    </>
  )
}
