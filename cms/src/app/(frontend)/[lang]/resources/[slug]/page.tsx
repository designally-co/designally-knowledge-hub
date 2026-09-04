import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { FileTypeIcon, Icon, ResourceCard, ResourceFigure, Tag } from '@/components/ds'
import { NewsletterCta } from '@/components/NewsletterCta'
import { ResourceJsonLd } from '@/components/JsonLd'
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
 * uploads. The hero is the folder artwork the grid card uses (ResourceFigure),
 * on the same lilac band the listing sits on, so arriving feels like that card
 * opening rather than landing on a different design.
 *
 * The page exists to hand over files, so the download panel is the subject: it
 * sits beside the artwork, above the prose, and names every file rather than
 * repeating one unlabelled button per attachment.
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
  // A resource has no dek — its description is the only prose it carries.
  const description = resource.description?.split(/\n{2,}/)[0]?.trim()
  /* NO SHARE IMAGE, and none is faked. A resource has no picture anywhere in
     the CMS — its artwork comes from its category, drawn as an SVG on the card,
     which is not something a crawler can render. The SEO panel used to offer an
     upload for this and it was filled on 0 of 6 resources; with it retired the
     card is a title and a line of description, which is what it has always
     actually been. An article's card still carries the article's cover. */
  return {
    title: resource.title,
    description,
    openGraph: {
      type: 'article',
      title: resource.title,
      description,
    },
    twitter: {
      card: 'summary',
      title: resource.title,
      description,
    },
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

  const files = resource.files
  // No format row: every file is listed by name below, extension and all, so
  // stating the format again only repeats what the reader can already see.
  // No size row: it was a hand-typed field nobody ever filled, so the page
  // promised a figure it never had. Every file is listed by name below anyway.
  const facts = [
    resource.licence && { label: dict.resources.licence, value: resource.licence },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <>
      <ResourceJsonLd
        category={resource.category}
        description={resource.description}
        formats={resource.formats}
        path={localeHref(locale, `/resources/${resource.slug}`)}
        title={resource.title}
      />
    <div className="resource-page">
      <div className="shell resource-layout">
        {/* The rail holds the artwork and the files. It is sticky, so the
            download stays reachable while the description is read — the whole
            reason someone opened this page should never scroll away. */}
        <aside className="resource-aside">
          <ResourceFigure
            className="resource-aside__art"
            title={resource.title}
            color={resource.color}
            glyph={resource.glyph}
          />

          {/* One card holds the whole transaction: what you get, the files
              themselves, and the terms. The facts used to sit outside it, which
              left the licence describing a download it wasn't attached to. */}
          {files.length > 0 ? (
            <div className="resource-dl">
              <div className="resource-dl__head">
                <h2 className="resource-dl__title">{dict.resources.download}</h2>
                {files.length > 1 && (
                  <span className="resource-dl__count">
                    {files.length} {dict.resources.downloads.toLowerCase()}
                  </span>
                )}
              </div>

              <ul className="resource-dl__list">
                {files.map((f) => (
                  <li key={f.url}>
                    {/* The row is the control, outlined rather than filled: it
                        has to read as pressable without stacking into a wall of
                        black beside the artwork. */}
                    <a
                      className="resource-dl__row"
                      href={f.url}
                      download={f.filename}
                      rel="nofollow"
                      aria-label={`${dict.resources.download}: ${f.filename}`}
                    >
                      <span className="resource-dl__ftype">
                        <FileTypeIcon filename={f.filename} />
                      </span>
                      <span className="resource-dl__name">{f.filename}</span>
                      <span className="resource-dl__disc" aria-hidden="true">
                        <Icon name="download" size={15} strokeWidth={1.9} />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              {facts.length > 0 && (
                <dl className="resource-dl__facts">
                  {facts.map((f) => (
                    <div key={f.label}>
                      <dt>{f.label}</dt>
                      <dd>{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ) : (
            /* Published with nothing attached. Saying so is better than a
               download page that silently shows no way to download. */
            <div className="resource-dl resource-dl--empty">
              <h2 className="resource-dl__title">{dict.resources.noFiles}</h2>
              <p className="resource-dl__note">{dict.resources.noFilesNote}</p>
            </div>
          )}

        </aside>

        <div className="resource-main">
          {resource.category && (
            <div className="resource-page__tags">
              <Tag>{resource.category}</Tag>
            </div>
          )}
          <h1 className="resource-page__title">{resource.title}</h1>
          {resource.date && <p className="resource-page__date">{resource.date}</p>}

          {resource.description && (
            <section className="resource-page__body">
              <h2 className="resource-page__label">{dict.resources.aboutThis}</h2>
              {resource.description
                .split(/\n{2,}/)
                .map((para) => para.trim())
                .filter(Boolean)
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </section>
          )}
        </div>
      </div>

      {others.length > 0 && (
        <section className="shell resource-page__more">
          <h2 className="resource-page__section-title">{dict.resources.moreLikeThis}</h2>
          <div className="listing-grid listing-grid--uniform">
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

      <NewsletterCta dict={dict} />
      </div>
    </>
  )
}
