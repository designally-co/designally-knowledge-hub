'use client'

import React from 'react'

import { Icon } from './ds'

/**
 * A footer link column that collapses on a phone.
 *
 * The two lists are thirteen stacked links, which is most of the footer's
 * height on mobile and pushes the wordmark, the copyright and the social
 * accounts far below the fold. Behind a tap they are two rows.
 *
 * Both the heading and the button are rendered and the breakpoint picks one:
 * `display: none` takes the other out of the accessibility tree entirely, so a
 * screen reader never meets a collapse control on a layout where nothing
 * collapses, or an `aria-expanded` that contradicts what is on screen. The
 * links themselves are in the markup either way — collapsed is a matter of
 * height, not of presence, so crawlers and no-JS readers still find them.
 */
export function FooterNavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const panelId = React.useId()

  return (
    <nav className="footer-group" aria-label={label}>
      <p className="site-footer__label footer-group__heading">{label}</p>

      <button
        type="button"
        className="footer-group__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{label}</span>
        <Icon name="chevron-down" size={22} className="footer-group__caret" />
      </button>

      <div className={`footer-group__panel${open ? ' is-open' : ''}`} id={panelId}>
        <div className="footer-group__panel-inner">{children}</div>
      </div>
    </nav>
  )
}
