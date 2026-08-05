import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ResourceCard, Tag } from '@/components/ds'
import {
  getAllResourceSlugs,
  getDownloadableFiles,
  getResourceBySlug,
} from '@/lib/resources'
import { getDictionary, isLocale, localeHref, LOCALES, type Locale } from '@/lib/i18n'

/**
 * Resource detail page. SSG per (locale, slug); ISR revalidates; dynamicParams
 * lets a newly published slug render on first request and then cache.
 *
 * There is no cover image here and there never will be — resources take no
 * uploads. The hero is the category preset (colour + glyph), the same artwork
 * the card in the grid uses, so arriving on this page feels like the card
 * opening rather than a different design.
 */
export const revalidate = 60
export const dynamicParams = true

type Params = { lang: string; slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await getAllResourceSlugs()
  return LOCALES.flatMap((lang) => slugs.map((slug) => ({ lang, slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { lang, slug } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const resource = await getResourceBySlug(slug, locale)
  if (!resource) return { title: getDictionary(locale).resources.notFound }
  return {
    title: resource.title,
    description: resource.summary,
  }
}

export default async function ResourcePage({ params }: { params: Promise<Params> }) {
  const { lang, slug } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)

  const resource = await getResourceBySlug(slug, locale)
  if (!resource) notFound()

  // Siblings for the "more like this" row: same category, this one dropped.
  const others = (await getDownloadableFiles(12, locale))
    .filter((r) => r.slug !== resource.slug && r.category === resource.category)
    .slice(0, 3)

  return (
    <div className="shell resource-page">
      <a className="resource-page__back" href={localeHref(locale, '/resources')}>
        ← {dict.resources.backToResources}
      </a>

      <header className="resource-page__head">
        <div
          className="resource-page__art"
          style={{ '--doc-color': resource.color } as React.CSSProperties}
          aria-hidden="true"
        >
          <span className="resource-page__art-title">{resource.title}</span>
        </div>

        <div className="resource-page__intro">
          {resource.category && (
            <div className="resource-page__tags">
              <Tag>{resource.category}</Tag>
            </div>
          )}
          <h1 className="resource-page__title">{resource.title}</h1>
          {resource.summary && <p className="resource-page__dek">{resource.summary}</p>}

          {resource.files.length > 0 && (
            <div className="resource-page__actions">
              {resource.files.map((f) => (
                <a
                  key={f.url}
                  className="btn btn--primary"
                  href={f.url}
                  download={f.filename}
                  rel="nofollow"
                >
                  {dict.resources.download}
                  {resource.files.length > 1 ? ` · ${f.format}` : ''}
                </a>
              ))}
            </div>
          )}

          <dl className="resource-page__meta">
            {resource.formats.length > 0 && (
              <div>
                <dt>{dict.resources.format}</dt>
                <dd>{resource.formats.join(', ')}</dd>
              </div>
            )}
            {resource.fileSize && (
              <div>
                <dt>{dict.resources.fileSize}</dt>
                <dd>{resource.fileSize}</dd>
              </div>
            )}
            {resource.licence && (
              <div>
                <dt>{dict.resources.licence}</dt>
                <dd>{resource.licence}</dd>
              </div>
            )}
          </dl>
        </div>
      </header>

      {resource.description && (
        <section className="resource-page__body">
          <h2 className="resource-page__section-title">{dict.resources.aboutThis}</h2>
          {resource.description
            .split(/\n{2,}/)
            .map((para) => para.trim())
            .filter(Boolean)
            .map((para, i) => (
              <p key={i}>{para}</p>
            ))}
        </section>
      )}

      {others.length > 0 && (
        <section className="resource-page__more">
          <h2 className="resource-page__section-title">{dict.resources.title}</h2>
          <div className="card-grid">
            {others.map((r) => (
              <ResourceCard
                key={r.id}
                title={r.title}
                date={r.date}
                category={r.category}
                color={r.color}
                glyph={r.glyph}
                formats={r.formats}
                href={r.href}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
