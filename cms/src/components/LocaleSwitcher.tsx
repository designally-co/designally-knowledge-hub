'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Icon } from './ds'
import { LOCALES, getDictionary, switchLocalePath, type Locale } from '@/lib/i18n'

/*
 * Language switcher — the current locale and a caret, opening a small menu of
 * the alternatives. Each option links to the same page in that locale (English
 * unprefixed, Thai under /th), so it survives with JavaScript off as a plain
 * list of links. Client component because it reads the current pathname.
 *
 * `placement` points the menu away from the edge it sits against: down in the
 * header, up in the footer and at the foot of the drawer.
 */
export function LocaleSwitcher({
  locale,
  className,
  placement = 'down',
}: {
  locale: Locale
  className?: string
  placement?: 'down' | 'up'
}) {
  const pathname = usePathname() || '/'
  const [open, setOpen] = React.useState(false)
  // Which edge the menu hangs from. It defaults to the trigger's right edge and
  // flips only if that would put it off-screen.
  const [align, setAlign] = React.useState<'end' | 'start'>('end')
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  /* The switcher sits in three places, and in two of them its position moves:
     the footer row wraps it from the right edge to the left at some width that
     depends on how long the copyright line is in the current language, and the
     drawer holds it hard left. Rather than guess those crossovers in media
     queries, measure once when the menu opens and flip if it overflows.
     Layout effect, so the correction lands before paint. */
  const useMeasure = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect
  useMeasure(() => {
    if (!open) {
      setAlign('end')
      return
    }
    const rect = menuRef.current?.getBoundingClientRect()
    if (rect && rect.left < 12) setAlign('start')
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  const classes = [
    'locale-switcher',
    placement === 'up' ? 'locale-switcher--up' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} ref={wrapRef}>
      <button
        type="button"
        className="locale-switcher__trigger"
        aria-label="Language"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        ref={triggerRef}
      >
        <span>{getDictionary(locale).localeName}</span>
        <Icon name="chevron-down" size={14} className="locale-switcher__caret" />
      </button>

      {open && (
        <div
          className={`locale-switcher__menu${align === 'start' ? ' locale-switcher__menu--start' : ''}`}
          role="menu"
          ref={menuRef}
        >
          {LOCALES.map((l) => (
            <Link
              key={l}
              role="menuitem"
              className={`locale-switcher__option${l === locale ? ' is-active' : ''}`}
              href={switchLocalePath(pathname, l)}
              aria-current={l === locale ? 'true' : undefined}
              hrefLang={l}
              onClick={() => setOpen(false)}
            >
              <span>{getDictionary(l).localeName}</span>
              {l === locale && <Icon name="check" size={14} />}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
