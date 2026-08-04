import React from 'react'

import { ResourceCard } from '@/components/ds'
import { PromoBanner } from '@/components/PromoBanner'
import type { CarouselItem } from '@/lib/resources'

/**
 * "Resources" — the downloadable files (fonts, Figma files, templates) as a row
 * of folder cards. Seven resources plus the browse banner fill an eight-item
 * grid; the file colours cycle so the row reads as a set. Renders nothing when
 * there are no published files.
 */
const DOC_COLORS = [
  'var(--be-gold)',
  'var(--be-cobalt)',
  'var(--be-brick)',
  'var(--be-green)',
  'var(--be-purple)',
  'var(--be-rust)',
]

type ResourcesSectionProps = {
  items: CarouselItem[]
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
            <img className="section-icon" src="/section-icons/resources.png" alt="" aria-hidden="true" />
            {title}
          </h2>
        </div>

        <div className="resources__grid">
          {items.slice(0, 7).map((it, i) => (
            <ResourceCard
              key={it.id}
              title={it.title}
              date={it.date}
              category={it.tags?.[0]}
              color={DOC_COLORS[i % DOC_COLORS.length]}
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
