import Anthropic from '@anthropic-ai/sdk'

import { deDash } from './deDash'
import {
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
  editorConfigFactory,
} from '@payloadcms/richtext-lexical'
import type { Payload, PayloadRequest } from 'payload'

import type { Article } from '../payload-types'
import { DEFAULT_TRANSLATE_MODEL } from './translateModels'

/*
 * English → Thai translation for Resources.
 *
 * The Hub is bilingual (Payload localization: `en` default + `th`). English is
 * the source; Thai is a translation. This module reads the English (default
 * locale) fields, asks Claude to translate them, converts the translated body
 * markdown back to Lexical, and writes the result to the `th` locale.
 *
 * IMPORTANT: translation is always run *outside* a create/update transaction —
 * from the from-markdown endpoint after the create commits, or from the manual
 * "Translate to Thai" endpoint. Running it inside an afterChange hook would hold
 * a DB connection open for the whole (multi-second) Claude call, which on the
 * serverless Supabase pooler is exactly what starves connections.
 */

/* The model is a setting, picked on the account screen (globals/Settings), so
   it changes without a deploy. Read on every translation; the global's own
   hook falls back to TRANSLATE_MODEL, then the default, until one is picked. */
async function translateModel(payload: Payload, req?: PayloadRequest): Promise<string> {
  try {
    const settings = await payload.findGlobal({ slug: 'settings', depth: 0, overrideAccess: true, req })
    if (settings.translateModel) return settings.translateModel
  } catch {
    // No settings table yet (the migration has not run): translate as before.
  }
  return process.env.TRANSLATE_MODEL || DEFAULT_TRANSLATE_MODEL
}

const SYSTEM = `You are a professional English→Thai translator for Designally, a design and creative-technology publication. Translate into natural, fluent, modern Thai for a design-literate audience — idiomatic, not word-for-word.

Rules:
- Preserve Markdown structure EXACTLY: heading levels (##, ###), lists, bold/italic, blockquotes, links, and code. Translate only human-readable text — never URLs, code, or Markdown syntax.
- Keep established English product/brand names, technical terms, and acronyms in English where a Thai designer naturally would (e.g. Figma, UX/UI, AI, CSS, design system).
- Do not add, drop, summarize, or reorder content.
- Never use em dashes ("—") or en dashes as sentence punctuation, even where the English has one; they read as machine-written. Use a comma, a colon, parentheses, or two sentences instead. An en dash is fine inside a numeric range (2020–2024).
- Return ONLY a JSON object with the same keys you were given. Keep empty strings empty. No prose, no code fences.`

/** True when the Hub has an Anthropic key configured and can translate. */
export function translationConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

type Fields = {
  title: string
  summary: string
  /** Resources only — articles carry their long copy in `bodyMarkdown`. */
  description: string
  metaTitle: string
  metaDescription: string
  bodyMarkdown: string
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) return fenced[1].trim()
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first !== -1 && last !== -1) return text.slice(first, last + 1)
  return text
}

async function translateFields(input: Fields, model: string): Promise<Fields> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set — cannot translate to Thai.')

  const anthropic = new Anthropic({ apiKey })
  const userContent = `Translate every string value of this JSON object from English to Thai, keeping the keys unchanged. Return the translated JSON object only:\n\n${JSON.stringify(
    input,
  )}`

  // Stream so a large body doesn't hit request timeouts; take the final message.
  const stream = anthropic.messages.stream({
    model,
    max_tokens: 16000,
    system: SYSTEM,
    messages: [{ role: 'user', content: userContent }],
  })
  const message = await stream.finalMessage()
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()

  const parsed = JSON.parse(extractJson(text)) as Partial<Fields>
  /* Cleaned as well as instructed: the model is told not to use dashes, and
     this catches any it uses anyway. References are not translated, so a
     source's own title keeps its dash. */
  return {
    title: deDash(parsed.title || input.title),
    summary: deDash(parsed.summary ?? ''),
    description: deDash(parsed.description ?? ''),
    metaTitle: deDash(parsed.metaTitle ?? ''),
    metaDescription: deDash(parsed.metaDescription ?? ''),
    bodyMarkdown: deDash(parsed.bodyMarkdown ?? ''),
  }
}

/**
 * Translate an item's English content into Thai and save it to the `th` locale.
 * The English body is read from the saved English Lexical body (see below), and
 * `bodyMarkdown` is left untouched — the Thai markdown is only an intermediate
 * used to build the Thai Lexical body. Only `th` is written: the English is
 * never changed by a translation.
 *
 * Serves both collections. Articles carry a rich body built from markdown;
 * resources carry a plain-text description and no body at all, so each field is
 * translated only when the item actually has it.
 */
export async function translateItemToThai(args: {
  payload: Payload
  collection: 'articles' | 'resources'
  id: number | string
  req?: PayloadRequest
}): Promise<void> {
  const { payload, collection, id, req } = args

  const en = (await payload.findByID({
    collection,
    id,
    locale: 'en',
    depth: 0,
    overrideAccess: true,
    req,
    // Both collections are read through this, and only the fields present on
    // the one in hand are translated, so the shape is narrowed below rather
    // than asserted to either type here.
  })) as unknown

  const source = en as Record<string, any>
  const model = await translateModel(payload, req)
  const editorConfig = await editorConfigFactory.default({ config: payload.config })

  /* THE ENGLISH BODY AS IT IS NOW. `bodyMarkdown` is the markdown Content
     Studio published with, and nothing updates it when the English is edited
     here — translating from it would bring back the old text, and an article
     written in the admin has none at all. So the source is the saved English
     body, turned back into markdown; `bodyMarkdown` is only the fallback for a
     body that is empty. */
  const englishBody = source.body?.root
    ? convertLexicalToMarkdown({ data: source.body, editorConfig }).trim()
    : ''
  const th = await translateFields({
    title: source.title ?? '',
    summary: source.summary ?? '',
    description: source.description ?? '',
    metaTitle: source.seo?.metaTitle ?? '',
    metaDescription: source.seo?.metaDescription ?? '',
    bodyMarkdown: englishBody || source.bodyMarkdown || '',
  }, model)

  // Articles carry a rich body; resources do not, so this stays undefined for
  // them and the update below simply omits it.
  let body: Article['body'] | undefined
  if (th.bodyMarkdown.trim()) {
    body = convertMarkdownToLexical({
      editorConfig,
      markdown: th.bodyMarkdown,
    }) as Article['body']
  }

  await payload.update({
    collection,
    id,
    locale: 'th',
    overrideAccess: true,
    req,
    data: {
      title: th.title,
      // Articles have a summary and a body; resources have only a description.
      // Each is written back only when the source actually had it, so neither
      // collection is handed a field it does not define.
      ...(source.summary !== undefined ? { summary: th.summary || undefined } : {}),
      // Only resources have a description; only articles have a body.
      ...(source.description !== undefined ? { description: th.description || undefined } : {}),
      ...(body ? { body } : {}),
      seo: {
        metaTitle: th.metaTitle || undefined,
        metaDescription: th.metaDescription || undefined,
      },
    },
  })
}
