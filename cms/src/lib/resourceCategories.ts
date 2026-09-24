/**
 * The Resources taxonomy: what a downloadable thing *is*.
 *
 * Deliberately separate from the article tag taxonomy in `./tags` — the two
 * describe different things and share no vocabulary. An article is filed by
 * subject; a resource is filed by what you get when you download it.
 *
 * Category is also the only artwork a resource has. Resources take no image
 * uploads, so each category carries a cover — a spot colour and a glyph — and
 * every resource in that category renders from it. The colour belongs to the
 * *category*, not to a card's position in the grid: Fonts always looks like
 * Fonts, wherever it lands.
 *
 * THE CATEGORIES ARE DATA NOW, not this file. They were a fixed list of five,
 * so a resource that was not a template, a font, an ebook, a wallpaper or an
 * icon set had nowhere to go without a deploy. They live in the
 * `resource-categories` collection, and an editor adds one from the resource
 * form itself. What stays here is the part that is design, not content: the
 * palette a cover may take and the glyphs it may carry. A new category is dealt
 * one of each at random (collections/ResourceCategories.ts).
 *
 * Format is a separate axis, held per file on the resource itself: one resource
 * can be a Figma template that also ships a PDF, rather than being forced to
 * choose which of the two it "is".
 */

/** Glyph drawn on the document panel. Simple line shapes. */
export const RESOURCE_GLYPHS = ['grid', 'type', 'book', 'image', 'shapes'] as const
export type ResourceGlyph = (typeof RESOURCE_GLYPHS)[number]

/**
 * The cover colours. Each is a colour dark enough to carry the card's white
 * title at 4.5:1 (the `-ink` tokens, the red and the navy), so any category
 * can take any of them.
 */
export const RESOURCE_COLORS = {
  blue: 'var(--color-category-blue-ink)',
  red: 'var(--color-accent-red)',
  green: 'var(--color-category-green-ink)',
  purple: 'var(--color-category-purple-ink)',
  orange: 'var(--color-accent-orange-ink)',
  navy: 'var(--color-accent-navy)',
} as const
export type ResourceColor = keyof typeof RESOURCE_COLORS
export const RESOURCE_COLOR_NAMES = Object.keys(RESOURCE_COLORS) as ResourceColor[]

/** A category as the public site draws it. */
export type ResourceCategoryInfo = {
  name: string
  slug: string
  /** A CSS colour — one of RESOURCE_COLORS' values. */
  color: string
  glyph: ResourceGlyph
}

/** What a resource with no category (or a deleted one) is drawn as. */
export const FALLBACK_COVER = { color: RESOURCE_COLORS.blue, glyph: 'grid' as ResourceGlyph }

export function colorFor(name: unknown): string {
  return typeof name === 'string' && name in RESOURCE_COLORS
    ? RESOURCE_COLORS[name as ResourceColor]
    : FALLBACK_COVER.color
}

export function glyphFor(name: unknown): ResourceGlyph {
  return typeof name === 'string' && (RESOURCE_GLYPHS as readonly string[]).includes(name)
    ? (name as ResourceGlyph)
    : FALLBACK_COVER.glyph
}

/**
 * A cover for a new category: a colour and a glyph at random, preferring a
 * pairing no category has yet, so the shelf keeps telling its sections apart.
 * When every pairing is taken it is simply random.
 */
export function randomCover(
  taken: { color?: unknown; glyph?: unknown }[],
): { color: ResourceColor; glyph: ResourceGlyph } {
  const used = new Set(taken.map((t) => `${String(t.color)}|${String(t.glyph)}`))
  const all = RESOURCE_COLOR_NAMES.flatMap((color) =>
    RESOURCE_GLYPHS.map((glyph) => ({ color, glyph })),
  )
  const free = all.filter((pair) => !used.has(`${pair.color}|${pair.glyph}`))
  const pool = free.length > 0 ? free : all
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * The five categories the Hub started with, with the covers they always had.
 * The migration that made categories data inserted exactly these
 * (migrations/20260924_120000_resource_categories); the seed creates them too.
 */
export const STARTER_CATEGORIES: { name: string; color: ResourceColor; glyph: ResourceGlyph }[] = [
  { name: 'Templates', color: 'blue', glyph: 'grid' },
  { name: 'Fonts', color: 'red', glyph: 'type' },
  { name: 'Ebooks & Guides', color: 'green', glyph: 'book' },
  { name: 'Wallpapers', color: 'purple', glyph: 'image' },
  { name: 'Icons', color: 'orange', glyph: 'shapes' },
]

/** File formats an individual file can be tagged with, grouped by what uses them. */
export const RESOURCE_FORMATS = [
  'Figma',
  'Sketch',
  'PSD',
  'AI',
  'SVG',
  'PDF',
  'EPUB',
  'OTF',
  'TTF',
  'WOFF',
  'PNG',
  'JPG',
  'ZIP',
  'Other',
] as const

/** URL-safe category slug, matching the rules used for tag slugs. */
export function resourceCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
