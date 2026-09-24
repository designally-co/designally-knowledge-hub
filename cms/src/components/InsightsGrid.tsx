import React from 'react'

import { ArticleCard } from '@/components/ds'
import { PromoBannerCell } from '@/components/PromoBannerCell'
import type { CarouselItem } from '@/lib/resources'

type InsightsGridProps = {
  items: CarouselItem[]
  title: string
  bannerLabel: string
  bannerHref: string
  seeAllLabel: string
}

export function InsightsGrid({
  items,
  title,
  bannerLabel,
  bannerHref,
  seeAllLabel,
}: InsightsGridProps) {
  if (items.length === 0) return null

  return (
    <section className="insights" aria-labelledby="insights-heading">
      <div className="insights__inner">
        <h2 id="insights-heading" className="insights__heading">
          <img className="section-icon" src="/section-icons/insights.svg" alt="" aria-hidden="true" />
          {title}
        </h2>

        <div className="insights__grid">
          {items.slice(0, 6).map((item, i) => (
            <ArticleCard
              className="insights__card"
              key={item.href}
              title={item.title}
              date={item.date}
              tags={item.tags}
              image={item.image}
              imageSrcSet={item.imageSrcSet}
              imageSizes={i === 0 ? '(max-width: 47.999em) 100vw, 50vw' : undefined}
              ratio={item.ratio}
              href={item.href}
              titleSize="sm"
            />
          ))}

          <PromoBannerCell
            bannerClassName="insights__banner"
            graphic="/promo/insights.png"
            label={bannerLabel}
            href={bannerHref}
            seeAllLabel={seeAllLabel}
          />
        </div>
      </div>
    </section>
  )
}
