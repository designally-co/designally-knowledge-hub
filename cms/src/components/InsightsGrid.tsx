import React from 'react'

import { ArticleCard } from '@/components/ds'
import { PromoBanner } from '@/components/PromoBanner'
import type { CarouselItem } from '@/lib/resources'

type InsightsGridProps = {
  items: CarouselItem[]
  title: string
  bannerLabel: string
  bannerHref: string
}

export function InsightsGrid({ items, title, bannerLabel, bannerHref }: InsightsGridProps) {
  if (items.length === 0) return null

  return (
    <section className="insights" aria-labelledby="insights-heading">
      <div className="insights__inner">
        <h2 id="insights-heading" className="insights__heading">
          <img className="section-icon" src="/section-icons/insights.png" alt="" aria-hidden="true" />
          {title}
        </h2>

        <div className="insights__grid">
          {items.slice(0, 6).map((item) => (
            <ArticleCard
              className="insights__card"
              key={item.href}
              title={item.title}
              date={item.date}
              tags={item.tags}
              image={item.image}
              ratio={item.ratio}
              href={item.href}
              titleSize="sm"
            />
          ))}

          <PromoBanner className="insights__banner" label={bannerLabel} href={bannerHref} />
        </div>
      </div>
    </section>
  )
}
