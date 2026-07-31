import React from 'react'

import { ArticleCard, SectionHeading } from '@/components/ds'
import { HeroCarousel } from '@/components/HeroCarousel'
import { getArticlesByCategory, getRecentArticles } from '@/lib/resources'
import { CATEGORIES } from '@/lib/tags'
import { categoryLabel, getDictionary, isLocale, type Locale } from '@/lib/i18n'

/**
 * Homepage. A server component that reads the most recent published articles
 * from Payload's Local API (in the active locale) and hands them to the hero
 * carousel + per-category rows. ISR-cached.
 */
export const revalidate = 60

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)

  const items = await getRecentArticles(10, locale)

  const sections = (
    await Promise.all(
      CATEGORIES.map(async (category) => ({
        category,
        items: await getArticlesByCategory(category, 4, locale),
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
          {dict.home.heading}
        </h1>
      </div>

      {sections.map(({ category, items: cards }) => (
        <section
          className="shell home-section"
          id={`cat-${category.toLowerCase().replace(/\s+/g, '-')}`}
          key={category}
        >
          <SectionHeading>{categoryLabel(category, locale)}</SectionHeading>
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
