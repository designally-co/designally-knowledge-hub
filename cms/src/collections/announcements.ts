import type { Announcement } from '../lib/newsletter'

/**
 * What the newsletter says about an article.
 *
 * Exported, because two things need it and they need it to agree: the publish
 * hook, and Content Studio's import — which suppresses the hook so it can send
 * once the Thai translation has landed. See endpoints/fromMarkdown.
 *
 * It is called once per language, with that language's version of the
 * document, so everything here reads off the doc it is handed.
 */
export const articleAnnouncement = (doc: Record<string, unknown>): Announcement => ({
  kind: 'article',
  title: String(doc.title ?? ''),
  summary: typeof doc.summary === 'string' ? doc.summary : undefined,
  /* The cover, whether it is an uploaded file or a pasted URL — the same two
     places the site's own `coverOf` looks. */
  image:
    doc.coverImage && typeof doc.coverImage === 'object'
      ? ((doc.coverImage as { url?: string }).url ?? undefined)
      : typeof doc.coverUrl === 'string'
        ? doc.coverUrl
        : undefined,
  path: `/articles/${String(doc.slug ?? '')}`,
})
