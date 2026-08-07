'use server'

import { getArticleListing, getResourceListing, type CarouselItem, type ResourceItem } from './resources'
import type { Locale } from './i18n'

export interface HubSearchResults {
  articles: CarouselItem[]
  resources: ResourceItem[]
  total: number
}

/**
 * Search both collections for the header's expanding field.
 *
 * A server action rather than a route handler: Payload owns `/api/[...slug]`,
 * so a sibling `/api/search` would be arguing with its catch-all for the same
 * path. This needs no URL of its own — the results live in the header, not on
 * a page — and both item types are plain objects, so they cross the boundary
 * as-is.
 *
 * Deliberately few results. This is a way into something, not a results page;
 * a list long enough to scroll would want a page, which is what the header
 * panel exists to avoid.
 */
export async function searchHub(query: string, locale: Locale): Promise<HubSearchResults> {
  const q = query.trim()
  if (q.length < 2) return { articles: [], resources: [], total: 0 }

  const [articles, resources] = await Promise.all([
    getArticleListing({ q, perPage: 5, locale }),
    getResourceListing({ q, perPage: 3, locale }),
  ])

  return {
    articles: articles.items,
    resources: resources.items,
    total: articles.total + resources.total,
  }
}
