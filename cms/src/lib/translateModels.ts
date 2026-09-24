/*
 * The Claude models the Thai translation can run on, as the account screen's
 * dropdown offers them. Plain data, so the client component and the server
 * config read the same list.
 *
 * Prices are per million tokens, input / output. A translation sends the whole
 * English article and gets the whole Thai one back, so output dominates.
 */
export const TRANSLATE_MODELS = [
  { value: 'claude-opus-5-5', label: 'Claude Opus 5.5', note: 'Newest Opus, and cheaper than Opus 5. $4 / $20 per million tokens.' },
  { value: 'claude-opus-5', label: 'Claude Opus 5', note: 'The default. Natural, fluent Thai. $5 / $25.' },
  { value: 'claude-sonnet-5', label: 'Claude Sonnet 5', note: 'Close in quality, 60% cheaper. $2 / $10.' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', note: 'Fastest and cheapest, stiffer Thai. $1 / $5.' },
] as const

export const DEFAULT_TRANSLATE_MODEL = 'claude-opus-5'
