import { getPayload } from 'payload'

import config from '@/payload.config'
import type { Media, Resource } from '@/payload-types'
import { readingMinutes } from './readingTime'
import { TAXONOMY, type Category } from './tags'

/**
 * Data-access layer for the public site. Reads content straight from Payload's
 * LOCAL API (an in-process function call, no HTTP round trip), so Next server
 * components can render CMS content at build/request time and statically cache
 * the result — the SSG architecture the Hub is built on.
 */

export interface CarouselItem {
  title: string
  date: string
  tags: string[]
  image?: string
  ratio: string
  href: string
}

/** Human date, e.g. "6 July 2026". Empty string when unset. */
function formatDate(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
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
function hrefOf(r: Resource): string {
  return r.type === 'article' ? `/articles/${r.slug}` : '/resources'
}

/** Map a Resource to the card shape used across listings. */
function toCard(r: Resource): CarouselItem {
  return {
    title: r.title,
    date: formatDate(r.publishedDate),
    tags: r.tags ?? [],
    image: coverOf(r),
    ratio: ratioOf(r),
    href: hrefOf(r),
  }
}

// Base filter: published articles only.
const publishedArticle = [
  { status: { equals: 'published' } },
  { type: { equals: 'article' } },
] as const

/**
 * Most recent published articles, newest first — the hero carousel source.
 * (Downloadable files are excluded: the hero needs a cover + a detail page.)
 */
export async function getRecentArticles(limit = 10): Promise<CarouselItem[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'resources',
    where: { and: [...publishedArticle] },
    sort: '-publishedDate',
    limit,
    depth: 1, // populate the coverImage upload relation
  })
  return docs.map(toCard)
}

/** Published articles carrying a given tag, newest first. */
export async function getArticlesByTag(tag: string, limit = 60): Promise<CarouselItem[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'resources',
    where: { and: [...publishedArticle, { tags: { in: [tag] } }] },
    sort: '-publishedDate',
    limit,
    depth: 1,
  })
  return docs.map(toCard)
}

/** Published articles in a category (any of its tags), newest first. */
export async function getArticlesByCategory(
  category: Category,
  limit = 4,
): Promise<CarouselItem[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'resources',
    where: { and: [...publishedArticle, { tags: { in: [...TAXONOMY[category]] } }] },
    sort: '-publishedDate',
    limit,
    depth: 1,
  })
  return docs.map(toCard)
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

/** A single published article by slug, or null if not found. */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
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
  })

  const r = docs[0]
  if (!r) return null

  return {
    slug: r.slug ?? slug,
    title: r.title,
    dek: r.summary ?? undefined,
    date: formatDate(r.publishedDate),
    tags: r.tags ?? [],
    image: coverOf(r),
    ratio: ratioOf(r),
    readTime: readingMinutes(r.body),
    body: r.body ?? null,
    references: (r.references ?? []).map((ref) => ({ label: ref.label, url: ref.url })),
  }
}

/** Every published article slug — for generateStaticParams (SSG). */
export async function getAllArticleSlugs(): Promise<string[]> {
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
}
