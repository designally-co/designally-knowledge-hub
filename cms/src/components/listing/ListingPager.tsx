import React from 'react'
import Link from 'next/link'

import { Icon } from '@/components/ds'

/*
 * ListingPager — first / previous / a run of page numbers / next / last. The
 * page owns the URL scheme and passes `hrefForPage`, so the pager stays
 * presentational and works across the category, tag and resource listings.
 *
 * The numbers are a consecutive window centred on the current page as far as
 * the ends allow: seven on desktop, five on tablets, three on phones, where the
 * first/last jumps also drop out so the row fits. All seven are rendered, each
 * marked with the narrowest screen it belongs to, and listing.css hides the
 * rest — no client measuring, so the row never shifts after load.
 */
export interface ListingPagerProps {
  page: number
  totalPages: number
  hrefForPage: (page: number) => string
  labels: { first: string; previous: string; next: string; last: string; page: string }
}

/** `size` consecutive page numbers, centred on `page` as far as the ends allow. */
function pageWindow(page: number, total: number, size: number): number[] {
  const count = Math.min(size, total)
  const start = Math.min(Math.max(1, page - Math.floor(count / 2)), total - count + 1)
  return Array.from({ length: count }, (_, i) => start + i)
}

function PagerControl({
  kind,
  icon,
  label,
  target,
  enabled,
  hrefForPage,
}: {
  kind: 'edge' | 'step'
  icon: string
  label: string
  target: number
  enabled: boolean
  hrefForPage: (page: number) => string
}) {
  const className = `listing-pager__control listing-pager__control--${kind}`
  const glyph = <Icon name={icon} size={kind === 'edge' ? 20 : 24} strokeWidth={2} />
  return enabled ? (
    <Link className={className} href={hrefForPage(target)} aria-label={label}>
      {glyph}
    </Link>
  ) : (
    <span className={`${className} listing-pager__control--disabled`} aria-hidden="true">
      {glyph}
    </span>
  )
}

export function ListingPager({ page, totalPages, hrefForPage, labels }: ListingPagerProps) {
  if (totalPages <= 1) return null
  const numbers = pageWindow(page, totalPages, 7)
  const onTablet = new Set(pageWindow(page, totalPages, 5))
  const onPhone = new Set(pageWindow(page, totalPages, 3))
  const atStart = page <= 1
  const atEnd = page >= totalPages

  return (
    <nav className="listing-pager" aria-label={labels.page}>
      <PagerControl kind="edge" icon="skip-back" label={labels.first} target={1} enabled={!atStart} hrefForPage={hrefForPage} />
      <PagerControl kind="step" icon="chevron-left" label={labels.previous} target={page - 1} enabled={!atStart} hrefForPage={hrefForPage} />

      <ul className="listing-pager__list">
        {numbers.map((p) => {
          const reach = onPhone.has(p) ? 'phone' : onTablet.has(p) ? 'tablet' : 'desktop'
          return (
            <li key={p} className={`listing-pager__item listing-pager__item--${reach}`}>
              <Link
                className={`listing-pager__num${p === page ? ' listing-pager__num--active' : ''}`}
                href={hrefForPage(p)}
                aria-label={`${labels.page} ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </Link>
            </li>
          )
        })}
      </ul>

      <PagerControl kind="step" icon="chevron-right" label={labels.next} target={page + 1} enabled={!atEnd} hrefForPage={hrefForPage} />
      <PagerControl kind="edge" icon="skip-forward" label={labels.last} target={totalPages} enabled={!atEnd} hrefForPage={hrefForPage} />
    </nav>
  )
}
