import React from 'react'
import Link from 'next/link'

import { Icon } from '@/components/ds'

/*
 * ListingPager — numbered pagination with previous/next. The page owns the URL
 * scheme and passes `hrefForPage`, so the pager stays presentational and works
 * across the category, tag and resource listings. A windowed set of numbers
 * (current ±1, always first/last, ellipses between) keeps the row short when
 * there are many pages.
 */
export interface ListingPagerProps {
  page: number
  totalPages: number
  hrefForPage: (page: number) => string
  labels: { previous: string; next: string; page: string }
}

/** The page numbers to render, with `null` marking an ellipsis gap. */
function windowed(page: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | null)[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(total - 1, page + 1)
  if (start > 2) out.push(null)
  for (let p = start; p <= end; p++) out.push(p)
  if (end < total - 1) out.push(null)
  out.push(total)
  return out
}

export function ListingPager({ page, totalPages, hrefForPage, labels }: ListingPagerProps) {
  if (totalPages <= 1) return null
  const pages = windowed(page, totalPages)

  return (
    <nav className="listing-pager" aria-label={labels.page}>
      {page > 1 ? (
        <Link className="listing-pager__arrow" href={hrefForPage(page - 1)} aria-label={labels.previous}>
          <Icon name="chevron-left" size={20} />
        </Link>
      ) : (
        <span className="listing-pager__arrow listing-pager__arrow--disabled" aria-hidden="true">
          <Icon name="chevron-left" size={20} />
        </span>
      )}

      <ul className="listing-pager__list">
        {pages.map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} className="listing-pager__gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                className={`listing-pager__num${p === page ? ' listing-pager__num--active' : ''}`}
                href={hrefForPage(p)}
                aria-label={`${labels.page} ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ul>

      {page < totalPages ? (
        <Link className="listing-pager__arrow" href={hrefForPage(page + 1)} aria-label={labels.next}>
          <Icon name="chevron-right" size={20} />
        </Link>
      ) : (
        <span className="listing-pager__arrow listing-pager__arrow--disabled" aria-hidden="true">
          <Icon name="chevron-right" size={20} />
        </span>
      )}
    </nav>
  )
}
