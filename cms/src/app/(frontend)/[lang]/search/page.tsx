import type { Metadata } from 'next'
import Link from 'next/link'

import { Icon } from '@/components/ds'
import { ListingHero } from '@/components/listing/ListingHero'
import { ListingPager } from '@/components/listing/ListingPager'
import { NewsletterCta } from '@/components/NewsletterCta'
import { SearchHitGrid } from '@/components/search/SearchHitGrid'
import { searchHub } from '@/lib/searchHub'
import { getSearchListing } from '@/lib/searchListing'
import {
  countLabel,
  groupLabel,
  MIN_QUERY,
  searchHref,
  searchTypeFromSlug,
  searchTypeSlug,
} from '@/lib/searchShared'
import { getDictionary, isLocale, localeHref, type Locale } from '@/lib/i18n'

type Params = { lang: string }
type Search = { q?: string; type?: string; page?: string }

/* The hero band in the page's own tan (--be-paper-deep): search belongs to no
   one section, so it wears none of their colours. */
const SEARCH_TINT = '#ddc5a8'

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

  const showing = listing
    ? dict.listing.showing
        .replace('{from}', String((listing.page - 1) * listing.perPage + 1))
        .replace('{to}', String((listing.page - 1) * listing.perPage + listing.items.length))
        .replace('{total}', String(listing.total))
        .replace('{unit}', dict.search.items)
    : ''

  return (
    <div className="listing-page search-page">
      <ListingHero
        title={dict.search.title}
        description={searching ? dict.search.resultsFor.replace('{q}', q) : dict.search.prompt}
        tint={SEARCH_TINT}
        inline
      />

      <div className="listing-body">
        <form className="search-field search-page__field" role="search" action={localeHref(locale, '/search')}>
          <input
            type="text"
            name="q"
            defaultValue={q}
            className="search-field__input"
            placeholder={dict.search.placeholder}
            aria-label={dict.search.label}
            autoComplete="off"
            enterKeyHint="search"
          />
          {type !== 'all' && <input type="hidden" name="type" value={searchTypeSlug(type)} />}
          <button type="submit" className="search-field__submit" aria-label={dict.search.submit}>
            <Icon name="search" size={16} strokeWidth={2.4} />
          </button>
        </form>

        {overview && listing && (
          overview.total === 0 ? (
            <p className="search-note">{dict.search.empty.replace('{q}', q)}</p>
          ) : (
            <>
              <nav className="search-tabs" aria-label={dict.search.label}>
                {tabs.map((g) => (
                  <Link
                    key={g.key}
                    className={`search-tab${g.key === type ? ' search-tab--active' : ''}`}
                    href={searchHref(locale, q, g.key)}
                    aria-current={g.key === type ? 'page' : undefined}
                  >
                    {groupLabel(g.key, locale, dict)} ({g.total})
                  </Link>
                ))}
              </nav>

              <p className="search-summary__count search-page__count">{countLabel(listing.total, dict)}</p>

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
