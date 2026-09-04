import { getPayload } from 'payload'
import type { Where } from 'payload'

import config from '@/payload.config'
import type { Article as ArticleDoc, Media, Resource } from '@/payload-types'
import { localeHref, type Locale } from './i18n'
import { readingMinutes } from './readingTime'
import { presetForCategory, type ResourceGlyph } from './resourceCategories'
import { TAXONOMY, type Category } from './tags'

/**
 * Data-access layer for the public site. Reads content straight from Payload's
 * LOCAL API (an in-process function call, no HTTP round trip), so Next server
 * components can render CMS content at build/request time and statically cache
 * the result — the SSG architecture the Hub is built on.
 */

export interface CarouselItem {
  id: string
  title: string
  date: string
  tags: string[]
  image?: string
  ratio: string
  href: string
}

/** Human date, e.g. "6 July 2026". Empty string when unset. */
function formatDate(value: string | null | undefined, locale: Locale): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/** Resolve a cover image URL: uploaded Media takes precedence over an external coverUrl. */
function coverOf(r: ArticleDoc): string | undefined {
  const img = r.coverImage
  if (img && typeof img === 'object') {
    const media = img as Media
    if (media.url) return media.url
  }
  return r.coverUrl ?? undefined
}

/**
 * The picture a share card uses: the cover, always.
 *
 * A COVER IS A SHARE IMAGE — it is already the article's own picture, sized for
 * a hero. There used to be an override in the SEO panel for the cases where the
 * two genuinely differ (a cover that is mostly texture, one whose subject sits
 * where a 1.91:1 card crops), and it read `seo.ogImage ?? cover`. Nobody ever
 * set it — 0 of 22 articles — so the `??` only ever resolved right, and the
 * field has been retired. See `seoField` in collections/shared.ts.
 */
function shareImageOf(r: ArticleDoc): string | undefined {
  return coverOf(r)
}

/**
 * Cover aspect ratio, e.g. "1200 / 800". Taken from the uploaded image's real
 * dimensions. Falls back to a portrait default when there's no upload to
 * measure (external URL or no cover — the ratio there is just a placeholder box).
 */
const DEFAULT_RATIO = '3 / 4'
function ratioOf(r: ArticleDoc): string {
  const img = r.coverImage
  if (img && typeof img === 'object') {
    const media = img as Media
    if (media.width && media.height) return `${media.width} / ${media.height}`
  }
  return DEFAULT_RATIO
}

/**
 * Map an article to the card shape used across listings.
 *
 * An article carries exactly one tag, but the card exposes `tags` as an array:
 * every listing component renders a row of tag pills, and a one-item array is
 * the shape they already take. Keeping the view model plural means the singular
 * field is a CMS concern rather than something every component has to know.
 */
function toCard(r: ArticleDoc, locale: Locale): CarouselItem {
  return {
    id: String(r.id),
    title: r.title,
    date: formatDate(r.publishedDate, locale),
    tags: r.tag ? [r.tag] : [],
    image: coverOf(r),
    ratio: ratioOf(r),
    href: localeHref(locale, `/articles/${r.slug}`),
  }
}

// Base filter: published only. Articles live in their own collection now, so
// there is no type discriminator to filter on.
const publishedOnly = [{ status: { equals: 'published' } }] as const

/**
 * Read helper: returns a fallback instead of throwing when the DB/table isn't
 * available — e.g. during a production build before the schema exists, or if the
 * DB is briefly unreachable. Keeps a deploy from hard-failing; pages fill in at
 * runtime via ISR once the data is there.
 */
async function safeRead<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run()
  } catch (err) {
    console.warn(
      `[resources] ${label} unavailable, using fallback: ${err instanceof Error ? err.message : String(err)}`,
    )
    return fallback
  }
}

/**
 * Most recent published articles, newest first — the hero carousel source.
 * (Downloadable files are excluded: the hero needs a cover + a detail page.)
 */
export async function getRecentArticles(
  limit = 10,
  locale: Locale = 'en',
): Promise<CarouselItem[]> {
  return safeRead(
    'getRecentArticles',
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'articles',
        where: { and: [...publishedOnly] },
        sort: '-publishedDate',
        limit,
        depth: 1, // populate the coverImage upload relation
        locale,
      })
      return docs.map((r) => toCard(r, locale))
    },
    [],
  )
}

/**
 * Unique tags of the most recently published articles, newest first, capped at
 * `count`. Feeds the Topics pill cloud so it reflects the freshest content.
 */
export async function getLatestTags(count = 12, locale: Locale = 'en'): Promise<string[]> {
  return safeRead(
    'getLatestTags',
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'articles',
        where: { and: [...publishedOnly] },
        sort: '-publishedDate',
        limit: 80,
        depth: 0,
        locale,
      })
      const seen: string[] = []
      for (const r of docs) {
        const tag = r.tag as string | null | undefined
        if (tag && !seen.includes(tag)) {
          seen.push(tag)
          if (seen.length >= count) return seen
        }
      }
      return seen
    },
    [],
  )
}

