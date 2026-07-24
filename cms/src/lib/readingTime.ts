/**
 * Reading-time estimate from a Lexical rich-text body.
 *
 * Walks the Lexical node tree, counts words across every text node, and divides
 * by an average reading speed. Returns whole minutes (min 1), or undefined when
 * the body is empty — so an article with no body shows no read-time at all.
 *
 * Kept dependency-free and structurally typed so it can be imported both by the
 * Next data layer and by the Payload collection config (which the CLI loads).
 */

const WORDS_PER_MINUTE = 200

type LexicalNode = {
  text?: unknown
  children?: unknown
}

function collectText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as LexicalNode
  let out = ''
  if (typeof n.text === 'string') out += n.text + ' '
  if (Array.isArray(n.children)) {
    for (const child of n.children) out += collectText(child)
  }
  return out
}

/** Total words in a Lexical editor-state body. 0 when empty/unset. */
export function countWords(body: unknown): number {
  if (!body || typeof body !== 'object') return 0
  const root = (body as { root?: unknown }).root
  const text = collectText(root).trim()
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

/** Whole-minute read time (min 1), or undefined for an empty body. */
export function readingMinutes(body: unknown): number | undefined {
  const words = countWords(body)
  if (words === 0) return undefined
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}
