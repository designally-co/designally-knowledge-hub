import { getPayload } from 'payload'
import type { Where } from 'payload'

import config from '@/payload.config'
import type { Article as ArticleDoc, Media, Resource, ResourceCategory } from '@/payload-types'
import { localeHref, type Locale } from './i18n'
import { readingMinutes } from './readingTime'
import {
  FALLBACK_COVER,
  colorFor,
  glyphFor,
  resourceCategorySlug,
  type ResourceCategoryInfo,
  type ResourceGlyph,
} from './resourceCategories'
import { TAG_OPTIONS, TAXONOMY, type Category } from './tags'

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
  /** ISO publish date, for ordering across collections. Empty when unset. */
  publishedAt: string
  tags: string[]
  image?: string
  /** Width-described candidates for `image`. See coverSrcSetOf. */
  imageSrcSet?: string
  ratio: string
  /** False when `ratio` is the placeholder: the cover is a URL, or an upload
      without stored dimensions. The hero carousel then reads the image. */
  ratioKnown: boolean
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

/**
 * What the cover is OF, for the one place a description is read aloud with
 * nothing beside it: a share card.
 *
 * NOT FOR THE PAGE ITSELF. The cover renders with an empty `alt` everywhere it
 * appears, and that is the correct call rather than an omission — a hero sits
 * under the headline it illustrates, and a card's picture is inside a link
 * whose text is already the title. Describing them would have a screen reader
 * announce the same sentence twice. A share card has no such neighbour: the
 * platform shows the image alone, so `og:image:alt` is the one consumer with
 * something to gain and nothing to repeat.
 *
 * Only an uploaded file has a description. A pasted `coverUrl` is a string with
 * no record behind it, so there is nothing to say about it.
 */
