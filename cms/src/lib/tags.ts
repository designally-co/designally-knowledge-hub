/**
 * The taxonomy: 4 categories (pillars) × 34 tags (directions).
 *
 * Authors pick 1–2 tags from the fixed list (not free text). There is no
 * separate category field — each tag belongs to exactly one category, so a
 * resource's category is DERIVED from its tag via `categoryForTag`. The admin
 * dropdown shows every tag prefixed with its category so the grouping is clear.
 *
 * Add/rename tags or categories here — this is the single source of truth for
 * the whole taxonomy (CMS options + tag pages + category sections).
 */

export const CATEGORIES = ['Design', 'New Update', 'Creative Things', 'Design with AI'] as const

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
  'New Update': [
    'Industry Trends',
    'New Technology',
    'Marketing Shift',
    'Consumer Behavior',
    'Brand Launch',
    'Product Update',
    'Design Tools',
    'Industry Report',
  ],
  'Creative Things': [
    'Campaign Breakdown',
    'Packaging',
    'Motion',
    'Creative Direction',
    'Photography',
    'Brand Film',
    'Storytelling',
    'Creative Review',
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