/** Published articles carrying a given tag, newest first. */
export async function getArticlesByTag(
  tag: string,
  limit = 60,
  locale: Locale = 'en',
): Promise<CarouselItem[]> {
  return safeRead(
    'getArticlesByTag',
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'articles',
        where: { and: [...publishedOnly, { tag: { equals: tag } }] },
        sort: '-publishedDate',
        limit,
        depth: 1,
        locale,
      })
      return docs.map((r) => toCard(r, locale))
    },
    [],
  )
}

/** Published articles in a category (any of its tags), newest first. */
export async function getArticlesByCategory(
  category: Category,
  limit = 4,
  locale: Locale = 'en',
): Promise<CarouselItem[]> {
  return safeRead(
    'getArticlesByCategory',
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'articles',
        where: { and: [...publishedOnly, { tag: { in: [...TAXONOMY[category]] } }] },
        sort: '-publishedDate',
        limit,
        depth: 1,
        locale,
      })
      return docs.map((r) => toCard(r, locale))
    },
    [],
  )
}

/**
 * A page of listing results: the items on this page plus the totals the pager
 * and the "showing X–Y of Z" count need. Shared by the category, tag and
 * resource listing pages.
 */
export interface Listing<T> {
  items: T[]
  total: number
  totalPages: number
  page: number
  perPage: number
}

export interface ArticleListingOptions {
  /** All published articles whose tag is in this category. Ignored when `tag` is set. */
  category?: Category
  /** A single exact tag — narrows within (or across) categories. */
  tag?: string
  /** Case-insensitive title search. */
  q?: string
  page?: number
  perPage?: number
  locale?: Locale
}

/**
 * A filtered, paginated slice of published articles, newest first — the engine
 * behind the category and tag listing pages. `tag` (exact) takes precedence over
 * `category` (any of its tags); `q` searches the title. Returns the page's items
 * plus totals for the pager.
 */
export async function getArticleListing({
  category,
  tag,
  q,
  page = 1,
  perPage = 15,
  locale = 'en',
}: ArticleListingOptions): Promise<Listing<CarouselItem>> {
  const empty: Listing<CarouselItem> = { items: [], total: 0, totalPages: 0, page, perPage }
  return safeRead(
    'getArticleListing',
    async () => {
      const payload = await getPayload({ config })
      const where: Where[] = [...publishedOnly]
      if (tag) where.push({ tag: { equals: tag } })
      else if (category) where.push({ tag: { in: [...TAXONOMY[category]] } })
      if (q?.trim()) where.push({ title: { like: q.trim() } })

      const res = await payload.find({
        collection: 'articles',
        where: { and: where },
        sort: '-publishedDate',
        page,
        limit: perPage,
        depth: 1,
        locale,
      })
      return {
        items: res.docs.map((r) => toCard(r, locale)),
        total: res.totalDocs,
        totalPages: res.totalPages,
        page: res.page ?? page,
        perPage,
      }
    },
    empty,
  )
}

/**
 * A downloadable resource as the grid and its page need it.
 *
 * Resources take no image uploads, so there is no cover here. The artwork comes
 * from the category preset — colour and glyph — which is why every resource in a
 * category looks alike and no editor has to find a picture for a font.
 */
export interface ResourceItem {
  id: string
  slug: string
  title: string
  date: string
  category: string
  color: string
  glyph: ResourceGlyph
  /** Distinct formats across the attached files, e.g. ["Figma", "PDF"]. */
  formats: string[]
  href: string
}

export interface ResourceDetail extends ResourceItem {
  /** The resource's only prose. Doubles as the meta description. */
  description?: string
  fileSize?: string
  licence?: string
  files: { url: string; filename: string; format: string }[]
}

function toResourceItem(r: Resource, locale: Locale): ResourceItem {
  const preset = presetForCategory(r.category)
  const formats: string[] = []
  for (const f of r.files ?? []) {
    if (f.format && !formats.includes(f.format)) formats.push(f.format)
  }
  return {
    id: String(r.id),
    slug: r.slug ?? '',
    title: r.title,
    date: formatDate(r.publishedDate, locale),
    category: r.category ?? '',
    color: preset.color,
    glyph: preset.glyph,
    formats,
    href: localeHref(locale, `/resources/${r.slug}`),
  }
}

/** Published downloadable resources, newest first — the /resources grid. */
export async function getDownloadableFiles(
  limit = 60,
  locale: Locale = 'en',
): Promise<ResourceItem[]> {
  return safeRead(
    'getDownloadableFiles',
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'resources',
        where: { and: [...publishedOnly] },
        sort: '-publishedDate',
        limit,
        depth: 1,
        locale,
      })
      return docs.map((r) => toResourceItem(r, locale))
    },
    [],
  )
}

