/**
 * Is this article ready to be public, and if not, why not.
 *
 * ONE DEFINITION, TWO SCREENS. The dashboard counts these rules across the
 * library ("23 articles waiting on a decision"); the Review view states them for
 * the article in front of you. If the two screens computed them separately they
 * would eventually disagree, and a dashboard whose numbers can be contradicted
 * by the document it links to is worse than no dashboard — this codebase has
 * already paid for that lesson once, when a section's count and its list-view
 * link used different `where` clauses and reported 22 against 23.
 *
 * So the rules live here and both screens import them.
 *
 * BLOCKING vs ADVISORY is a real distinction, not a severity gradient:
 *
 *   • Blocking — publishing would fail, or would put something broken in front
 *     of a reader. `tag` is `required: true` on the collection, so an untagged
 *     article cannot be saved as published at all: Payload rejects the write.
 *     The Review view must therefore refuse to offer Publish, rather than offer
 *     it and let the reader discover a validation error.
 *
 *   • Advisory — the page renders, a person may still want it fixed first. A
 *     missing cover degrades to a colour block; a missing Thai translation falls
 *     back to English. Neither is broken, both are worth knowing before you
 *     decide.
 */

export type ReadinessArticle = {
  title?: string | null
  summary?: string | null
  status?: string | null
  tag?: string | null
  coverImage?: unknown
  coverUrl?: string | null
}

export type ReadinessIssue = {
  /** Stable key, so the UI can style or test one without matching on prose. */
  key: 'no-title' | 'no-tag' | 'no-thai' | 'no-deck' | 'no-cover' | 'draft'
  label: string
  /** True when this would stop the article being published at all. */
  blocking: boolean
}

/**
 * A cover lives in EITHER of two fields: `coverImage` (an upload) or `coverUrl`
 * (a string, which is what the from-markdown endpoint sets). Checking only the
 * upload field would report every generated article as coverless.
 */
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

export const isPublished = (a: ReadinessArticle): boolean => a.status === 'published'

/**
 * Everything standing between this article and a reader.
 *
 * `thaiTitle` is passed in rather than read here, because answering "is this
 * translated?" needs a second query with `fallbackLocale: 'none'` — Payload's
 * fallback is on, so an untranslated article returns its ENGLISH title under
 * `locale: 'th'`, and the question cannot be asked with a `where` clause at
 * all. The caller owns that fetch; this function owns the rule.
 *
 * Pass `undefined` when the Thai state is genuinely unknown (a probe that
 * failed, say) and no Thai issue is reported — silence is honest, a false
 * "translated" is not.
 */
export function readinessFor(
  article: ReadinessArticle,
  thaiTitle: string | null | undefined,
): ReadinessIssue[] {
  const issues: ReadinessIssue[] = []

  if (!article.title?.trim()) {
    issues.push({ key: 'no-title', label: 'No title', blocking: true })
  }
  if (!article.tag) {
    issues.push({ key: 'no-tag', label: 'Not filed', blocking: true })
  }
  if (needsSummary(article)) {
    issues.push({ key: 'no-deck', label: 'No deck', blocking: false })
  }
  if (!hasCover(article)) {
    issues.push({ key: 'no-cover', label: 'No cover', blocking: false })
  }
  if (thaiTitle !== undefined && !thaiTitle?.trim()) {
    issues.push({ key: 'no-thai', label: 'No Thai', blocking: false })
  }
  if (!isPublished(article)) {
    issues.push({ key: 'draft', label: 'Draft', blocking: false })
  }

  return issues
}

export const hasBlockers = (issues: ReadinessIssue[]): boolean =>
  issues.some((i) => i.blocking)
