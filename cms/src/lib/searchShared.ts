import type { CarouselItem, ResourceItem } from './resources'
import { categoryFromSlug, categorySlug, type Category } from './tags'
import { categoryLabel, localeHref, type Dictionary, type Locale } from './i18n'

/**
 * What the search overlay (client) and the /search page (server) share: the
 * shapes, the tab labels and the links. Safe in the browser — the article and
 * resource types come from resources.ts as types only.
 */

/** A result tab: every match, one article category, or the resources. */
export type SearchGroupKey = 'all' | Category | 'resources'

export type SearchHit =
  | { kind: 'article'; item: CarouselItem }
  | { kind: 'resource'; item: ResourceItem }

export interface SearchGroup {
  key: SearchGroupKey
  total: number
  hits: SearchHit[]
}

export interface HubSearchResults {
  query: string
  total: number
  /** All first, then each article category, then resources. */
  groups: SearchGroup[]
}

/** What the overlay shows before anything is typed. */
export interface SearchIdle {
  trending: CarouselItem[]
  keywords: string[]
}

/** Shorter queries match too much to be worth a request. */
export const MIN_QUERY = 2

export const articleHits = (items: CarouselItem[]): SearchHit[] =>
  items.map((item) => ({ kind: 'article', item }))

export const resourceHits = (items: ResourceItem[]): SearchHit[] =>
  items.map((item) => ({ kind: 'resource', item }))

/** Newest first across both collections. ISO dates compare as strings; undated last. */
export function newestFirst(a: SearchHit, b: SearchHit): number {
  return b.item.publishedAt.localeCompare(a.item.publishedAt)
}

export function groupLabel(key: SearchGroupKey, locale: Locale, dict: Dictionary): string {
  if (key === 'all') return dict.search.all
  if (key === 'resources') return dict.search.resources
  return categoryLabel(key, locale)
}

export function countLabel(total: number, dict: Dictionary): string {
  return total === 1 ? dict.search.result : dict.search.results.replace('{count}', String(total))
}

/** `type` in the /search URL: all, resources, or a category's slug. */
export function searchTypeSlug(key: SearchGroupKey): string {
  return key === 'all' || key === 'resources' ? key : categorySlug(key)
}

export function searchTypeFromSlug(slug: string | undefined): SearchGroupKey {
  if (slug === 'resources') return 'resources'
  return (slug && categoryFromSlug(slug)) || 'all'
}

/** The /search page for a query, a tab and a page. `type` and `page` drop out at their defaults. */
export function searchHref(locale: Locale, q: string, key: SearchGroupKey = 'all', page = 1): string {
  const params = new URLSearchParams({ q })
  if (key !== 'all') params.set('type', searchTypeSlug(key))
  if (page > 1) params.set('page', String(page))
  return `${localeHref(locale, '/search')}?${params.toString()}`
}
