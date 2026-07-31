import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticleCard, Tag } from '@/components/ds'
import { ArticleToc } from '@/components/ArticleToc'
import { NewsletterCta } from '@/components/NewsletterCta'
import {
  getAllArticleSlugs,
  getArticleBySlug,
  getRecentArticles,
} from '@/lib/resources'
import { tagSlug } from '@/lib/tags'
import { getDictionary, isLocale, localeHref, tagLabel, LOCALES, type Locale } from '@/lib/i18n'

/**
 * Article detail page. SSG per (locale, slug); ISR revalidates; dynamicParams
 * lets a newly published slug render on first request then cache.
 */
export const revalidate = 60
export const dynamicParams = true

type Params = { lang: string; slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await getAllArticleSlugs()
  return LOCALES.flatMap((lang) => slugs.map((slug) => ({ lang, slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { lang, slug } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const article = await getArticleBySlug(slug, locale)
  if (!article) return { title: 'Article not found' }
  return {
    title: article.title,
    description: article.dek,
  }
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { lang, slug } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)

  const article = await getArticleBySlug(slug, locale)
  if (!article) notFound()

  const selfHref = localeHref(locale, `/articles/${slug}`)
  const related = (await getRecentArticles(5, locale)).filter((r) => r.href !== selfHref).slice(0, 4)

  const meta = [article.date, article.readTime ? `${article.readTime} ${dict.article.minRead}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="article">
      <div className="article__masthead">
        <header className="article__head">
          {article.tags.length > 0 && (
            <div className="article__tags">
              {article.tags.map((t) => (
                <a
                  key={t}
                  href={localeHref(locale, `/tag/${tagSlug(t)}`)}
                  className="article__tag-link"
                >
                  <Tag>{tagLabel(t, locale)}</Tag>
                </a>
              ))}
            </div>
          )}

          <h1 className="article__title">{article.title}</h1>

          {article.dek && <p className="article__dek">{article.dek}</p>}

          {meta && (
            <div className="article__byline">
              <p className="article__meta">{meta}</p>
            </div>
          )}
        </header>

        <div className="article__cover">
          {article.image ? (
            <img className="article__hero" src={article.image} alt="" decoding="async" />
          ) : (
            <div className="article__hero article__hero--empty" aria-hidden="true" />
          )}
        </div>
      </div>

      {article.body && (
        <div className="article__layout">
          <aside className="article__toc-col">
            <ArticleToc />
          </aside>

          <div className="article__main">
            <div className="article-body">
              <RichText data={article.body} />
            </div>

            {article.references.length > 0 && (
              <div className="article-references">
                <p className="article-references__title">{dict.article.references}</p>
                <ul className="article-references__list">
                  {article.references.map((ref, i) => (
                    <li key={i}>
                      <a
                        className="article-references__link"
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {ref.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <section className="article__related">
          <div className="shell">
            <h2 className="section-heading__title">{dict.article.related}</h2>
            <div className="article__related-grid">
              {related.map((r) => (
                <ArticleCard
                  key={r.href}
                  title={r.title}
                  date={r.date}
                  tags={r.tags}
                  image={r.image}
                  ratio={r.ratio}
                  href={r.href}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <NewsletterCta dict={dict} />
    </article>
  )
}
