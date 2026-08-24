import { Gutter } from '@payloadcms/ui'
import type { Payload } from 'payload'
import React from 'react'

import './Dashboard.css'

/**
 * The dashboard — "what needs you".
 *
 * Payload's stock dashboard is a grid of cards, one per collection, each of
 * which says only that the collection exists. That is a table of contents, and
 * the sidebar is already the table of contents. This replaces it with the one
 * thing a landing screen can usefully say: here is the work that is waiting.
 *
 * DESIGNED AGAINST RULES, NOT AGAINST THE DATA. Both databases hold mock
 * content, so no count measured from them is evidence of anything. Sections
 * therefore appear in a fixed order of editorial urgency rather than by size,
 * an empty section is not rendered at all, and a long one is capped and links
 * into the list. That holds whether a bucket turns out to have none or two
 * hundred in it.
 *
 * TWO QUERIES, NOT SIX. Everything below is computed in JS from one English
 * pass and one Thai pass. At roughly an article a week that is a trivial amount
 * of data, and it keeps each rule in one readable place instead of scattered
 * across half a dozen `where` clauses — including the two rules that cannot be
 * expressed as a `where` clause at all (see MISSING_THAI and the cover note).
 */

/** Generous ceiling on the two passes. ~50 articles/year, so this is years of
 *  content; if it is ever actually reached the fetch is still one page and the
 *  only casualty is that the oldest documents stop being counted. */
const FETCH_LIMIT = 500

/** Rows shown per section before it defers to the list view. */
const ROWS_SHOWN = 6

type Article = {
  id: string | number
  title?: string | null
  summary?: string | null
  status?: string | null
  tag?: string | null
  coverImage?: unknown
  coverUrl?: string | null
  updatedAt?: string | null
}

type DashboardProps = {
  payload: Payload
  user?: { name?: string | null; email?: string | null } | null
}

const rtf = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' })

function ago(iso?: string | null): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.round((then - Date.now()) / 60000)
  const abs = Math.abs(mins)
  if (abs < 60) return rtf.format(mins, 'minute')
  if (abs < 60 * 24) return rtf.format(Math.round(mins / 60), 'hour')
  if (abs < 60 * 24 * 30) return rtf.format(Math.round(mins / 1440), 'day')
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * A cover lives in EITHER of two fields: `coverImage` (an upload) or `coverUrl`
 * (a string, which is what the from-markdown endpoint sets). Checking only the
 * upload field would report every generated article as coverless. Kept here as
 * a named rule so it cannot drift apart from the one in the list view.
 *
 * Nothing currently surfaces it: a missing cover degrades to a default colour
 * on the public site rather than breaking it, which makes it a preference and
 * not a defect. Flagging preferences is how a dashboard teaches people to stop
 * reading it.
 */
export const hasCover = (a: Article): boolean => Boolean(a.coverImage || a.coverUrl?.trim())

/** Editorially required, per the redesign brief — but deliberately NOT
 *  `required: true` on the field, because `POST /api/articles/from-markdown`
 *  declares summary optional and Content Studio would start failing to publish.
 *  So the rule is enforced here, where a person can act on it. */
export const needsSummary = (a: Article): boolean => !a.summary?.trim()

