import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { ArticleCard } from '@/components/ds'
import { ListingHero } from '@/components/listing/ListingHero'
import { ListingControls, type ListingFilter } from '@/components/listing/ListingControls'
import { ListingPager } from '@/components/listing/ListingPager'
import { NewsletterCta } from '@/components/NewsletterCta'
import { getArticleListing } from '@/lib/resources'
import {
  CATEGORIES,
  RETIRED_CATEGORY_SLUGS,
  TAXONOMY,
  categoryFromSlug,
  categorySlug,
  tagFromSlug,
  tagSlug,
} from '@/lib/tags'
import { CATEGORY_CHROME, listingHref } from '@/lib/listingChrome'
import {
  categoryLabel,
  getDictionary,
  isLocale,
  localeHref,
  LOCALES,
  tagLabel,
  type Locale,
} from '@/lib/i18n'

export const revalidate = 60
export const dynamicParams = true

type Params = { lang: string; slug: string }
type Search = { page?: string; tag?: string; q?: string }

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
  return { title: `${categoryLabel(category, locale)} — Designally Knowledge Hub` }
}

export default async function CategoryPage({
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
  const retarget = RETIRED_CATEGORY_SLUGS[slug]
  if (retarget) redirect(localeHref(locale, `/category/${retarget}`))

  const category = categoryFromSlug(slug)
  if (!category) notFound()

  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1)
  const activeTag = sp.tag ? tagFromSlug(sp.tag) : undefined
  const q = sp.q?.trim() || undefined

  const listing = await getArticleListing({ category, tag: activeTag, q, page, locale })

  const basePath = localeHref(locale, `/category/${slug}`)
  const chrome = CATEGORY_CHROME[category]

  const filters: ListingFilter[] = [
    { label: dict.listing.all, href: listingHref(basePath, { q }), active: !activeTag },
    ...TAXONOMY[category].map((t) => ({
      label: tagLabel(t, locale),
      href: listingHref(basePath, { tag: tagSlug(t), q }),
      active: activeTag === t,
    })),
  ]

  // The flagship (newest) article gets a featured lead — but only on the first,
  // unfiltered page, where it's genuinely the top of the category.
  // The newest article leads as a 2x2 featured tile, but only on the first,
  // unfiltered page where it's genuinely the top of the category.
  const showFeature = page === 1 && !activeTag && !q && listing.items.length > 0

  const from = (page - 1) * listing.perPage + 1
  const to = from + listing.items.length - 1
  const count = dict.listing.showing
    .replace('{from}', String(from))
    .replace('{to}', String(to))
    .replace('{total}', String(listing.total))
    .replace('{unit}', dict.listing.articles)

  const hrefForPage = (p: number) =>
    listingHref(basePath, { tag: activeTag ? tagSlug(activeTag) : undefined, q, page: p })

  const description = dict.listing.categoryIntro[category] || undefined

  return (
    <div className="listing-page">
      <ListingHero
        title={categoryLabel(category, locale)}
        description={description}
        icon={chrome.icon}
        tint={chrome.tint}
      />

      <div className="listing-body">
        <ListingControls
          filters={filters}
          searchAction={basePath}
          searchValue={q}
          hiddenFields={activeTag ? [{ name: 'tag', value: tagSlug(activeTag) }] : []}
          placeholder={dict.listing.searchPlaceholder.replace('{section}', categoryLabel(category, locale))}
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
