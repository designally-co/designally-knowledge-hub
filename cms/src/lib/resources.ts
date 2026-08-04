import { getPayload } from 'payload'

import config from '@/payload.config'
import type { Media, Resource } from '@/payload-types'
import { localeHref, type Locale } from './i18n'
import { readingMinutes } from './readingTime'
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
function coverOf(r: Resource): string | undefined {
  const img = r.coverImage
  if (img && typeof img === 'object') {
    const media = img as Media
    if (media.url) return media.url
  }
  return r.coverUrl ?? undefined
}

/**
 * Cover aspect ratio, e.g. "1200 / 800". Taken from the uploaded image's real
 * dimensions. Falls back to a portrait default when there's no upload to
 * measure (external URL or no cover — the ratio there is just a placeholder box).
 */
const DEFAULT_RATIO = '3 / 4'
function ratioOf(r: Resource): string {
  const img = r.coverImage
  if (img && typeof img === 'object') {
    const media = img as Media
    if (media.width && media.height) return `${media.width} / ${media.height}`
  }
  return DEFAULT_RATIO
}

/** The public path for a resource. Only articles have detail pages. */
function hrefOf(r: Resource, locale: Locale): string {
  return localeHref(locale, r.type === 'article' ? `/articles/${r.slug}` : '/resources')
}

/** Map a Resource to the card shape used across listings. */
function toCard(r: Resource, locale: Locale): CarouselItem {
  return {
    id: String(r.id),
    title: r.title,
    date: formatDate(r.publishedDate, locale),
    tags: r.tags ?? [],
    image: coverOf(r),
    ratio: ratioOf(r),
    href: hrefOf(r, locale),
  }
}

// Base filter: published articles only.
const publishedArticle = [
  { status: { equals: 'published' } },
  { type: { equals: 'article' } },
] as const

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
        collection: 'resources',
        where: { and: [...publishedArticle] },
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
        collection: 'resources',
        where: { and: [...publishedArticle] },
        sort: '-publishedDate',
        limit: 80,
        depth: 0,
        locale,
      })
      const seen: string[] = []
      for (const r of docs) {
        for (const tag of (r.tags ?? []) as string[]) {
          if (tag && !seen.includes(tag)) {
            seen.push(tag)
            if (seen.length >= count) return seen
          }
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
        collection: 'resources',
        where: { and: [...publishedArticle, { tags: { in: [tag] } }] },
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
        collection: 'resources',
        where: { and: [...publishedArticle, { tags: { in: [...TAXONOMY[category]] } }] },
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
 * Published downloadable files (type `template`) — the /resources listing.
 * Files have no detail page yet, so cards carry the title/tags only.
 */
export async function getDownloadableFiles(
  limit = 60,
  locale: Locale = 'en',
): Promise<CarouselItem[]> {
  return safeRead(
    'getDownloadableFiles',
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'resources',
        where: {
          and: [{ status: { equals: 'published' } }, { type: { equals: 'template' } }],
        },
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

export interface Article {
  slug: string
  title: string
  dek?: string
  date: string
  tags: string[]
  image?: string
  ratio: string
  readTime?: number
  body: Resource['body']
  references: { label: string; url: string }[]
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
        collection: 'resources',
        where: {
          and: [
            { slug: { equals: slug } },
            { type: { equals: 'article' } },
            { status: { equals: 'published' } },
          ],
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
        tags: r.tags ?? [],
        image: coverOf(r),
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
        collection: 'resources',
        where: {
          and: [{ type: { equals: 'article' } }, { status: { equals: 'published' } }],
        },
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
