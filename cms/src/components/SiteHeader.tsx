'use client'

import React from 'react'
import Link from 'next/link'

import { Button, IconButton, Icon } from './ds'
import { CATEGORIES, TAXONOMY, TAG_OPTIONS, tagSlug, type Category } from '@/lib/tags'

/*
 * SiteHeader — sticky masthead, ported from the standalone Vite app's
 * pages/Header.jsx. Styling lives in styles/layout.css (.site-header / .nav-panel
 * / .drawer …).
 *
 * Desktop (>=64em, pointer devices): the four category links reveal a full-width
 * panel listing that category's tags. Hover intent is debounced (OPEN_DELAY /
 * CLOSE_DELAY) so travelling diagonally from a trigger into the panel doesn't
 * flicker it shut, and the panel is keyboard reachable (focus opens it, Escape
 * closes and restores focus).
 *
 * Below 64em / on touch the nav collapses into the drawer, which lists the
 * categories and a sample of topics.
 *
 * Links go to real Hub routes: categories -> homepage section anchors, tags ->
 * /tag/[slug], Resources -> /resources.
 */

const WORDMARK = 'Designally'

/** Homepage anchor for a category section (see (frontend)/page.tsx). */
export function categoryAnchor(category: string): string {
  return `/#cat-${category.toLowerCase().replace(/\s+/g, '-')}`
}

// TODO: point Subscribe at a real destination (newsletter signup / external).
const SUBSCRIBE_HREF = '/'
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

function NavPanel({ category }: { category: Category }) {
  const tags = TAXONOMY[category]

  return (
    <div className="nav-panel" id={`nav-panel-${tagSlug(category)}`}>
      <div className="shell nav-panel__inner">
        <div className="nav-panel__rail">
          <span className="nav-panel__title">{category}</span>
          <Link className="nav-panel__all" href={categoryAnchor(category)}>
            View all
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>

        <ul className="nav-panel__tags">
          {tags.map((tag, i) => (
            <li key={tag} style={{ '--i': i } as React.CSSProperties}>
              <Link className="nav-panel__tag" href={`/tag/${tagSlug(tag)}`}>
                <span>{tag}</span>
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
}

function Drawer({ onClose, returnFocusTo }: DrawerProps) {
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
      // Keep tabbing inside the panel while it owns the screen.
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
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Site menu" ref={panelRef}>
        <div className="drawer__head">
          <span className="wordmark" aria-hidden="true">
            {WORDMARK}
          </span>
          <button
            type="button"
            className="icon-btn icon-btn--bare icon-btn--md"
            aria-label="Close menu"
            onClick={onClose}
            ref={closeRef}
          >
            <Icon name="x" size={22} />
          </button>
        </div>

        <nav aria-label="Sections">
          <ul className="drawer__list">
            {CATEGORIES.map((item) => (
              <li key={item}>
                <Link className="drawer__link" href={categoryAnchor(item)} onClick={onClose}>
                  {item}
                </Link>
              </li>
            ))}
            <li>
              <Link className="drawer__link" href="/resources" onClick={onClose}>
                Resources
              </Link>
            </li>
          </ul>
        </nav>

        <p className="drawer__label">Topics</p>
        <div className="drawer__topics">
          {DRAWER_TOPICS.map((t) => (
            <Link key={t} className="topic-chip" href={`/tag/${tagSlug(t)}`} onClick={onClose}>
              {t}
            </Link>
          ))}
        </div>

        <Button href={SUBSCRIBE_HREF} className="drawer__cta" onClick={onClose}>
          Subscribe
        </Button>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Header                                                                      */
/* -------------------------------------------------------------------------- */

export function SiteHeader() {
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
          <Link className="wordmark" href="/" onFocus={closeNow}>
            {WORDMARK}
          </Link>

          <nav className="site-nav" aria-label="Sections" ref={navRef}>
            {CATEGORIES.map((item) => {
              const isOpen = openCategory === item
              return (
                <Link
                  key={item}
                  className={['site-nav__link', isOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
                  href={categoryAnchor(item)}
                  aria-expanded={isOpen}
                  aria-controls={`nav-panel-${tagSlug(item)}`}
                  onMouseEnter={() => scheduleOpen(item)}
                  onFocus={() => setOpenCategory(item)}
                  onClick={closeNow}
                >
                  {item}
                </Link>
              )
            })}

            {/* Resources has no sub-tags — a plain link, no panel. */}
            <Link
              className="site-nav__link"
              href="/resources"
              onMouseEnter={scheduleClose}
              onFocus={closeNow}
            >
              Resources
            </Link>
          </nav>

          <div className="site-header__actions">
            <Button size="sm" href={SUBSCRIBE_HREF} className="site-header__subscribe">
              Subscribe
            </Button>
            {/* TODO: wire search once a search route exists. */}
            <IconButton icon="search" variant="bare" size="sm" label="Search" />
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={drawerOpen}
              aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setDrawerOpen((v) => !v)}
              ref={toggleRef}
            >
              <Icon name={drawerOpen ? 'x' : 'menu'} size={24} />
            </button>
          </div>
        </div>

        {openCategory && (
          <div onMouseEnter={clearTimer} onMouseLeave={scheduleClose}>
            <NavPanel category={openCategory} />
          </div>
        )}
      </header>

      {/* Rendered outside the sticky header so the panel isn't trapped in its
          stacking context. */}
      {drawerOpen && (
        <Drawer onClose={() => setDrawerOpen(false)} returnFocusTo={toggleRef} />
      )}
    </>
  )
}
