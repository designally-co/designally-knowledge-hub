'use client'

import React from 'react'

import { Icon } from './ds'

/**
 * The article's sources, as chips carrying each site's own favicon.
 *
 * A reference list is scanned rather than read — a reader is checking who is
 * being cited, not working through prose — so this is a row of recognisable
 * marks rather than a stack of underlined URLs. It sits ABOVE the share block,
 * because deciding whether to pass an article on is a judgement made after
 * seeing where it came from.
 *
 * Collapsible, and open by default: hiding sources by default would make the
 * article look unsourced, which is the opposite of the point. The toggle is
 * there for a long list, not to tuck them away.
 */

type Reference = { label: string; url: string }

/**
 * The favicon, from Google's service.
 *
 * Fetching `https://<host>/favicon.ico` directly is unreliable — plenty of
 * sites do not serve one at the root, and the ones that do return whatever
 * size they like. This normalises both.
 *
 * TRADE-OFF, stated rather than buried: it means the reader's browser makes a
 * request to Google for every reference on the page. If that is not wanted,
 * the alternative is to fetch and store these on publish, so they are served
 * from the Hub's own media — more work, no third party.
 */
const faviconFor = (url: string): string | null => {
  try {
    const { hostname } = new URL(url)
    return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(hostname)}`
  } catch {
    return null
  }
}

const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function ArticleReferences({
  references,
  heading,
}: {
  references: Reference[]
  heading: string
}) {
  const [open, setOpen] = React.useState(true)
  const panelId = React.useId()

  if (!references.length) return null

  return (
    <section className="article-refs">
      <div className="article-refs__head">
        <h2 className="article-refs__title">{heading}</h2>
        <button
          aria-controls={panelId}
          aria-expanded={open}
          className="article-refs__toggle"
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          <span className="visually-hidden">{heading}</span>
          <Icon className="article-refs__caret" name="chevron-down" size={20} />
        </button>
      </div>

      <div className={`article-refs__panel${open ? ' is-open' : ''}`} id={panelId}>
        <div className="article-refs__panel-inner">
          <ul className="article-refs__list">
            {references.map((ref, i) => {
              const icon = faviconFor(ref.url)
              return (
                <li key={`${ref.url}-${i}`}>
                  <a
                    className="article-refs__chip"
                    href={ref.url}
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    title={`${ref.label} — ${hostOf(ref.url)}`}
                  >
                    <span className="article-refs__mark" aria-hidden="true">
                      {icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" height={16} loading="lazy" src={icon} width={16} />
                      ) : null}
                    </span>
                    <span className="article-refs__label">{ref.label}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
