import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { addDataAndFileToRequest, type PayloadHandler } from 'payload'

import type { Resource } from '../payload-types'
import { translateResourceToThai, translationConfigured } from '../lib/translate'

/**
 * POST /api/resources/from-markdown
 *
 * Integration endpoint for the Content Generator. Accepts an article with a
 * MARKDOWN body, converts it to Lexical server-side, and creates the resource.
 * Auth is required (a `users` API key or a logged-in session) — same access
 * rules as a normal create.
 *
 * Body: { title, tags[1..2], bodyMarkdown?, summary?, status?, coverUrl?,
 *         publishedDate?, slug?, references? }
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
  if (!title || !Array.isArray(tags) || tags.length < 1 || tags.length > 2) {
    return Response.json(
      { error: 'Requires `title` and 1–2 `tags` (from the taxonomy).' },
      { status: 400 },
    )
  }

  let body: Resource['body'] | undefined
  if (bodyMarkdown && bodyMarkdown.trim()) {
    const editorConfig = await editorConfigFactory.default({ config: req.payload.config })
    body = convertMarkdownToLexical({ editorConfig, markdown: bodyMarkdown }) as Resource['body']
  }

  try {
    const doc = await req.payload.create({
      collection: 'resources',
      overrideAccess: false,
      user: req.user,
      data: {
        type: 'article',
        title,
        tags: tags as Resource['tags'],
        summary: data.summary,
        status: data.status ?? 'draft',
        coverUrl: data.coverUrl,
        coverImage: data.coverImage,
        publishedDate: data.publishedDate,
        references: data.references,
        slug: data.slug,
        body,
        // Keep the English source markdown so the Thai translation can be
        // (re)generated cleanly (markdown → translate → Lexical).
        bodyMarkdown,
      },
    })

    // Auto-translate the English draft to Thai. Runs AFTER the create commits
    // (its own operations, not the create transaction) so no DB connection is
    // held during the Claude call. Best-effort: a translation failure never
    // fails the publish — the editor can retry from the admin.
    let thaiTranslated = false
    if (translationConfigured()) {
      try {
        await translateResourceToThai({ payload: req.payload, id: doc.id })
        thaiTranslated = true
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        req.payload.logger.error(`Thai auto-translation failed for resource ${doc.id}: ${message}`)
      }
    }

    return Response.json(
      { id: doc.id, slug: doc.slug, url: `/articles/${doc.slug}`, status: doc.status, thaiTranslated },
      { status: 201 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create failed'
    return Response.json({ error: message }, { status: 422 })
  }
}
