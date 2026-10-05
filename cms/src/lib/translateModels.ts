/*
 * The Claude models the Thai translation can run on.
 *
 * THE FALLBACK, NOT THE LIST. The account screen asks the Hub which models
 * Anthropic currently offers (lib/availableModels, served by the settings
 * global's `/models` endpoint), so a model released next month is in the
 * dropdown without a deploy. This list is what it shows when Anthropic cannot
 * be asked, and where the one-line notes for the models we know come from.
 * Plain data, so the client component and the server read the same list.
 *
 * Prices are per million tokens, input / output. A translation sends the whole
 * English article and gets the whole Thai one back, so output dominates.
 */
export type TranslateModelOption = { value: string; label: string; note?: string }

export const TRANSLATE_MODELS: readonly TranslateModelOption[] = [
  { value: 'claude-fable-5-1', label: 'Claude Fable 5.1', note: 'The most capable, and the most expensive. $10 / $50 per million tokens.' },
  { value: 'claude-opus-5-5', label: 'Claude Opus 5.5', note: 'Newest Opus, and cheaper than Opus 5. $4 / $20 per million tokens.' },
  { value: 'claude-opus-5', label: 'Claude Opus 5', note: 'The default. Natural, fluent Thai. $5 / $25.' },
  { value: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', note: 'Newest Sonnet. Close in quality, 60% cheaper than Opus 5. $2 / $10.' },
  { value: 'claude-sonnet-5', label: 'Claude Sonnet 5', note: 'Close in quality, 60% cheaper. $2 / $10.' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', note: 'Fastest and cheapest, stiffer Thai. $1 / $5.' },
]

export const DEFAULT_TRANSLATE_MODEL = 'claude-opus-5'

/** "claude-opus-5-5" → "Claude Opus 5.5", for a model the list does not name. */
export function modelLabel(id: string): string {
  const match = /^claude-([a-z]+)-(\d+(?:-\d+)?)(?:-\d{8})?$/.exec(id)
  if (!match) return id
  return `Claude ${match[1][0].toUpperCase()}${match[1].slice(1)} ${match[2].replace('-', '.')}`
}

/** What a model id may look like before it is saved: Anthropic's own shape. */
export const MODEL_ID = /^claude-[a-z0-9.-]{1,80}$/
