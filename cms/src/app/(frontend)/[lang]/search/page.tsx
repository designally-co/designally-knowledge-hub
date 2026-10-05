import type { Metadata } from 'next'

import { Tabs } from '@/components/ds'
import { ListingEmpty } from '@/components/listing/ListingEmpty'
import { ListingHero } from '@/components/listing/ListingHero'
import { ListingPager } from '@/components/listing/ListingPager'
import { NewsletterCta } from '@/components/NewsletterCta'
import { SearchHitGrid } from '@/components/search/SearchHitGrid'
import { getPopularTags } from '@/lib/resources'
import { searchHub } from '@/lib/searchHub'
import { getSearchListing } from '@/lib/searchListing'
import {
  countLabel,
  groupLabel,
  MIN_QUERY,
  searchHref,
  searchTypeFromSlug,
} from '@/lib/searchShared'
import { getDictionary, isLocale, tagLabel, type Locale } from '@/lib/i18n'

type Params = { lang: string }
type Search = { q?: string; type?: string; page?: string }

/* A band of its own: search belongs to no one section, so it wears none of
   their four tints. The brand brown at 30% reads as a warm sand over the page,
   mid-toned enough for the white wave pattern to show. */
const SEARCH_TINT = 'var(--color-brand-mid-30)'

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params
  const dict = getDictionary(isLocale(lang) ? lang : 'en')
  // A results page is not a destination for a crawler; the pages it lists are.
  return { title: `${dict.search.title} — Designally Knowledge Hub`, robots: { index: false, follow: true } }
}

/**
 * Every result for a query, where the header overlay's "View all results" and
 * Enter lead: the same tabs, all the cards, and the pager.
 */
export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<Search>
}) {
  const { lang } = await params
  const sp = await searchParams
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)

  const q = sp.q?.trim() ?? ''
  const type = searchTypeFromSlug(sp.type)
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1)
  const searching = q.length >= MIN_QUERY

  const [overview, listing] = searching
    ? await Promise.all([searchHub(q, locale), getSearchListing({ q, type, page, locale })])
    : [null, null]
  const tabs = overview ? overview.groups.filter((g) => g.key === 'all' || g.total > 0) : []
  const empty = overview?.total === 0
  // Nothing matched: offer the most-used tags as fresh searches, as the
  // header overlay does before anything is typed.
  const keywords = empty
    ? (await getPopularTags(6, locale)).map((tag) => {
        const label = tagLabel(tag, locale)
        return { label, href: searchHref(locale, label) }
      })
    : []

  const showing = listing
    ? dict.listing.showing
        .replace('{from}', String((listing.page - 1) * listing.perPage + 1))
        .replace('{to}', String((listing.page - 1) * listing.perPage + listing.items.length))
        .replace('{total}', String(listing.total))
        .replace('{unit}', dict.search.items)
    : ''

  return (
    <div className="listing-page search-page">
      {/* With a query: "Search results for" small, the query itself as the page
          title — "No results for" when nothing matched, so the band says it
          once and the body below only says what to try. Without a query: the
          plain "Search" title and the prompt. */}
      {searching ? (
        <ListingHero
          kicker={empty ? dict.search.noResultsHeading : dict.search.resultsHeading}
          title={`“${q}”`}
          tint={SEARCH_TINT}
        />
      ) : (
        <ListingHero title={dict.search.title} description={dict.search.prompt} tint={SEARCH_TINT} />
      )}

      <div className="listing-body">
        {overview && listing && (
          empty ? (
            <ListingEmpty
              hint={dict.search.emptyHint}
              keywords={keywords}
              keywordsLabel={dict.search.popular}
            />
          ) : (
            <>
              {/* The catalog pages' control row: the result tabs where their
                  filters sit, and the count at the end of the line. There is no
                  field here — the query was typed to get here, and the header
                  search is one click away for another. */}
              <div className="listing-controls search-page__controls">
                <Tabs
                  className="listing-filters"
                  label={dict.search.label}
                  items={tabs.map((g) => ({
                    key: g.key,
                    label: `${groupLabel(g.key, locale, dict)} (${g.total})`,
                    active: g.key === type,
                    href: searchHref(locale, q, g.key),
                  }))}
                />
                <p className="search-page__count" aria-live="polite">
                  {countLabel(listing.total, dict)}
                </p>
              </div>

              <h2 className="visually-hidden">{dict.listing.resultsHeading}</h2>
              <SearchHitGrid hits={listing.items} />

              <ListingPager
                page={listing.page}
                totalPages={listing.totalPages}
                hrefForPage={(p) => searchHref(locale, q, type, p)}
                labels={{
                  first: dict.listing.first,
                  previous: dict.listing.previous,
                  next: dict.listing.next,
                  last: dict.listing.last,
                  page: dict.listing.page,
                }}
                size="compact"
              />
              <p className="listing-count search-page__showing">{showing}</p>
            </>
          )
        )}
      </div>

      <NewsletterCta dict={dict} />
    </div>
  )
}
