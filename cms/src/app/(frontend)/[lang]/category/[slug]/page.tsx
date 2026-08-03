import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticleCard } from '@/components/ds'
import { getArticlesByCategory } from '@/lib/resources'
import { CATEGORIES, categoryFromSlug, categorySlug } from '@/lib/tags'
import {
  categoryLabel,
  getDictionary,
  isLocale,
  localeHref,
  LOCALES,
  type Locale,
} from '@/lib/i18n'

export const revalidate = 60
export const dynamicParams = true

type Params = { lang: string; slug: string }

export function generateStaticParams(): Params[] {
  return LOCALES.flatMap((lang) =>
    CATEGORIES.map((category) => ({ lang, slug: categorySlug(category) })),
  )
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, slug } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const category = categoryFromSlug(slug)
  if (!category) return { title: 'Category not found' }
  const label = categoryLabel(category, locale)
  return { title: `${label} — Designally Knowledge Hub` }
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { lang, slug } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)
  const category = categoryFromSlug(slug)
  if (!category) notFound()

  const items = await getArticlesByCategory(category, 60, locale)

  return (
    <div className="shell listing">
      <a className="listing__back" href={localeHref(locale, '/')}>
        ← {dict.listing.home}
      </a>
      <h1 className="listing__title">{categoryLabel(category, locale)}</h1>
      <p className="listing__count">
        {items.length} {dict.listing.articles}
      </p>

      {items.length > 0 ? (
        <div className="card-grid">
          {items.map((item) => (
            <ArticleCard
              key={item.href}
              title={item.title}
              date={item.date}
              tags={item.tags}
              image={item.image}
              ratio="4 / 3"
              href={item.href}
            />
          ))}
        </div>
      ) : (
        <p className="listing__empty">{dict.listing.emptyForTag}</p>
      )}
    </div>
  )
}
