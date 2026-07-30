import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticleCard, Tag } from '@/components/ds'
import { ArticleToc } from '@/components/ArticleToc'
import {
  getAllArticleSlugs,
  getArticleBySlug,
  getRecentArticles,
} from '@/lib/resources'
import { tagSlug } from '@/lib/tags'

/**
 * Article detail page — the reading view the hero-carousel cards link into.
 *
 * SSG: generateStaticParams prebuilds a page per published article slug.
 * ISR: revalidate rebuilds a page at most every 5 minutes, and dynamicParams
 * lets a newly published slug render on first request then cache.
 */
export const revalidate = 60
export const dynamicParams = true

type Params = { slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await getAllArticleSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return { title: 'Article not found' }
  return {
    title: article.title,
    description: article.dek,
  }
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  // Related: other recent articles, excluding this one.
  const related = (await getRecentArticles(5)).filter((r) => r.href !== `/articles/${slug}`).slice(0, 4)

  const meta = [article.date, article.readTime ? `${article.readTime} min read` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="article">
      <header className="article__head">
        {article.tags.length > 0 && (
          <div className="article__tags">
            {article.tags.map((t) => (
              <a key={t} href={`/tag/${tagSlug(t)}`} className="article__tag-link">
                <Tag>{t}</Tag>
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
                <p className="article-references__title">References</p>
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
            <h2 className="section-heading__title">Related articles</h2>
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
    </article>
  )
}
