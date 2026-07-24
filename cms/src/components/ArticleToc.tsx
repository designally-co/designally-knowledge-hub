'use client'
import React from 'react'

/**
 * Table of contents for an article. Reads the rendered body's H2/H3 headings
 * from the DOM (so ids always match what Payload's Lexical renderer output),
 * assigns each an anchor id, and renders a clickable, scroll-synced list.
 */
type TocItem = { id: string; text: string; level: 2 | 3 }

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  )
}

export function ArticleToc() {
  const [items, setItems] = React.useState<TocItem[]>([])
  const [activeId, setActiveId] = React.useState<string>('')

  React.useEffect(() => {
    const headings = Array.from(
      document.querySelectorAll<HTMLHeadingElement>('.article-body h2, .article-body h3'),
    )

    const seen = new Map<string, number>()
    const list: TocItem[] = headings.map((h) => {
      const text = h.textContent?.trim() ?? ''
      const base = slugify(text)
      const n = seen.get(base) ?? 0
      seen.set(base, n + 1)
      const id = n === 0 ? base : `${base}-${n}`
      if (!h.id) h.id = id
      return { id: h.id, text, level: h.tagName === 'H3' ? 3 : 2 }
    })
    setItems(list)

    if (headings.length === 0) return

    // Scroll-spy: highlight the section currently in view.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    )
    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [])

  if (items.length === 0) return null

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    history.replaceState(null, '', `#${id}`)
    setActiveId(id)
  }

  return (
    <nav className="article-toc" aria-label="On this page">
      <p className="article-toc__label">On this page</p>
      <ul className="article-toc__list">
        {items.map((it) => (
          <li
            key={it.id}
            className={`article-toc__item article-toc__item--h${it.level}${
              activeId === it.id ? ' is-active' : ''
            }`}
          >
            <a className="article-toc__link" href={`#${it.id}`} onClick={(e) => go(e, it.id)}>
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
