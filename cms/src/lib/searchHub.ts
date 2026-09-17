'use server'

import {
  getArticleListing,
  getPopularTags,
  getRecentArticles,
  getResourceListing,
} from './resources'
import { CATEGORIES } from './tags'
import {
  articleHits,
  MIN_QUERY,
  newestFirst,
  resourceHits,
  type HubSearchResults,
  type SearchGroup,
  type SearchIdle,
} from './searchShared'
import type { Locale } from './i18n'

/**
 * Search's server actions: the overlay's live results and what it shows before
 * anything is typed.
 *
 * Server actions rather than route handlers: Payload owns `/api/[...slug]`, so
 * a sibling `/api/search` would be arguing with its catch-all for the same
 * path, and every value that crosses back is a plain object.
 */

/** Cards per tab in the overlay: one row of its four-up grid. The rest is /search's. */
const OVERLAY_HITS = 4

/**
 * Every tab's total and its first cards in one call, so switching tabs in the
 * overlay costs nothing. All merges articles and resources newest first.
 */
export async function searchHub(query: string, locale: Locale): Promise<HubSearchResults> {
  const q = query.trim()
  if (q.length < MIN_QUERY) return { query: q, total: 0, groups: [] }

  const [all, byCategory, resources] = await Promise.all([
    getArticleListing({ q, perPage: OVERLAY_HITS, locale }),
    Promise.all(
      CATEGORIES.map((category) => getArticleListing({ category, q, perPage: OVERLAY_HITS, locale })),
    ),
    getResourceListing({ q, perPage: OVERLAY_HITS, locale }),
  ])

  const total = all.total + resources.total
  const groups: SearchGroup[] = [
    {
      key: 'all',
      total,
      hits: [...articleHits(all.items), ...resourceHits(resources.items)]
        .sort(newestFirst)
        .slice(0, OVERLAY_HITS),
    },
    ...CATEGORIES.map((category, i) => ({
      key: category,
      total: byCategory[i].total,
      hits: articleHits(byCategory[i].items),
    })),
    { key: 'resources', total: resources.total, hits: resourceHits(resources.items) },
  ]
  return { query: q, total, groups }
}

/**
 * The overlay before a query: the newest articles as "Trending now" — the Hub
 * counts no views, so recency is the honest measure it has — and the most-used
 * tags as "Popular keywords".
 */
export async function getSearchIdle(locale: Locale): Promise<SearchIdle> {
  const [trending, keywords] = await Promise.all([
    getRecentArticles(4, locale),
    getPopularTags(6, locale),
  ])
  return { trending, keywords }
}
