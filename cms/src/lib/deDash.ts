/**
 * Remove em dashes (and other "AI-tell" dashes) from generated prose.
 *
 * The same rule Article Studio applies to everything it writes (its
 * `src/lib/text.ts`), so an article reads the same in both languages: an em
 * dash or horizontal bar becomes a comma, a spaced en dash becomes a comma,
 * and a line-leading dash (quote attribution) is dropped. ASCII hyphens and
 * numeric en-dash ranges (2020–2024) are left alone, so Markdown rules, tables
 * and ranges survive.
 *
 * A net under the translator's own instruction, not a replacement for it.
 */
export function deDash(text: string): string {
  return text
    .replace(/(^|\n)([>*+-][ \t]+)?[ \t]*[—―–][ \t]+/g, '$1$2')
    .replace(/\s*[—―]\s*/g, ', ')
    .replace(/\s+–\s+/g, ', ')
    .replace(/ +,/g, ',')
    .replace(/,\s*,/g, ', ')
    .replace(/,(\s*[.!?;:])/g, '$1')
}
