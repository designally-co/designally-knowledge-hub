import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticleCard } from '@/components/ds'
import { ListingHero } from '@/components/listing/ListingHero'
import { ListingControls, type ListingFilter } from '@/components/listing/ListingControls'
import { ListingPager } from '@/components/listing/ListingPager'
import { NewsletterCta } from '@/components/NewsletterCta'
import { getArticleListing } from '@/lib/resources'
import { TAG_OPTIONS, TAXONOMY, categoryForTag, categorySlug, tagFromSlug, tagSlug } from '@/lib/tags'
import { chromeForCategory, listingHref } from '@/lib/listingChrome'
import {
  getDictionary,
  isLocale,
  localeHref,
  tagLabel,
  LOCALES,
  type Locale,
} from '@/lib/i18n'

/**
 * Tag listing page — every published article carrying one tag. Shares the
 * listing chrome with the category pages; its filter pills are the sibling tags
 * of the same category, so you can pivot between related tags, and "All" returns
 * to the parent category.
 */
export const revalidate = 60
export const dynamicParams = true

type Params = { lang: string; slug: string }
type Search = { page?: string; q?: string }

export function generateStaticParams(): Params[] {
  return LOCALES.flatMap((lang) => TAG_OPTIONS.map((t) => ({ lang, slug: tagSlug(t) })))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const tag = tagFromSlug(slug)
  if (!tag) return { title: 'Tag not found' }
  return { title: `${tag} — Designally Knowledge Hub`, description: `Articles tagged ${tag}.` }
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<Search>
}) {
  const { lang, slug } = await params
  const sp = await searchParams
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)

  const tag = tagFromSlug(slug)
  if (!tag) notFound()
  const category = categoryForTag(tag)

  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1)
  const q = sp.q?.trim() || undefined

  const listing = await getArticleListing({ tag, q, page, locale })

  const basePath = localeHref(locale, `/tag/${slug}`)
  const chrome = chromeForCategory(category)

  // "All" → the parent category; each pill → a sibling tag's own page.
  const catBase = category ? localeHref(locale, `/category/${categorySlug(category)}`) : localeHref(locale, '/')
  const siblings = category ? TAXONOMY[category] : []
  const filters: ListingFilter[] = [
    { label: dict.listing.all, href: listingHref(catBase, { q }), active: false },
    ...siblings.map((t) => ({
      label: tagLabel(t, locale),
      href: listingHref(localeHref(locale, `/tag/${tagSlug(t)}`), { q }),
      active: t === tag,
    })),
  ]

  const showFeature = page === 1 && !q && listing.items.length > 0

  const from = (page - 1) * listing.perPage + 1
  const to = from + listing.items.length - 1
  const count = dict.listing.showing
    .replace('{from}', String(from))
    .replace('{to}', String(to))
    .replace('{total}', String(listing.total))
    .replace('{unit}', dict.listing.articles)

  const hrefForPage = (p: number) => listingHref(basePath, { q, page: p })

  return (
    <div className="listing-page">
      <ListingHero title={tagLabel(tag, locale)} icon={chrome.icon} tint={chrome.tint} />

      <div className="listing-body">
        <ListingControls
          filters={filters}
          searchAction={basePath}
          searchValue={q}
          placeholder={dict.listing.searchPlaceholder.replace('{section}', tagLabel(tag, locale))}
          searchLabel={dict.listing.searchLabel}
        />

        {listing.total > 0 ? (
          <>
            <div className={`listing-grid${showFeature ? ' listing-grid--lead' : ''}`}>
              {listing.items.map((it) => (
                <ArticleCard
                  key={it.href}
                  title={it.title}
                  date={it.date}
                  tags={it.tags}
                  image={it.image}
                  ratio={it.ratio}
                  titleSize="sm"
                  href={it.href}
                />
              ))}
            </div>
            <ListingPager
              page={listing.page}
              totalPages={listing.totalPages}
              hrefForPage={hrefForPage}
              labels={{ previous: dict.listing.previous, next: dict.listing.next, page: dict.listing.page }}
            />
            <p className="listing-count">{count}</p>
          </>
        ) : (
          <p className="listing-empty">
            {q ? dict.listing.noResults.replace('{q}', q) : dict.listing.emptyForTag}
          </p>
        )}
      </div>

      <NewsletterCta dict={dict} />
    </div>
  )
}
