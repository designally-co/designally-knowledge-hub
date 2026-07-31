import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticleCard } from '@/components/ds'
import { getArticlesByTag } from '@/lib/resources'
import { TAG_OPTIONS, categoryForTag, tagFromSlug, tagSlug } from '@/lib/tags'
import {
  categoryLabel,
  getDictionary,
  isLocale,
  localeHref,
  tagLabel,
  LOCALES,
  type Locale,
} from '@/lib/i18n'

/**
 * Tag listing page — every published article carrying one tag.
 * SSG: one page per (locale, tag) in the fixed taxonomy; ISR keeps them fresh.
 */
export const revalidate = 60
export const dynamicParams = true

type Params = { lang: string; slug: string }

export function generateStaticParams(): Params[] {
  return LOCALES.flatMap((lang) => TAG_OPTIONS.map((t) => ({ lang, slug: tagSlug(t) })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const tag = tagFromSlug(slug)
  if (!tag) return { title: 'Tag not found' }
  return { title: `${tag} — Designally Knowledge Hub`, description: `Articles tagged ${tag}.` }
}

export default async function TagPage({ params }: { params: Promise<Params> }) {
  const { lang, slug } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)

  const tag = tagFromSlug(slug)
  if (!tag) notFound()

  const items = await getArticlesByTag(tag, 60, locale)
  const category = categoryForTag(tag)

  return (
    <div className="shell listing">
      <a className="listing__back" href={localeHref(locale, '/')}>
        ← {dict.listing.home}
      </a>

      {category && <p className="listing__eyebrow">{categoryLabel(category, locale)}</p>}
      <h1 className="listing__title">{tagLabel(tag, locale)}</h1>
      <p className="listing__count">
        {items.length} {dict.listing.articles}
      </p>

      {items.length > 0 ? (
        <div className="card-grid">
          {items.map((it) => (
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
      ) : (
        <p className="listing__empty">{dict.listing.emptyForTag}</p>
      )}
    </div>
  )
}
