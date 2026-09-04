import type { MetadataRoute } from 'next'

import { LOCALES, DEFAULT_LOCALE, localePrefix, type Locale } from '@/lib/i18n'
import { getAllArticleSlugs, getAllResourceSlugs } from '@/lib/resources'
/* The SAME lists and the SAME slug helpers the two routes build themselves
   from — `generateStaticParams` on each page maps over exactly these. A
   sitemap that invented its own URLs would advertise pages that 404. */
import { CATEGORIES, TAG_OPTIONS, categorySlug, tagSlug } from '@/lib/tags'
import { siteURL } from '@/lib/siteURL'

/**
 * Every page a stranger should be able to arrive on.
 *
 * THIS IS A LAUNCH GATE, NOT HOUSEKEEPING. The Hub is search-led: most visits
 * start on a deep resource page from Google, which means the speed at which a
 * new article is discovered IS the product working. Without a sitemap a
 * crawler has to find its way inward by following links, and it learns nothing
 * about what changed.
 *
 * BOTH LOCALES, DECLARED AS ALTERNATES. Thai lives under `/th` and English is
 * served unprefixed. Listing them as `alternates.languages` on one entry is
 * what tells a crawler they are the same page in two languages rather than two
 * pages competing for the same words — the difference between ranking and
 * splitting your own traffic.
 *
 * DRAFTS ARE ABSENT because the slug helpers only return published rows, which
 * is also what the pages themselves serve.
 *
 * A FAILURE HERE IS A MISSING PAGE, NOT A BROKEN BUILD. The helpers wrap their
 * reads and fall back to an empty list, so a database that is briefly
 * unreachable during a build costs a stale sitemap rather than a failed deploy.
 */

/** `/x` for Thai, `` for English — and the origin in front of both. */
const url = (locale: Locale, path: string) => `${siteURL}${localePrefix(locale)}${path}`

/** One entry, with its own translations named beside it. */
const entry = (
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
  lastModified?: Date,
): MetadataRoute.Sitemap[number] => ({
  url: url(DEFAULT_LOCALE, path),
  changeFrequency,
  priority,
  ...(lastModified ? { lastModified } : {}),
  alternates: {
    languages: Object.fromEntries(LOCALES.map((locale) => [locale, url(locale, path)])),
  },
})

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articleSlugs, resourceSlugs] = await Promise.all([
    getAllArticleSlugs(),
    getAllResourceSlugs(),
  ])

  /* The homepage first, then the pages that exist to be browsed, then the
     library itself. Priority is a hint about relative importance within this
     site — an article matters more than the contact page. */
  return [
    entry('/', 'daily', 1),
    entry('/resources', 'daily', 0.9),
    entry('/newsletter', 'monthly', 0.5),
    entry('/about', 'monthly', 0.5),
    entry('/contact', 'monthly', 0.5),

    ...articleSlugs.map((slug) => entry(`/articles/${slug}`, 'monthly', 0.8)),
    ...resourceSlugs.map((slug) => entry(`/resources/${slug}`, 'monthly', 0.8)),

    /* Tag and category pages are the taxonomy's own landing pages — the ones a
       search for "grid systems" should be able to reach. */
    ...TAG_OPTIONS.map((tag) => entry(`/tag/${tagSlug(tag)}`, 'weekly', 0.6)),
    ...CATEGORIES.map((category) => entry(`/category/${categorySlug(category)}`, 'weekly', 0.6)),
  ]
}
