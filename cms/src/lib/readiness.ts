/**
 * Is this article ready to be public, and if not, why not.
 *
 * They live in their own file rather than inside the dashboard because they are
 * rules about the content, not about that screen — and because the last time a
 * rule was expressed twice, a section's count and its list-view link disagreed
 * and reported 22 against 23.
 *
 * The blocking/advisory split and the per-article `readinessFor` lived here for
 * the Review view. That view is gone, and rules with no reader are just code to
 * maintain, so what remains is what the dashboard actually counts.
 */

export type ReadinessArticle = {
  title?: string | null
  summary?: string | null
  status?: string | null
  tag?: string | null
  coverImage?: unknown
  coverUrl?: string | null
}

export const hasCover = (a: ReadinessArticle): boolean =>
  Boolean(a.coverImage || a.coverUrl?.trim())

/**
 * Editorially required, but deliberately NOT `required: true` on the field:
 * `POST /api/articles/from-markdown` declares summary optional, and making the
 * field required would start failing Content Studio's publishes. So the rule is
 * enforced where a person can act on it rather than where a robot would trip
 * over it.
 */
export const needsSummary = (a: ReadinessArticle): boolean => !a.summary?.trim()
