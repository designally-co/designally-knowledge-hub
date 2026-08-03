import React from 'react'

import { ArticleCard, Icon, SectionHeading, Tag, TopicPill } from '@/components/ds'
import { CaseStudyCarousel } from '@/components/CaseStudyCarousel'
import { InsightsGrid } from '@/components/InsightsGrid'
import { InsightsVideoPromo } from '@/components/InsightsVideoPromo'
import { WorkflowsGrid } from '@/components/WorkflowsGrid'
import { HeroCarousel } from '@/components/HeroCarousel'
import { getArticlesByCategory, getRecentArticles } from '@/lib/resources'
import { CATEGORIES, TAXONOMY, tagSlug } from '@/lib/tags'
import { categoryLabel, getDictionary, isLocale, localeHref, type Locale } from '@/lib/i18n'

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
  const recentArticle = items[0]
  const caseStudies = await getArticlesByCategory('Design', 12, locale)
  const insights = await getArticlesByCategory('Creative Things', 12, locale)
  const workflows = await getArticlesByCategory('Design with AI', 4, locale)

  const sections = (
    await Promise.all(
      CATEGORIES.filter((category) => category === 'New Update').map(async (category) => ({
        category,
        items: await getArticlesByCategory(category, 4, locale),
      })),
    )
  ).filter((s) => s.items.length > 0)

  return (
    <div>
      <div className="home-hero">
        <HeroCarousel items={items} />

        <section className="home-topics" aria-labelledby="home-topics-heading">
          <div className="home-topics__intro">
            <h1 id="home-topics-heading" className="home-topics__heading">
              {dict.home.heading}
            </h1>
          </div>

          <div className="home-topics__list">
            <nav className="home-topics__links" aria-label={dict.home.topicsLabel}>
              {TAXONOMY['Creative Things'].map((topic) => (
                <TopicPill
                  className="home-topics__pill"
                  href={localeHref(locale, `/tag/${tagSlug(topic)}`)}
                  key={topic}
                  size="md"
                >
                  {topic}
                </TopicPill>
              ))}
              <TopicPill
                className="home-topics__pill"
                href={localeHref(locale, '/category/creative-things')}
                size="md"
              >
                {dict.home.allTopics}
              </TopicPill>
            </nav>
          </div>
        </section>
      </div>

      {recentArticle && (
        <section className="recent-article" aria-label={dict.home.recentArticle}>
          <div className="recent-article__inner">
            <div className="recent-article__stage">
              {recentArticle.image ? (
                <img
                  className="recent-article__image"
                  src={recentArticle.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="recent-article__image recent-article__image--empty" aria-hidden="true" />
              )}

              <article className="recent-article__panel">
                <div className="recent-article__tags">
                  {recentArticle.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
                <h3 className="recent-article__title">{recentArticle.title}</h3>
                {recentArticle.date && <p className="recent-article__date">{recentArticle.date}</p>}
                <a
                  className="recent-article__link"
                  href={recentArticle.href}
                  aria-label={`${dict.home.readArticle}: ${recentArticle.title}`}
                >
                  <Icon name="arrow-right" size={24} strokeWidth={1.8} />
                </a>
              </article>
            </div>
          </div>
        </section>
      )}

      <CaseStudyCarousel
        items={caseStudies}
        title={dict.home.caseStudies}
        previousLabel={dict.home.previousArticles}
        nextLabel={dict.home.nextArticles}
        bannerLabel={dict.home.exploreDesign}
        bannerHref={localeHref(locale, '/category/design')}
      />

      <InsightsGrid
        items={insights}
        title={dict.home.insights}
        bannerLabel={dict.home.seeAllInsights}
        bannerHref={localeHref(locale, '/category/creative-things')}
      />

      <InsightsVideoPromo
        kicker={dict.home.videoPromoKicker}
        heading={dict.home.videoPromoHeading}
        body={dict.home.videoPromoBody}
        frequency={dict.home.videoPromoFrequency}
        instagramHref="https://www.instagram.com/designally.co/"
        facebookHref="https://www.facebook.com/designallyco/"
      />

      <WorkflowsGrid
        items={workflows}
        title={dict.home.workflows}
        bannerLabel={dict.home.workflowsBanner}
        bannerHref={localeHref(locale, '/category/design-with-ai')}
        seeAllLabel={dict.home.seeAllWorkflows}
      />

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
