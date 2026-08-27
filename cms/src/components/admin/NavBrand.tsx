'use client'

import React from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'

import './NavBrand.css'

/**
 * The mark and the product's name, at the head of the nav.
 *
 * THE MARK IS THE PLATFORM'S FLAT ONE — the D in ink with the full stop in the
 * accent, not the D. reversed out of an orange disc. The platform made that
 * same swap for its own toolbar on 20 August 2026: beside other controls a
 * solid orange disc was the heaviest thing on the screen, and the mark fills
 * 56% of its disc where a Lucide glyph fills 45%. This nav has four glyphs
 * under it with exactly that problem.
 *
 * THE NAME IS REAL TEXT, and that is the reason this is a component at all.
 * custom.scss draws the mark as a background image for a documented reason — a
 * component must appear in the committed import map, and this repo records what
 * happens when that file is regenerated where S3 is unconfigured. That argument
 * holds for a picture. It does not hold for a word: a background image has no
 * accessible name, so the nav's only piece of branding was unreadable to a
 * screen reader, and setting the product's name in CSS `content` would leave it
 * that way while also putting a string somewhere it can never be translated.
 *
 * IT IS A LINK TO `/admin`, which is the one thing the mark did in the header
 * it replaces — Payload's own nav header is a home link.
 *
 * THE COLLAPSE CONTROL IS PORTALLED TO `<body>`. It straddles the rail's edge,
 * half outside the column, and every attempt to do that from inside the nav
 * failed on a different ancestor: `.nav__scroll` clips at `overflow: auto`, and
 * `.nav` is `position: sticky` with `overflow: hidden`, which creates a
 * stacking context that trapped the button's z-index and left its outer half
 * behind the content. Rendered at the top of the document it has no ancestor to
 * fight — `position: fixed` means the viewport, and the z-index means the page.
 *
 * THE STATE IS A CLASS ON `<body>`, for the reason the writing surface needs
 * one — the grid that sizes the column is an ANCESTOR of everything in the nav,
 * so nothing rendered inside it can reach the thing it needs to change. It is
 * remembered in `localStorage`, per browser: a collapsed rail is a preference
 * about this screen, not about the document, and Payload's own preferences are
 * keyed to collections rather than to chrome.
 */
const KEY = 'da:nav-collapsed'

export function NavBrand() {
  /* `null` until storage has been read — NOT `false`. Two bugs came out of
     defaulting it: moving between collections re-mounted this component, the
     apply-effect ran once with the default, and it both removed the class and
     WROTE "0" over the saved "1". Opening Resources from a collapsed Articles
     therefore expanded the rail and forgot the preference on the way. An
     unknown third state means the class is left exactly as it is until there is
     an answer. */
  const [collapsed, setCollapsed] = React.useState<boolean | null>(null)

  /* Read in an effect, not during render: `localStorage` does not exist on the
     server, and reading it while rendering would make the markup depend on
     something the server cannot know. */
  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(KEY) === '1')
    } catch {
      // Private modes refuse storage. The rail simply opens expanded.
      setCollapsed(false)
    }
  }, [])

  /* Applies the state and nothing else. Writing from here is what let a
     re-mount overwrite the preference; only a click writes now.

     NO CLEANUP. Removing the class on unmount is what made the rail flash open
     mid-navigation — the class belongs to the session, not to this component's
     lifetime, and the next mount reads storage and agrees with it anyway. */
  React.useEffect(() => {
    if (collapsed === null) return
    document.body.classList.toggle('da-nav-collapsed', collapsed)
  }, [collapsed])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(KEY, next ? '1' : '0')
      } catch {
        // The class still applies for this session.
      }
      return next
    })
  }

  return (
    <div className="da-brand-row">
    <Link className="da-brand" href="/admin">
      {/* TWO LAYERS MASKING ONE FILE. `designally-mark.png` is a white D. on
          transparency, so it cannot simply be recoloured — but it splits: the D
          runs to 73.79% of the width and the stop begins there, with a
          three-pixel gap between. Clipping either side of that seam gives each
          its own colour while both stay registered to the same artwork. The
          percentages are the platform's measured ones, not a redraw. */}
      <span aria-hidden="true" className="da-brand__mark">
        <i className="da-brand__d" />
        <i className="da-brand__dot" />
      </span>
      <span className="da-brand__name">Knowledge Hub</span>
    </Link>
      <CollapseToggle collapsed={collapsed} onToggle={toggle} />
    </div>
  )
}

/**
 * The collapse control, rendered at the top of the document.
 *
 * Split out so it can be portalled: see the note in NavBrand above. It reads
 * the same state and calls the same toggle.
 */
function CollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean | null
  onToggle: () => void
}) {
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => setReady(true), [])

  if (!ready) return null

  return createPortal(
    (
      <button
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
        className="da-brand__toggle"
        onClick={onToggle}
        title={collapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          viewBox="0 0 24 24"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 6 9 12l6 6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </button>
    ),
    document.body,
  )
}
