import type { Category } from './tags'

/*
 * Chrome for the listing pages: the hero band colour and the section icon each
 * surface wears. The band colour is the background colour of that surface's SVG
 * graphic, so the hero reads as a full-bleed extension of the icon's own tile.
 * Icons reuse the homepage section marks in /public/section-icons.
 */
export interface ListingChrome {
  /** CSS colour for the hero band (matches the section graphic's background). */
  tint: string
  /** Public path to the section icon, or null when the surface has none. */
  icon: string | null
}

// Chrome follows the public LABEL: Design = "Case Studies", Insights, Design with
// AI = "Workflows". Tints are the SVG graphics' background colours.
export const CATEGORY_CHROME: Record<Category, ListingChrome> = {
  Design: { tint: '#F1AB88', icon: '/section-icons/case.svg' },
  Insights: { tint: '#B0BCE5', icon: '/section-icons/insights.svg' },
  'Design with AI': { tint: '#80D2A8', icon: '/section-icons/workflows.svg' },
}

export const RESOURCES_CHROME: ListingChrome = {
  tint: '#D2AEE3',
  icon: '/section-icons/resources.svg',
}

/** Chrome for a tag page — inherits its parent category's tint, drops the icon. */
export function chromeForCategory(category: Category | undefined): ListingChrome {
  return (category && CATEGORY_CHROME[category]) || { tint: '#B0BCE5', icon: null }
}

/**
 * Build a listing URL preserving filter state. `page` is omitted when 1 so the
 * canonical (first) page has a clean URL; empty tag/q are dropped.
 */
export function listingHref(
  basePath: string,
  params: { tag?: string; q?: string; page?: number } = {},
): string {
  const sp = new URLSearchParams()
  if (params.tag) sp.set('tag', params.tag)
  if (params.q) sp.set('q', params.q)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  const qs = sp.toString()
  return qs ? `${basePath}?${qs}` : basePath
}
