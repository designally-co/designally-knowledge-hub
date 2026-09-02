'use client'

import React from 'react'

/**
 * Names for the controls Payload draws without them.
 *
 * A GLYPH IN A BUTTON IS NOT A NAME. Swept the admin for interactive elements
 * with no text, no `aria-label` and no `title`, and found six kinds of them —
 * the arrows that page a list, the ⋯ on a panel, the × and ⌄ inside every
 * select, and the × that clears a date. To anything that cannot see the glyph
 * they are all "button", which is the difference between a list you can page
 * with a screen reader and one you cannot.
 *
 * Payload gives these no `aria-label` and none of them takes a prop, so the
 * names are set on the elements themselves. This is the same technique the
 * media screen uses on its three discs — see the observer in DocActions — and
 * for the same reason: the markup is not ours to render, but its attributes are
 * ours to correct.
 *
 * THE MENU IS DELIBERATELY VAGUE. A row's ⋯ opens copy, paste and clear, and
 * the same class is used for the array field's own; "More options" is the honest
 * name for a menu whose contents depend on where it is, and it is better than
 * silence. Anything this file can name precisely, it does.
 */

/** Selector → the accessible name it should carry. */
const NAMES: [string, string][] = [
  ['.clickable-arrow--left', 'Previous page'],
  ['.clickable-arrow--right', 'Next page'],
  ['.popup-button', 'More options'],
  ['.rs__clear-indicator, .clear-indicator', 'Clear selection'],
  ['.rs__dropdown-indicator, .dropdown-indicator', 'Open list'],
  ['.date-time-picker__clear-button', 'Clear date'],
]

export function A11yNames({ children }: { children?: React.ReactNode }) {
  React.useEffect(() => {
    const label = () => {
      for (const [selector, name] of NAMES) {
        for (const el of document.querySelectorAll<HTMLElement>(selector)) {
          /* Never over an existing one: a control that already says what it does
             — in whatever language the admin is running in — knows better than a
             list of English strings. */
          if (el.textContent?.trim() || el.getAttribute('aria-label')) continue
          el.setAttribute('aria-label', name)
          /* `role` too, where the element is a div. `.clear-indicator` in
             react-select is a div with a click handler, which is not reachable
             by keyboard and not announced as anything; the role at least makes
             it announce, and Payload's own key handling does the rest. */
          if (el.tagName !== 'BUTTON' && !el.getAttribute('role')) el.setAttribute('role', 'button')
        }
      }
    }

    label()
    const watch = new MutationObserver(label)
    watch.observe(document.body, { childList: true, subtree: true })
    return () => watch.disconnect()
  }, [])

  return <>{children}</>
}
