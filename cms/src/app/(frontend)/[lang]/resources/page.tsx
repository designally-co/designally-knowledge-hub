import type { Metadata } from 'next'

import { ResourceCard } from '@/components/ds'
import { ListingHero } from '@/components/listing/ListingHero'
import { ListingControls, type ListingFilter } from '@/components/listing/ListingControls'
import { ListingPager } from '@/components/listing/ListingPager'
import { NewsletterCta } from '@/components/NewsletterCta'
import { getResourceListing } from '@/lib/resources'
import { RESOURCES_CHROME } from '@/lib/listingChrome'
import { RESOURCE_CATEGORIES, resourceCategorySlug } from '@/lib/resourceCategories'
import { getDictionary, isLocale, localeHref, type Locale } from '@/lib/i18n'

/**
 * Resources — the downloadable files (templates, fonts, ebooks, wallpapers,
 * icons). Shares the listing chrome with the article category pages, but filters
 * by the resource's own taxonomy and lays cards out in a uniform grid (resources
 * are square folder tiles with no cover, so there's no masonry or featured lead).
 */
export const revalidate = 60

type Search = { page?: string; cat?: string; q?: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  return { title: `${getDictionary(locale).resources.title} — Designally Knowledge Hub` }
}

export default async function ResourcesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<Search>
}) {
  const { lang } = await params
  const sp = await searchParams
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)

  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1)
  const activeCat = sp.cat
    ? RESOURCE_CATEGORIES.find((c) => resourceCategorySlug(c) === sp.cat)
    : undefined
  const q = sp.q?.trim() || undefined

  const listing = await getResourceListing({ category: activeCat, q, page, locale })

  const basePath = localeHref(locale, '/resources')
  const buildHref = (next: { cat?: string; q?: string; page?: number }) => {
    const usp = new URLSearchParams()
    if (next.cat) usp.set('cat', next.cat)
    if (next.q) usp.set('q', next.q)
    if (next.page && next.page > 1) usp.set('page', String(next.page))
    const qs = usp.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const filters: ListingFilter[] = [
    { label: dict.listing.all, href: buildHref({ q }), active: !activeCat },
    ...RESOURCE_CATEGORIES.map((c) => ({
      label: c,
      href: buildHref({ cat: resourceCategorySlug(c), q }),
      active: activeCat === c,
    })),
  ]

  const from = (page - 1) * listing.perPage + 1
  const to = from + listing.items.length - 1
  const count = dict.listing.showing
    .replace('{from}', String(from))
    .replace('{to}', String(to))
    .replace('{total}', String(listing.total))
    .replace('{unit}', dict.listing.resourceUnit)

  const hrefForPage = (p: number) =>
    buildHref({ cat: activeCat ? resourceCategorySlug(activeCat) : undefined, q, page: p })

  const description = dict.listing.resourcesIntro || dict.resources.lede

  return (
    <div className="listing-page">
      <ListingHero
        title={dict.resources.title}
        description={description}
        icon={RESOURCES_CHROME.icon}
        tint={RESOURCES_CHROME.tint}
      />

      <div className="listing-body">
        <ListingControls
          filters={filters}
          searchAction={basePath}
          searchValue={q}
          hiddenFields={activeCat ? [{ name: 'cat', value: resourceCategorySlug(activeCat) }] : []}
          placeholder={dict.listing.searchPlaceholder.replace('{section}', dict.resources.title)}
          searchLabel={dict.listing.searchLabel}
        />

        {listing.total > 0 ? (
          <>
            <div className="listing-grid listing-grid--uniform">
              {listing.items.map((it) => (
                <ResourceCard
                  key={it.id}
                  title={it.title}
                  date={it.date}
                  category={it.category}
                  color={it.color}
                  glyph={it.glyph}
                  formats={it.formats}
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
            {q ? dict.listing.noResults.replace('{q}', q) : dict.resources.lede}
          </p>
        )}
      </div>

      <NewsletterCta dict={dict} />
    </div>
  )
}
