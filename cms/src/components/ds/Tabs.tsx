import React from 'react'
import Link from 'next/link'

/* Tabs — a row of text tabs with an underline on the active one.

   A tab with `href` is a link (the /search page, where each tab is its own
   URL); a tab with `onClick` is a button that switches in place (the search
   overlay). A row of links is a <nav> and needs `label`; a row of buttons is a
   plain group. */
export interface TabItem {
  key: string
  label: React.ReactNode
  active: boolean
  href?: string
  onClick?: () => void
}

export interface TabsProps {
  items: TabItem[]
  /** Accessible name, required when the tabs are links. */
  label?: string
  className?: string
}

export function Tabs({ items, label, className = '' }: TabsProps) {
  const classes = ['tabs', className].filter(Boolean).join(' ')
  const tabClass = (active: boolean) => `tab${active ? ' tab--active' : ''}`
  const asNav = items.some((t) => t.href)

  const tabs = items.map((t) =>
    t.href ? (
      <Link
        key={t.key}
        className={tabClass(t.active)}
        href={t.href}
        aria-current={t.active ? 'page' : undefined}
      >
        {t.label}
      </Link>
    ) : (
      <button
        key={t.key}
        type="button"
        className={tabClass(t.active)}
        aria-pressed={t.active}
        onClick={t.onClick}
      >
        {t.label}
      </button>
    ),
  )

  return asNav ? (
    <nav className={classes} aria-label={label}>
      {tabs}
    </nav>
  ) : (
    <div className={classes} role="group" aria-label={label}>
      {tabs}
    </div>
  )
}
