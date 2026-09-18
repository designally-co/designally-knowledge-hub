import React from 'react'

const THAI = /[฀-๿]/

/**
 * A heading that breaks where its copy breaks.
 *
 * Thai sets no spaces between words; a space in Thai copy marks the end of a
 * phrase. The browser, left to itself, wraps a Thai heading at any word
 * boundary its dictionary finds — "คิดงานออกแบบให้คม | ขึ้น เดือนละสองครั้ง",
 * cutting "ให้คมขึ้น" ("sharper") in two — so on a narrow screen the line falls
 * in the middle of a phrase while the space meant for it goes unused.
 *
 * Each phrase is set as an inline block: it moves to the next line whole, and
 * wraps inside itself only when it is wider than the line on its own. English
 * text is returned untouched — its spaces are ordinary word breaks.
 */
export function Phrases({ children }: { children: string }): React.ReactNode {
  if (!THAI.test(children) || !children.includes(' ')) return children
  return children.split(/( +)/).map((part, i) =>
    part.trim() ? (
      <span className="phrase" key={i}>
        {part}
      </span>
    ) : (
      part
    ),
  )
}
