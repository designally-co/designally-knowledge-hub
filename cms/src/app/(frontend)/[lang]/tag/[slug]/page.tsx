import { notFound, permanentRedirect } from 'next/navigation'

import { listingHref } from '@/lib/listingChrome'
import { categoryForTag, categorySlug, tagFromSlug, tagSlug } from '@/lib/tags'
import { isLocale, localeHref, type Locale } from '@/lib/i18n'

/**
 * A tag has no page of its own: it is a filter on its category's listing. The
 * old `/tag/…` URLs — shared links, bookmarks, what search engines hold — move
 * permanently to that listing with the tag's pill on, keeping any search and
 * page number, e.g. `/tag/branding-systems` → `/category/design?tag=branding-systems`
 * (the Case Studies page, filtered).
 */
export const dynamicParams = true

type Params = { lang: string; slug: string }
type Search = { page?: string; q?: string }

export default async function TagRedirect({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<Search>
}) {
  const { lang, slug } = await params
  const sp = await searchParams
  const locale: Locale = isLocale(lang) ? lang : 'en'

  const tag = tagFromSlug(slug)
  const category = tag ? categoryForTag(tag) : undefined
  if (!tag || !category) notFound()

  const page = Number.parseInt(sp.page ?? '1', 10) || 1
  permanentRedirect(
    listingHref(localeHref(locale, `/category/${categorySlug(category)}`), {
      tag: tagSlug(tag),
      q: sp.q?.trim() || undefined,
      page,
    }),
  )
}
