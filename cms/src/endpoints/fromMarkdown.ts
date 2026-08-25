import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { addDataAndFileToRequest, type PayloadHandler } from 'payload'

import type { Article } from '../payload-types'
import { translateItemToThai, translationConfigured } from '../lib/translate'
import type { RequiredDataFromCollectionSlug } from 'payload'
import { toSlug } from '../fields/slug'

/**
 * POST /api/articles/from-markdown
 *
 * Integration endpoint for the Content Generator. Accepts an article with a
 * MARKDOWN body, converts it to Lexical server-side, and creates the article.
 * Auth is required (a `users` API key or a logged-in session) — same access
 * rules as a normal create.
 *
 * Body: { title, tags[1], bodyMarkdown?, summary?, status?, coverUrl?,
 *         publishedDate?, slug?, references? }
 *
 * `tags` stays an ARRAY on the wire even though an article now carries exactly
 * one tag, because that is the shape the Content Generator already sends and
 * there is no reason to force a lockstep deploy over it. It must contain
 * exactly one entry; the first is written to the article's `tag` field.
 */
type Payload = {
  title?: string
  tags?: string[]
  bodyMarkdown?: string
  summary?: string
  status?: 'draft' | 'published'
  coverUrl?: string
  coverImage?: number // id of an already-uploaded media doc
  publishedDate?: string
  slug?: string
  references?: { label: string; url: string }[]
}

export const fromMarkdownHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json(
      { error: 'Unauthorized. Provide a valid `users` API key.' },
      { status: 401 },
    )
  }

  await addDataAndFileToRequest(req)
  const data = (req.data ?? {}) as Payload

  const { title, tags, bodyMarkdown } = data
  if (!title || !Array.isArray(tags) || tags.length !== 1) {
    return Response.json(
      { error: 'Requires `title` and exactly one `tag` (from the taxonomy), sent as `tags: [tag]`.' },
      { status: 400 },
    )
  }

  let body: Article['body'] | undefined
  if (bodyMarkdown && bodyMarkdown.trim()) {
    const editorConfig = await editorConfigFactory.default({ config: req.payload.config })
    body = convertMarkdownToLexical({ editorConfig, markdown: bodyMarkdown }) as Article['body']
  }

  /*
   * UPSERT, not create.
   *
   * This endpoint only ever created, so an article published once could never
   * be updated: Content Studio's "Republish to Hub" collided with the unique
   * slug and came back "The following field is invalid: slug". Republishing is
   * a button in that product's UI, so it has to mean something.
   *
   * The slug is derived with the collection's own `toSlug`, imported rather
   * than reimplemented — two copies of that rule would drift, and a drifted
   * slug means the lookup misses and a duplicate is created instead of an
   * update, which is the exact failure this is meant to end.
   */
  const targetSlug = (data.slug && toSlug(data.slug)) || toSlug(title)

  /* Only the fields actually sent are written. Passing `undefined` for the rest
     would blank a cover or a dek that the Hub is holding and the caller simply
     did not mention. */
  type ArticleData = RequiredDataFromCollectionSlug<'articles'>
  const fields: Partial<ArticleData> = {
    title,
    tag: tags[0] as Article['tag'],
    status: data.status ?? 'draft',
    slug: targetSlug,
  }
  if (data.summary !== undefined) fields.summary = data.summary
  if (data.coverUrl !== undefined) fields.coverUrl = data.coverUrl
  if (data.coverImage !== undefined) fields.coverImage = data.coverImage
  if (data.publishedDate !== undefined) fields.publishedDate = data.publishedDate
  if (data.references !== undefined) fields.references = data.references
  if (body !== undefined) fields.body = body
  // Keep the English source markdown so the Thai translation can be
  // (re)generated cleanly (markdown → translate → Lexical).
  if (bodyMarkdown !== undefined) fields.bodyMarkdown = bodyMarkdown

  try {
    const existing = await req.payload.find({
      collection: 'articles',
      where: { slug: { equals: targetSlug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const previous = existing.docs[0]

    const doc = previous
      ? await req.payload.update({
          collection: 'articles',
          id: previous.id,
          overrideAccess: false,
          user: req.user,
          data: fields as ArticleData,
        })
      : await req.payload.create({
          collection: 'articles',
          overrideAccess: false,
          user: req.user,
          data: fields as ArticleData,
        })

    // Auto-translate the English draft to Thai. Runs AFTER the create commits
    // (its own operations, not the create transaction) so no DB connection is
    // held during the Claude call. Best-effort: a translation failure never
    // fails the publish — the editor can retry from the admin.
    let thaiTranslated = false
    if (translationConfigured()) {
      try {
        await translateItemToThai({ payload: req.payload, collection: 'articles', id: doc.id })
        thaiTranslated = true
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        req.payload.logger.error(`Thai auto-translation failed for article ${doc.id}: ${message}`)
      }
    }

    return Response.json(
      {
        id: doc.id,
        slug: doc.slug,
        url: `/articles/${doc.slug}`,
        status: doc.status,
        thaiTranslated,
        updated: Boolean(previous),
      },
      { status: previous ? 200 : 201 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Publish failed'
    return Response.json({ error: message }, { status: 422 })
  }
}
