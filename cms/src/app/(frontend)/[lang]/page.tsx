import React from 'react'

import { Icon, Tag, TopicPill } from '@/components/ds'
import { CaseStudyCarousel } from '@/components/CaseStudyCarousel'
import { InsightsGrid } from '@/components/InsightsGrid'
import { InsightsVideoPromo } from '@/components/InsightsVideoPromo'
import { WorkflowsGrid } from '@/components/WorkflowsGrid'
import { TopicsSection } from '@/components/TopicsSection'
import { ResourcesSection } from '@/components/ResourcesSection'
import { HeroCarousel } from '@/components/HeroCarousel'
import { NewsletterCta } from '@/components/NewsletterCta'
import { getArticlesByCategory, getDownloadableFiles, getLatestTags, getRecentArticles } from '@/lib/resources'
import { TAG_OPTIONS, TAXONOMY, tagSlug } from '@/lib/tags'
import { getDictionary, isLocale, localeHref, type Locale } from '@/lib/i18n'

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
  const resources = await getDownloadableFiles(7, locale)

  // Topics pill cloud: the tags of the latest published articles (unique, newest
  // first, up to 12); fall back to the first taxonomy tags if there's no content.
  const latestTags = await getLatestTags(12, locale)
  const topicTags = latestTags.length > 0 ? latestTags : TAG_OPTIONS.slice(0, 12)

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

      <div className="warm-band">
        <WorkflowsGrid
          items={workflows}
          title={dict.home.workflows}
          bannerLabel={dict.home.workflowsBanner}
          bannerHref={localeHref(locale, '/category/design-with-ai')}
          seeAllLabel={dict.home.seeAllWorkflows}
        />

        <TopicsSection title={dict.home.topics} locale={locale} topics={topicTags} />
      </div>

      <ResourcesSection
        items={resources}
        title={dict.home.resources}
        seeAllLabel={dict.home.seeAllResources}
        seeAllHref={localeHref(locale, '/resources')}
      />

      <NewsletterCta dict={dict} />

    </div>
  )
}
