import Anthropic from '@anthropic-ai/sdk'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { Payload, PayloadRequest } from 'payload'

import type { Resource } from '../payload-types'

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

// Default to Opus 5; override with TRANSLATE_MODEL (e.g. claude-sonnet-5) to cut cost.
const MODEL = process.env.TRANSLATE_MODEL || 'claude-opus-5'

const SYSTEM = `You are a professional English→Thai translator for Designally, a design and creative-technology publication. Translate into natural, fluent, modern Thai for a design-literate audience — idiomatic, not word-for-word.

Rules:
- Preserve Markdown structure EXACTLY: heading levels (##, ###), lists, bold/italic, blockquotes, links, and code. Translate only human-readable text — never URLs, code, or Markdown syntax.
- Keep established English product/brand names, technical terms, and acronyms in English where a Thai designer naturally would (e.g. Figma, UX/UI, AI, CSS, design system).
- Do not add, drop, summarize, or reorder content.
- Return ONLY a JSON object with the same keys you were given. Keep empty strings empty. No prose, no code fences.`

/** True when the Hub has an Anthropic key configured and can translate. */
export function translationConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

type Fields = {
  title: string
  summary: string
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

async function translateFields(input: Fields): Promise<Fields> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set — cannot translate to Thai.')

  const anthropic = new Anthropic({ apiKey })
  const userContent = `Translate every string value of this JSON object from English to Thai, keeping the keys unchanged. Return the translated JSON object only:\n\n${JSON.stringify(
    input,
  )}`

  // Stream so a large body doesn't hit request timeouts; take the final message.
  const stream = anthropic.messages.stream({
    model: MODEL,
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
  return {
    title: parsed.title || input.title,
    summary: parsed.summary ?? '',
    metaTitle: parsed.metaTitle ?? '',
    metaDescription: parsed.metaDescription ?? '',
    bodyMarkdown: parsed.bodyMarkdown ?? '',
  }
}

/**
 * Translate a resource's English content into Thai and save it to the `th` locale.
 * `bodyMarkdown` (the English source) is NOT localized and is left untouched — the
 * Thai markdown is only an intermediate used to build the Thai Lexical body.
 */
export async function translateResourceToThai(args: {
  payload: Payload
  id: number | string
  req?: PayloadRequest
}): Promise<void> {
  const { payload, id, req } = args

  const en = (await payload.findByID({
    collection: 'resources',
    id,
    locale: 'en',
    depth: 0,
    overrideAccess: true,
    req,
  })) as Resource

  const th = await translateFields({
    title: en.title ?? '',
    summary: en.summary ?? '',
    metaTitle: en.seo?.metaTitle ?? '',
    metaDescription: en.seo?.metaDescription ?? '',
    bodyMarkdown: en.bodyMarkdown ?? '',
  })

  let body: Resource['body'] | undefined
  if (th.bodyMarkdown.trim()) {
    const editorConfig = await editorConfigFactory.default({ config: payload.config })
    body = convertMarkdownToLexical({
      editorConfig,
      markdown: th.bodyMarkdown,
    }) as Resource['body']
  }

  await payload.update({
    collection: 'resources',
    id,
    locale: 'th',
    overrideAccess: true,
    req,
    data: {
      title: th.title,
      summary: th.summary || undefined,
      ...(body ? { body } : {}),
      seo: {
        metaTitle: th.metaTitle || undefined,
        metaDescription: th.metaDescription || undefined,
      },
    },
  })
}
