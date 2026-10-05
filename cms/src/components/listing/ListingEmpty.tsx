import React from 'react'
import { Button } from '@/components/ds'

/*
 * ListingEmpty — what a listing shows in place of its cards when nothing
 * matched: a heading that names the miss, a line on what to try, and a way
 * onward (popular keywords and/or one button). Each part is optional, so the
 * search page can leave the heading to its band, which already names the
 * query, instead of saying it twice.
 */
export interface ListingEmptyLink {
  label: string
  href: string
}

export interface ListingEmptyProps {
  title?: string
  hint?: string
  /** Shown as chips under `keywordsLabel`. Nothing renders when empty. */
  keywords?: ListingEmptyLink[]
  keywordsLabel?: string
  action?: ListingEmptyLink
}

export function ListingEmpty({ title, hint, keywords = [], keywordsLabel, action }: ListingEmptyProps) {
  return (
    <div className="listing-empty">
      {title && <h2 className="listing-empty__title">{title}</h2>}
      {hint && <p className="listing-empty__hint">{hint}</p>}

      {keywords.length > 0 && (
        <div className="listing-empty__keywords">
          {keywordsLabel && <p className="listing-empty__label">{keywordsLabel}</p>}
          <ul className="search-chips">
            {keywords.map((k) => (
              <li key={k.href}>
                <a className="search-chip search-chip--keyword" href={k.href}>
                  {k.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {action && (
        <Button className="listing-empty__action" variant="secondary" href={action.href}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
