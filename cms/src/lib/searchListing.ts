import { getArticleListing, getResourceListing, type Listing } from './resources'
import {
  articleHits,
  newestFirst,
  resourceHits,
  type SearchGroupKey,
  type SearchHit,
} from './searchShared'
import type { Locale } from './i18n'

/** Four rows of the four-up grid. */
export const SEARCH_PAGE_SIZE = 16

/**
 * One page of the /search results for a tab. A category or the resources is a
 * plain listing. All is both collections newest first, which Payload cannot
 * sort together: it takes the first page×size of each, merges them, and cuts
 * this page out — exact, and cheap at the Hub's size.
 */
export async function getSearchListing({
  q,
  type,
  page = 1,
  locale = 'en',
}: {
  q: string
  type: SearchGroupKey
  page?: number
  locale?: Locale
}): Promise<Listing<SearchHit>> {
  const perPage = SEARCH_PAGE_SIZE

  if (type === 'resources') {
    const res = await getResourceListing({ q, page, perPage, locale })
    return { ...res, items: resourceHits(res.items) }
  }

  if (type !== 'all') {
    const res = await getArticleListing({ category: type, q, page, perPage, locale })
    return { ...res, items: articleHits(res.items) }
  }

  const upTo = page * perPage
  const [articles, resources] = await Promise.all([
    getArticleListing({ q, perPage: upTo, locale }),
    getResourceListing({ q, perPage: upTo, locale }),
  ])
  const total = articles.total + resources.total
  const merged = [...articleHits(articles.items), ...resourceHits(resources.items)].sort(newestFirst)
  return {
    items: merged.slice((page - 1) * perPage, upTo),
    total,
    totalPages: Math.ceil(total / perPage),
    page,
    perPage,
  }
}