export interface ResourceListingOptions {
  /** Exact resource category (Fonts, Templates, …). */
  category?: string
  /** Case-insensitive title search. */
  q?: string
  page?: number
  perPage?: number
  locale?: Locale
}

/**
 * A filtered, paginated slice of published resources, newest first — the engine
 * behind the /resources listing page. `category` filters by the resource's own
 * taxonomy; `q` searches the title. Returns the page's items plus totals.
 */
export async function getResourceListing({
  category,
  q,
  page = 1,
  perPage = 15,
  locale = 'en',
}: ResourceListingOptions): Promise<Listing<ResourceItem>> {
  const empty: Listing<ResourceItem> = { items: [], total: 0, totalPages: 0, page, perPage }
  return safeRead(
    'getResourceListing',
    async () => {
      const payload = await getPayload({ config })
      const where: Where[] = [...publishedOnly]
      if (category) where.push({ category: { equals: category } })
      if (q?.trim()) where.push({ title: { like: q.trim() } })

      const res = await payload.find({
        collection: 'resources',
        where: { and: where },
        sort: '-publishedDate',
        page,
        limit: perPage,
        depth: 1,
        locale,
      })
      return {
        items: res.docs.map((r) => toResourceItem(r, locale)),
        total: res.totalDocs,
        totalPages: res.totalPages,
        page: res.page ?? page,
        perPage,
      }
    },
    empty,
  )
}

/** A single published resource by slug, or null if not found / DB unavailable. */
export async function getResourceBySlug(
  slug: string,
  locale: Locale = 'en',
): Promise<ResourceDetail | null> {
  return safeRead(
    'getResourceBySlug',
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'resources',
        where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
        limit: 1,
        depth: 1, // populate the file upload relations
        locale,
      })
      const r = docs[0]
      if (!r) return null

      const files: ResourceDetail['files'] = []
      for (const entry of r.files ?? []) {
        const media = entry.file
        if (media && typeof media === 'object') {
          const m = media as Media
          if (m.url) {
            files.push({
              url: m.url,
              filename: m.filename ?? 'download',
              format: entry.format ?? 'Other',
            })
          }
        }
      }

      return {
        ...toResourceItem(r, locale),
        description: r.description ?? undefined,
        fileSize: r.fileSize ?? undefined,
        licence: r.licence ?? undefined,
        files,
      }
    },
    null,
  )
}

/** Every published resource slug — for generateStaticParams (SSG). */
export async function getAllResourceSlugs(): Promise<string[]> {
  return safeRead(
    'getAllResourceSlugs',
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'resources',
        where: { and: [{ status: { equals: 'published' } }] },
        limit: 1000,
        depth: 0,
        pagination: false,
        select: { slug: true },
      })
      return docs.map((r) => r.slug).filter((x): x is string => Boolean(x))
    },
    [],
  )
}

export interface Article {
  slug: string
  title: string
  dek?: string
  date: string
  tags: string[]
  image?: string
  ratio: string
  readTime?: number
  body: ArticleDoc['body']
  references: { label: string; url: string }[]
  /** For the social share card. Falls back to `image`. */
  shareImage?: string
  /* THE MACHINE-READABLE DATE, beside the human one. `date` is "6 July 2026" —
     written for a reader and localised, which is exactly what a crawler cannot
     parse. Structured data needs ISO 8601, so the raw value is carried through
     rather than reconstructed from prose. */
  publishedISO?: string
}

/** A single published article by slug, or null if not found / DB unavailable. */
export async function getArticleBySlug(
  slug: string,
  locale: Locale = 'en',
): Promise<Article | null> {
  return safeRead(
    'getArticleBySlug',
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'articles',
        where: {
          and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }],
        },
        limit: 1,
        depth: 1,
        locale,
      })

      const r = docs[0]
      if (!r) return null

      return {
        slug: r.slug ?? slug,
        title: r.title,
        dek: r.summary ?? undefined,
        date: formatDate(r.publishedDate, locale),
        publishedISO: r.publishedDate ? new Date(r.publishedDate).toISOString() : undefined,
        tags: r.tag ? [r.tag] : [],
        image: coverOf(r),
        shareImage: shareImageOf(r),
        ratio: ratioOf(r),
        readTime: readingMinutes(r.body),
        body: r.body ?? null,
        references: (r.references ?? []).map((ref) => ({ label: ref.label, url: ref.url })),
      }
    },
    null,
  )
}

/** Every published article slug — for generateStaticParams (SSG). */
export async function getAllArticleSlugs(): Promise<string[]> {
  return safeRead(
    'getAllArticleSlugs',
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'articles',
        where: { and: [{ status: { equals: 'published' } }] },
        limit: 1000,
        depth: 0,
        pagination: false,
        select: { slug: true },
      })
      return docs.map((r) => r.slug).filter((s): s is string => Boolean(s))
    },
    [],
  )
}
