import React from 'react'

import { ArticleCard, SectionHeading } from '@/components/ds'
import { HeroCarousel } from '@/components/HeroCarousel'
import { getArticlesByCategory, getRecentArticles } from '@/lib/resources'
import { CATEGORIES } from '@/lib/tags'

/**
 * Homepage. A server component that reads the most recent published articles
 * from Payload's Local API and hands them to the (client) hero carousel.
 *
 * `revalidate` makes this Incrementally Static: the page is prerendered and
 * CDN-cached, then quietly rebuilt at most once every 5 minutes, so newly
 * published articles appear without a redeploy and without hitting the DB on
 * every visit.
 */
export const revalidate = 60

export default async function HomePage() {
  const items = await getRecentArticles(10)

  // One section per category (in taxonomy order), skipping any with no articles.
  const sections = (
    await Promise.all(
      CATEGORIES.map(async (category) => ({
        category,
        items: await getArticlesByCategory(category, 4),
      })),
    )
  ).filter((s) => s.items.length > 0)

  return (
    <div>
      <HeroCarousel items={items} />

      <div className="shell" style={{ paddingBlock: 'clamp(16px, 4vw, 48px)' }}>
        <h1
          style={{
            font: 'var(--type-display-2)',
            color: 'var(--be-ink)',
            margin: 0,
            maxWidth: '18ch',
            textWrap: 'balance',
          }}
        >
          Learn how better brands are built.
        </h1>
      </div>

      {sections.map(({ category, items: cards }) => (
        <section
          className="shell home-section"
          id={`cat-${category.toLowerCase().replace(/\s+/g, '-')}`}
          key={category}
        >
          <SectionHeading>{category}</SectionHeading>
          <div className="card-grid">
            {cards.map((it) => (
              <ArticleCard
                key={it.href}
                title={it.title}
                date={it.date}
                tags={it.tags}
                image={it.image}
                ratio="4 / 3"
                href={it.href}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
