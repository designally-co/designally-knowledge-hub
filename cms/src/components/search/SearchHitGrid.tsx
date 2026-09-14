import React from 'react'

import { ArticleCard, ResourceCard } from '@/components/ds'
import type { SearchHit } from '@/lib/searchShared'

/**
 * Search results as the site's own cards, articles and resources side by side —
 * shared by the overlay and the /search page.
 */
export function SearchHitGrid({ hits, className = '' }: { hits: SearchHit[]; className?: string }) {
  return (
    <ul className={['search-grid', className].filter(Boolean).join(' ')}>
      {hits.map((hit) => (
        <li key={`${hit.kind}-${hit.item.id}`}>
          {hit.kind === 'article' ? (
            <ArticleCard
              title={hit.item.title}
              date={hit.item.date}
              tags={hit.item.tags}
              image={hit.item.image}
              ratio={hit.item.ratio}
              href={hit.item.href}
              titleSize="md"
            />
          ) : (
            <ResourceCard
              title={hit.item.title}
              date={hit.item.date}
              category={hit.item.category}
              color={hit.item.color}
              glyph={hit.item.glyph}
              formats={hit.item.formats}
              href={hit.item.href}
            />
          )}
        </li>
      ))}
    </ul>
  )
}