function coverAltOf(r: ArticleDoc): string | undefined {
  const img = r.coverImage
  if (img && typeof img === 'object') {
    const media = img as Media
    if (media.url && typeof media.alt === 'string' && media.alt.trim()) return media.alt
  }
  return undefined
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
 * The cover's `srcset`: the derivatives Payload cut on upload, then the file.
 *
 * WITHOUT THIS EVERY CARD DOWNLOADED THE ORIGINAL. A card is 165-318px wide and
 * a cover is 1600px (Content Studio's WebP) or, for the ones that predate that,
 * a 2752px PNG of up to 6.5MB — twenty of them on the home page. `thumbnail`
 * (400) and `card` (800) already sit beside every upload in R2; the browser
 * picks from them against the `sizes` each component states.
 *
 * `hero` (1800) is absent whenever the file is narrower — Payload does not
 * enlarge — so it joins only when it exists, and the original always closes
 * the set at its own width. A pasted `coverUrl` has no derivatives: undefined,
 * and the `src` alone stands.
 */
function coverSrcSetOf(r: ArticleDoc): string | undefined {
  const img = r.coverImage
  if (!img || typeof img !== 'object') return undefined
  const media = img as Media
  if (!media.url || !media.width) return undefined
  const entries: string[] = []
  for (const size of [media.sizes?.thumbnail, media.sizes?.card, media.sizes?.hero]) {
    if (size?.url && size.width && size.width < media.width) entries.push(`${size.url} ${size.width}w`)
  }
  if (entries.length === 0) return undefined
  entries.push(`${media.url} ${media.width}w`)
  return entries.join(', ')
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

/** What that picture shows, when the file carries a description. */
function shareImageAltOf(r: ArticleDoc): string | undefined {
  return coverAltOf(r)
}

/**
 * Cover aspect ratio, e.g. "1200 / 800". Taken from the uploaded image's real
 * dimensions. Falls back to a portrait default when there's no upload to
 * measure (external URL or no cover — the ratio there is just a placeholder box).
 */
const DEFAULT_RATIO = '3 / 4'
function ratioKnownOf(r: ArticleDoc): boolean {
  const img = r.coverImage
  return Boolean(img && typeof img === 'object' && (img as Media).width && (img as Media).height)
}
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
    publishedAt: r.publishedDate ?? '',
    tags: r.tag ? [r.tag] : [],
    image: coverOf(r),
    imageSrcSet: coverSrcSetOf(r),
    ratio: ratioOf(r),
    ratioKnown: ratioKnownOf(r),
    href: localeHref(locale, `/articles/${r.slug}`),
  }
}

/**
 * A title search that also reaches a tag (or resource category) whose name
 * contains the query, so "branding" finds everything filed under Branding
 * Systems and a tag picked from search's Popular Keywords finds its articles.
 * The names are matched here, in code, and handed to Payload as an `in` on the
 * select field; a `like` on a select column is not something every adapter
 * supports.
 */
function titleOrNameMatch(q: string, names: readonly string[], field: 'tag' | 'category'): Where {
  const needle = q.toLowerCase()
  const matched = names.filter((name) => name.toLowerCase().includes(needle))
  const title: Where = { title: { like: q } }
  return matched.length > 0 ? { or: [title, { [field]: { in: matched } }] } : title
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
 * The articles shown at the foot of an article.
 *
 * THE EDITOR'S CHOICE WINS, AND IS TAKEN LITERALLY. The `related` picker on the
 * article writes real relationships and, until now, nothing read them back: the
 * page listed the four most recently published articles no matter what was
 * chosen, so every article on the site showed the same four and the picker's
 * "Up to four, at the foot of the article" was a promise it could not keep.
 *
 * Chosen articles lead, IN THE ORDER THEY WERE PICKED. Unpublished picks and
 * the article itself are dropped, because a card that leads to a 404 is worse
 * than one fewer card.
 *
 * THE SAME TAG COMES NEXT, and it fills the row whether the picks were empty or
 * merely short. An article about colour contrast should reach the other
 * accessibility writing before it reaches whatever went out last week, and a
 * half-filled row is a worse answer than a full one — picking two good articles
 * should not cost the reader the other two slots.
 *
 * RECENT ARTICLES COME LAST, and only when the tag cannot fill the row, so a
 * lone article in its tag still gets a full set rather than an empty section.
 *
 * Each stage only ever fills what the stage above it left, and nothing appears
 * twice.
 */
export async function getRelatedArticles(
  slug: string,
  locale: Locale = 'en',
  count = 4,
): Promise<CarouselItem[]> {
  return safeRead(
    'getRelatedArticles',
    async () => {
      const payload = await getPayload({ config })

      /* depth 0: ids are all that is needed to decide WHICH articles, and the
         cards are built from a second read at depth 1 so their covers are
         populated. Asking for the covers of articles that may not be used is
         the more expensive way round. */
      const { docs: selfDocs } = await payload.find({
        collection: 'articles',
        where: { and: [{ slug: { equals: slug } }, ...publishedOnly] },
        limit: 1,
        depth: 0,
        locale,
      })
      const self = selfDocs[0]
      if (!self) return []

      const cardsFor = async (where: Where, limit: number): Promise<ArticleDoc[]> => {
        if (limit <= 0) return []
        const { docs } = await payload.find({
          collection: 'articles',
          where,
          sort: '-publishedDate',
          limit,
          depth: 1, // populate coverImage
          locale,
        })
        return docs
      }

      /* A relationship at depth 0 is a list of ids, but Payload will hand back
         populated docs if it is ever read deeper — so accept both. */
      const pickedIds = (self.related ?? [])
        .map((entry) => (typeof entry === 'object' && entry ? entry.id : entry))
        .filter((id): id is number => typeof id === 'number' && id !== self.id)

      /* One list, filled in order of authority: chosen, then same tag, then
         recent. `taken` is what the stages above have already used, and it is
         also the exclusion list, so nothing can appear twice and the article
         never links to itself. It always holds at least `self.id`, so the
         `not_in` below is never handed an empty array. */
      const out: ArticleDoc[] = []
      const taken = [self.id]
      const room = () => count - out.length
      const add = (docs: ArticleDoc[]) => {
        for (const doc of docs) {
          out.push(doc)
          taken.push(doc.id)
        }
      }

      if (pickedIds.length > 0) {
        const docs = await cardsFor(
          { and: [{ id: { in: pickedIds } }, ...publishedOnly] },
          pickedIds.length,
        )
        /* `in` returns database order; the editor's order is the one that was
           chosen, so restore it. */
        const byId = new Map(docs.map((d) => [d.id, d]))
        add(
          pickedIds
            .map((id) => byId.get(id))
            .filter((d): d is ArticleDoc => Boolean(d))
            .slice(0, count),
        )
      }

      if (room() > 0 && self.tag) {
        add(
          await cardsFor(
            { and: [{ tag: { equals: self.tag } }, { id: { not_in: taken } }, ...publishedOnly] },
            room(),
          ),
        )
      }

      if (room() > 0) {
        add(await cardsFor({ and: [{ id: { not_in: taken } }, ...publishedOnly] }, room()))
      }

      return out.map((d) => toCard(d, locale))
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

/**
 * The tags filed on the most published articles, most-used first; a tie goes to
 * the tag used most recently. Search's "Popular keywords".
 */
export async function getPopularTags(count = 6, locale: Locale = 'en'): Promise<string[]> {
  return safeRead(
    'getPopularTags',
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'articles',
        where: { and: [...publishedOnly] },
        sort: '-publishedDate',
        limit: 1000,
        depth: 0,
        locale,
      })
      // A Map keeps first-seen order, which is newest first; the sort is stable,
      // so equal counts stay in that order.
      const tally = new Map<string, number>()
      for (const r of docs) {
        const tag = r.tag as string | null | undefined
        if (tag) tally.set(tag, (tally.get(tag) ?? 0) + 1)
      }
      return [...tally.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([tag]) => tag)
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
  /** Case-insensitive search of the title and the tag's name. */
  q?: string
  page?: number
  perPage?: number
  locale?: Locale
}

/** Items per page on the catalog pages (articles by category or tag, and
    resources); the pager takes over past it. */
export const CATALOG_PAGE_SIZE = 10

/**
 * A filtered, paginated slice of published articles, newest first — the engine
 * behind the category and tag listing pages and search. `tag` (exact) takes
 * precedence over `category` (any of its tags); `q` searches the title and the
 * tag's name. Returns the page's items
 * plus totals for the pager.
 */
export async function getArticleListing({
  category,
  tag,
  q,
  page = 1,
  perPage = CATALOG_PAGE_SIZE,
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
      if (q?.trim()) where.push(titleOrNameMatch(q.trim(), TAG_OPTIONS, 'tag'))

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
  /** ISO publish date, for ordering across collections. Empty when unset. */
  publishedAt: string
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
  /* Populated at depth 1; an id alone (depth 0) or a deleted category draws
     the fallback cover rather than failing the card. */
  const category = typeof r.category === 'object' && r.category ? r.category : null
  const formats: string[] = []
  for (const f of r.files ?? []) {
    if (f.format && !formats.includes(f.format)) formats.push(f.format)
  }
  return {
    id: String(r.id),
    slug: r.slug ?? '',
    title: r.title,
    date: formatDate(r.publishedDate, locale),
    publishedAt: r.publishedDate ?? '',
    category: category?.name ?? '',
    color: category ? colorFor(category.color) : FALLBACK_COVER.color,
    glyph: category ? glyphFor(category.glyph) : FALLBACK_COVER.glyph,
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
  /** A resource category's slug (`fonts`, `ebooks-and-guides`, …). */
  category?: string
  /** Case-insensitive search of the title and the category's name. */
  q?: string
  page?: number
  perPage?: number
  locale?: Locale
}

/**
 * A filtered, paginated slice of published resources, newest first — the engine
 * behind the /resources listing page. `category` filters by the resource's own
 * taxonomy; `q` searches the title and the category's name. Returns the page's
 * items plus totals.
 */
export async function getResourceListing({
  category,
  q,
  page = 1,
  perPage = CATALOG_PAGE_SIZE,
  locale = 'en',
}: ResourceListingOptions): Promise<Listing<ResourceItem>> {
  const empty: Listing<ResourceItem> = { items: [], total: 0, totalPages: 0, page, perPage }
  return safeRead(
    'getResourceListing',
    async () => {
      const payload = await getPayload({ config })
      const where: Where[] = [...publishedOnly]
      if (category) where.push({ 'category.slug': { equals: category } })
      if (q?.trim()) {
        where.push({ or: [{ title: { like: q.trim() } }, { 'category.name': { like: q.trim() } }] })
      }

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

/**
 * Every resource category, oldest first — the five the Hub started with keep
 * their order and a new one joins the end. For the /resources filters and the
 * header's Resources menu.
 */
export async function getResourceCategories(): Promise<ResourceCategoryInfo[]> {
  return safeRead(
    'getResourceCategories',
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'resource-categories',
        sort: 'createdAt',
        limit: 0,
        pagination: false,
        depth: 0,
      })
      return docs.map((c: ResourceCategory) => ({
        name: c.name,
        slug: c.slug || resourceCategorySlug(c.name),
        color: colorFor(c.color),
        glyph: glyphFor(c.glyph),
      }))
    },
    [],
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
  imageSrcSet?: string
  ratio: string
  readTime?: number
  body: ArticleDoc['body']
  references: { label: string; url: string }[]
  /** For the social share card. Falls back to `image`. */
  shareImage?: string
  /** What that picture shows — `og:image:alt`, and only there. See coverAltOf. */
  shareImageAlt?: string
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
        imageSrcSet: coverSrcSetOf(r),
        shareImage: shareImageOf(r),
        shareImageAlt: shareImageAltOf(r),
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
