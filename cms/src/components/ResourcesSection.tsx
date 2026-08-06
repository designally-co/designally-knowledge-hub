import React from 'react'

import { ResourceCard } from '@/components/ds'
import { PromoBanner } from '@/components/PromoBanner'
import type { ResourceItem } from '@/lib/resources'

/**
 * "Resources" — the downloadable files as a row of folder cards. Seven
 * resources plus the browse banner fill an eight-item grid. Renders nothing
 * when there are no published files.
 *
 * Colour and glyph come from each resource's category preset, not from its
 * position in the row: a category has to look the same here as it does on the
 * /resources grid and on its own page, or it stops reading as a category.
 */
type ResourcesSectionProps = {
  items: ResourceItem[]
  title: string
  seeAllLabel: string
  seeAllHref: string
}

export function ResourcesSection({ items, title, seeAllLabel, seeAllHref }: ResourcesSectionProps) {
  if (items.length === 0) return null

  return (
    <section className="resources" aria-labelledby="resources-heading">
      <div className="resources__inner">
        <div className="resources__header">
          <h2 id="resources-heading" className="resources__heading">
            <img className="section-icon" src="/section-icons/resources.svg" alt="" aria-hidden="true" />
            {title}
          </h2>
        </div>

        <div className="resources__grid">
          {items.slice(0, 7).map((it) => (
            <ResourceCard
              key={it.id}
              title={it.title}
              date={it.date}
              category={it.category}
              color={it.color}
              glyph={it.glyph}
              formats={it.formats}
              href={it.href}
            />
          ))}

          <PromoBanner
            className="resources__banner"
            label={seeAllLabel}
            href={seeAllHref}
          />
        </div>
      </div>
    </section>
  )
}
