import Anthropic from '@anthropic-ai/sdk'

import { TRANSLATE_MODELS, modelLabel, type TranslateModelOption } from './translateModels'

/*
 * Every Claude model the Hub's key can use, newest first, from Anthropic's
 * Models API — so the translation dropdown offers a model the day it is
 * released, with no deploy.
 *
 * Asked at most once an hour. When it cannot be asked — no key, no network, an
 * error — the list in translateModels stands in, so the dropdown is never
 * empty. Known models keep their one-line note either way.
 */

const TTL_MS = 60 * 60 * 1000
let cache: { at: number; options: TranslateModelOption[] } | null = null

const noteOf = new Map(TRANSLATE_MODELS.map((model) => [model.value, model.note]))

export async function availableModels(): Promise<TranslateModelOption[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.options
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return [...TRANSLATE_MODELS]
  try {
    const anthropic = new Anthropic({ apiKey })
    const options: TranslateModelOption[] = []
    for await (const model of anthropic.models.list({ limit: 100 }, { timeout: 8000, maxRetries: 0 })) {
      options.push({
        value: model.id,
        label: model.display_name || modelLabel(model.id),
        note: noteOf.get(model.id),
      })
    }
    if (options.length === 0) return [...TRANSLATE_MODELS]
    cache = { at: Date.now(), options }
    return options
  } catch {
    return [...TRANSLATE_MODELS]
  }
}
