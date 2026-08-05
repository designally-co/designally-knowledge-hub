/**
 * The Resources taxonomy: what a downloadable thing *is*.
 *
 * Deliberately separate from the article tag taxonomy in `./tags` — the two
 * describe different things and share no vocabulary. An article is filed by
 * subject; a resource is filed by what you get when you download it.
 *
 * Category is also the only artwork a resource has. Resources take no image
 * uploads, so each category carries a preset — a spot colour and a glyph — and
 * every resource in that category renders from it. That is why the list is
 * short: each entry has to be drawn, and five distinct presets read as a set
 * where nine near-duplicates would not.
 *
 * Note the colour belongs to the *category*, not to a card's position in the
 * grid. Fonts always looks like Fonts, wherever it lands.
 *
 * Format is a separate axis, held per file on the resource itself: one resource
 * can be a Figma template that also ships a PDF, rather than being forced to
 * choose which of the two it "is".
 */

export const RESOURCE_CATEGORIES = [
  'Templates',
  'Fonts',
  'Ebooks & Guides',
  'Wallpapers',
  'Icons',
] as const

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number]

/** Glyph drawn on the document panel. Simple line shapes, one per category. */
export type ResourceGlyph = 'grid' | 'type' | 'book' | 'image' | 'shapes'

export type ResourcePreset = {
  /** Spot colour for the document panel behind the folder pocket. */
  color: string
  glyph: ResourceGlyph
  /** Formats an editor is most likely to attach; shown as placeholder help. */
  typicalFormats: string
}

export const RESOURCE_PRESETS: Record<ResourceCategory, ResourcePreset> = {
  Templates: { color: 'var(--be-cobalt)', glyph: 'grid', typicalFormats: 'Figma, Sketch, PSD, AI' },
  Fonts: { color: 'var(--be-brick)', glyph: 'type', typicalFormats: 'OTF, TTF, WOFF' },
  'Ebooks & Guides': { color: 'var(--be-green)', glyph: 'book', typicalFormats: 'PDF, EPUB' },
  Wallpapers: { color: 'var(--be-purple)', glyph: 'image', typicalFormats: 'PNG, JPG' },
  Icons: { color: 'var(--be-gold)', glyph: 'shapes', typicalFormats: 'SVG, AI, Figma' },
}

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

export const RESOURCE_CATEGORY_OPTIONS = RESOURCE_CATEGORIES.map((c) => ({ label: c, value: c }))

export function isResourceCategory(value: unknown): value is ResourceCategory {
  return typeof value === 'string' && (RESOURCE_CATEGORIES as readonly string[]).includes(value)
}

/** Preset for a category, falling back to Templates for unknown/missing values. */
export function presetForCategory(category: string | null | undefined): ResourcePreset {
  return isResourceCategory(category) ? RESOURCE_PRESETS[category] : RESOURCE_PRESETS.Templates
}

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