export async function Dashboard({ payload, user }: DashboardProps) {
  const base = payload.config.routes?.admin || '/admin'
  const articlesURL = `${base}/collections/articles`

  const [en, th] = await Promise.all([
    payload.find({
      collection: 'articles',
      depth: 0,
      limit: FETCH_LIMIT,
      locale: 'en',
      overrideAccess: true,
      sort: '-updatedAt',
    }),
    // MISSING_THAI. Payload's locale fallback is on, so an untranslated article
    // returns its ENGLISH title under `locale: 'th'` — which is exactly why the
    // public site never shows a hole, and exactly why "is this translated?"
    // cannot be asked with a `where` clause. Turning the fallback off makes the
    // untranslated fields come back null, which is the only honest signal there
    // is. Note this detects MISSING, not STALE: an English edit made after the
    // translation leaves no trace, because `updatedAt` is per document and not
    // per locale, and the brief chose not to add a field to record it.
    payload.find({
      collection: 'articles',
      depth: 0,
      // 'none', NOT null. Payload treats a null fallbackLocale as "not
      // specified" and then applies the configured fallback anyway, so `null`
      // silently returns the English title for every article and this whole
      // section reports zero — which is exactly what it did before this was
      // caught against a database with no Thai rows at all. The sentinel that
      // actually disables the fallback is the string 'none' (or 'false' /
      // 'null'). See payload/dist/utilities/sanitizeFallbackLocale.js.
      fallbackLocale: 'none',
      limit: FETCH_LIMIT,
      locale: 'th',
      overrideAccess: true,
    }),
  ])

  const articles = en.docs as Article[]
  const thaiTitleById = new Map<string | number, string>()
  for (const doc of th.docs as Article[]) {
    thaiTitleById.set(doc.id, (doc.title || '').trim())
  }

  const drafts = articles.filter((a) => a.status !== 'published')
  const published = articles.filter((a) => a.status === 'published')
  const thaiMissing = published.filter((a) => !thaiTitleById.get(a.id))
  const incomplete = published.filter(needsSummary)
  const recent = articles.slice(0, ROWS_SHOWN)

  const sections = [
    {
      key: 'drafts',
      title: 'Drafts waiting',
      note: 'Not on the public site yet. This is where Content Studio leaves its work.',
      rows: drafts,
      href: `${articlesURL}?where[status][equals]=draft`,
    },
    {
      key: 'thai',
      title: 'Thai missing',
      note: 'Published, but reading in English to a Thai visitor.',
      rows: thaiMissing,
      // No list filter for this one: the rule needs the fallback switched off,
      // which a list-view query string cannot express. The rows are the link.
      href: null,
    },
    {
      key: 'incomplete',
      title: 'Needs a summary',
      note: 'Live without a dek, so cards and search results have nothing to show.',
      rows: incomplete,
      href: `${articlesURL}?where[summary][exists]=false`,
    },
  ].filter((s) => s.rows.length > 0)

  const firstName = user?.name?.trim()?.split(/\s+/)[0]

  /* DISTINCT articles, not the sum of the sections. One article can easily be
     a draft that also lacks a summary, and adding the sections up announced
     "46 articles waiting" over a library of 23 — a headline number larger than
     the whole collection, which discredits every other figure on the page. */
  const waiting = new Set<string | number>()
  for (const list of [drafts, thaiMissing, incomplete]) {
    for (const a of list) waiting.add(a.id)
  }
  const total = waiting.size

  return (
    <Gutter className="da-dash">
      <header className="da-dash__head">
        <p className="da-dash__eyebrow">Designally Hub</p>
        <h1 className="da-dash__title">
          {total > 0 ? 'What needs you' : firstName ? `All clear, ${firstName}` : 'All clear'}
        </h1>
        <p className="da-dash__sub">
          {total > 0
            ? `${total} ${total === 1 ? 'article' : 'articles'} waiting on a decision.`
            : 'Nothing is waiting. Recent work is below.'}
        </p>
      </header>

      {sections.map((section) => {
        const shown = section.rows.slice(0, ROWS_SHOWN)
        const rest = section.rows.length - shown.length
        return (
          <section className="da-sec" key={section.key}>
            <div className="da-sec__head">
              <h2 className="da-sec__title">{section.title}</h2>
              <span className="da-sec__count">{section.rows.length}</span>
            </div>
            <p className="da-sec__note">{section.note}</p>
            <ul className="da-rows">
              {shown.map((a) => (
                <li key={a.id}>
                  <a className="da-row" href={`${articlesURL}/${a.id}`}>
                    <span className="da-row__title">{a.title || 'Untitled'}</span>
                    <span className="da-row__meta">
                      {a.tag ? <span className="da-row__tag">{a.tag}</span> : null}
                      <span className="da-row__when">{ago(a.updatedAt)}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            {rest > 0 ? (
              section.href ? (
                <a className="da-sec__more" href={section.href}>
                  {rest} more
                </a>
              ) : (
                <p className="da-sec__more da-sec__more--flat">{rest} more</p>
              )
            ) : null}
          </section>
        )
      })}

      <section className="da-sec da-sec--quiet">
        <div className="da-sec__head">
          <h2 className="da-sec__title">Recently edited</h2>
        </div>
        <ul className="da-rows">
          {recent.map((a) => (
            <li key={a.id}>
              <a className="da-row" href={`${articlesURL}/${a.id}`}>
                <span className="da-row__title">{a.title || 'Untitled'}</span>
                <span className="da-row__meta">
                  <span className="da-row__when">{ago(a.updatedAt)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <nav className="da-dash__elsewhere" aria-label="Elsewhere">
        <a href={`${articlesURL}/create`}>Write an article</a>
        <a href={`${base}/collections/resources`}>Resources</a>
        <a href={`${base}/collections/media`}>Media</a>
        <a href={`${base}/collections/users`}>Users</a>
      </nav>
    </Gutter>
  )
}
