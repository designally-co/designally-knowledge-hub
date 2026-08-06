/**
 * The taxonomy: 3 categories (pillars) × 34 tags (directions).
 *
 * The pillars are Design (shown as "Case Studies"), Insights, and Design with AI
 * (shown as "Workflows") — see `categoryLabel` in i18n for the display names.
 * `Insights` is the merger of the former New Update and Creative Things pillars:
 * a category is DERIVED from an article's single tag, so folding two pillars into
 * one needed no data migration — every tag kept its value and simply rolls up to
 * Insights now.
 *
 * Authors pick one tag from the fixed list (not free text). There is no separate
 * category field — each tag belongs to exactly one category via `categoryForTag`.
 * The admin dropdown shows every tag prefixed with its category.
 *
 * Add/rename tags or categories here — this is the single source of truth for the
 * whole taxonomy (CMS options + tag pages + category sections).
 */

export const CATEGORIES = ['Design', 'Insights', 'Design with AI'] as const

export type Category = (typeof CATEGORIES)[number]

/** Each category and the tags (directions) under it. */
export const TAXONOMY: Record<Category, readonly string[]> = {
  Design: [
    'Branding Systems',
    'Visual Identity',
    'UX/UI',
    'Design Process',
    'Grid Systems',
    'Typography',
    'Design Psychology',
    'Case Study',
    'Design Critique',
    'Before / After',
  ],
  // Insights = former Creative Things pillar (creative directions, kept first so
  // the homepage topic cloud still leads with them) + former New Update pillar
  // (industry / market directions).
  Insights: [
    'Campaign Breakdown',
    'Packaging',
    'Motion',
    'Creative Direction',
    'Photography',
    'Brand Film',
    'Storytelling',
    'Creative Review',
    'Industry Trends',
    'New Technology',
    'Marketing Shift',
    'Consumer Behavior',
    'Brand Launch',
    'Product Update',
    'Design Tools',
    'Industry Report',
  ],
  'Design with AI': [
    'AI Workflow',
    'Strategy + AI',
    'Research',
    'Brand Audit',
    'Productivity',
    'Automation',
    'AI Design',
    'Future of Design',
  ],
}

/** Flat list of all 34 tag values, in category order. */
export const TAG_OPTIONS: string[] = CATEGORIES.flatMap((c) => [...TAXONOMY[c]])

/** Reverse lookup: tag → its category. */
export const TAG_TO_CATEGORY: Record<string, Category> = Object.fromEntries(
  CATEGORIES.flatMap((c) => TAXONOMY[c].map((tag) => [tag, c] as const)),
)

/** The category a tag belongs to (undefined for an unknown tag). */
export function categoryForTag(tag: string): Category | undefined {
  return TAG_TO_CATEGORY[tag]
}

/** URL-safe category slug, following the same rules as tag slugs. */
export function categorySlug(category: Category): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const CATEGORY_BY_SLUG: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((category) => [categorySlug(category), category]),
)

export function categoryFromSlug(slug: string): Category | undefined {
  return CATEGORY_BY_SLUG[slug]
}

/**
 * Slugs of retired categories → the slug that replaced them. The New Update and
 * Creative Things pillars merged into Insights; their old category URLs redirect
 * so existing links and bookmarks don't 404.
 */
export const RETIRED_CATEGORY_SLUGS: Record<string, string> = {
  'new-update': categorySlug('Insights'),
  'creative-things': categorySlug('Insights'),
}

/** URL-safe slug for a tag, e.g. "UX/UI" → "ux-ui", "Strategy + AI" → "strategy-ai". */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** slug → tag reverse lookup (all 34 slugs are unique). */
export const TAG_BY_SLUG: Record<string, string> = Object.fromEntries(
  TAG_OPTIONS.map((t) => [tagSlug(t), t]),
)

/** The tag for a URL slug, or undefined if the slug isn't a known tag. */
export function tagFromSlug(slug: string): string | undefined {
  return TAG_BY_SLUG[slug]
}

/**
 * Options for the Payload `select` field: value is the bare tag (what's stored
 * and shown publicly); label is prefixed with the category so the flat dropdown
 * reads as grouped, e.g. "Design · Typography".
 */
export const TAG_SELECT_OPTIONS: { label: string; value: string }[] = CATEGORIES.flatMap((c) =>
  TAXONOMY[c].map((tag) => ({ label: `${c} · ${tag}`, value: tag })),
)
