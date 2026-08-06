import React from 'react'
import Link from 'next/link'

import { Icon } from '@/components/ds'

/*
 * ListingControls — the filter + search row beneath the hero. Filter pills are
 * plain links (the page computes each one's href and active state, preserving
 * the current search); search is a native GET form so it works without JS and
 * stays server-rendered. The form carries the active tag as a hidden field so a
 * search keeps the current filter, and omits `page` so a new search resets to
 * the first page.
 */
export interface ListingFilter {
  label: string
  href: string
  active: boolean
}

export interface ListingControlsProps {
  filters: ListingFilter[]
  searchAction: string
  searchValue?: string
  /** Hidden fields preserved on search (e.g. the active tag). */
  hiddenFields?: { name: string; value: string }[]
  placeholder: string
  searchLabel: string
}

export function ListingControls({
  filters,
  searchAction,
  searchValue,
  hiddenFields = [],
  placeholder,
  searchLabel,
}: ListingControlsProps) {
  return (
    <div className="listing-controls">
      <div className="listing-filters" role="list">
        {filters.map((f) => (
          <Link
            key={f.href + f.label}
            href={f.href}
            role="listitem"
            className={`listing-filter${f.active ? ' listing-filter--active' : ''}`}
            aria-current={f.active ? 'true' : undefined}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <form className="listing-search" action={searchAction} method="get" role="search">
        {hiddenFields.map((h) => (
          <input key={h.name} type="hidden" name={h.name} value={h.value} />
        ))}
        <button className="listing-search__submit" type="submit" aria-label={searchLabel}>
          <Icon name="search" size={18} />
        </button>
        <input
          className="listing-search__input"
          type="search"
          name="q"
          defaultValue={searchValue}
          placeholder={placeholder}
          aria-label={searchLabel}
        />
      </form>
    </div>
  )
}
