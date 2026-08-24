'use client'

import { useEffect, useState } from 'react'

/**
 * Per-article triage state for the Articles list — "is this translated?" and
 * "does this have a summary?" — fetched once per list render and shared by
 * every cell that needs it.
 *
 * WHY A SEPARATE FETCH AT ALL. Neither question can be answered from the row
 * Payload already has. The list is fetched in one locale with the fallback on,
 * which is exactly what makes an untranslated article indistinguishable from a
 * translated one: it comes back wearing its English title either way. Asking
 * with `locale=all` is what separates them — an untranslated article simply has
 * no `th` key.
 *
 * WHY ONE REQUEST AND NOT ONE PER ROW. Every cell calls the same loader and
 * they all await the same in-flight promise, so ten rows cost one request, not
 * ten. `select` keeps that request to the two fields in question — critically,
 * it excludes the bodies, so the response stays a few kilobytes whatever the
 * articles grow into.
 */

export type ArticleFlags = {
  /** Published in English but with no Thai title — reading in English to a Thai visitor. */
  thaiMissing: boolean
  /** No dek, so cards and search results have nothing to show. */
  summaryMissing: boolean
}

type Localized = Record<string, string | null | undefined> | null | undefined

/* Long enough that the cells of one table share a single request; short enough
   that coming back from the editor shows what you just changed rather than
   what was true a minute ago. */
const TTL_MS = 10_000

/* Matches the dashboard's ceiling. Beyond it a row simply has no flags and
   renders blank, which is the honest outcome — better than a confident wrong
   answer from a truncated page. */
const FETCH_LIMIT = 500

let cache: { at: number; promise: Promise<Map<string, ArticleFlags>> } | null = null

function buildURL(): string {
  const p = new URLSearchParams({
    depth: '0',
    limit: String(FETCH_LIMIT),
    locale: 'all',
  })
  p.set('select[title]', 'true')
  p.set('select[summary]', 'true')
  p.set('select[status]', 'true')
  return `/api/articles?${p.toString()}`
}

const filled = (v: Localized, code: string): boolean => Boolean(v?.[code]?.trim())

async function fetchFlags(): Promise<Map<string, ArticleFlags>> {
  const map = new Map<string, ArticleFlags>()
  try {
    const res = await fetch(buildURL(), { credentials: 'include' })
    if (!res.ok) return map
    const json = (await res.json()) as { docs?: Array<Record<string, unknown>> }
    for (const doc of json.docs || []) {
      const published = doc.status === 'published'
      map.set(String(doc.id), {
        // A draft that is not translated yet is not a problem — it is not on
        // the public site to be wrong on. Only published articles can be.
        thaiMissing: published && !filled(doc.title as Localized, 'th'),
        summaryMissing: !filled(doc.summary as Localized, 'en'),
      })
    }
  } catch {
    /* Offline or logged out: no flags rather than a broken table. The columns
       render blank, which reads as "not known", not as "nothing wrong". */
  }
  return map
}

export function loadArticleFlags(): Promise<Map<string, ArticleFlags>> {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) return cache.promise
  const entry = { at: now, promise: fetchFlags() }
  cache = entry
  return entry.promise
}

export type FlagState = { ready: boolean; flags: ArticleFlags | undefined }

export function useArticleFlags(id: unknown): FlagState {
  const [state, setState] = useState<FlagState>({ ready: false, flags: undefined })

  useEffect(() => {
    let alive = true
    loadArticleFlags().then((map) => {
      if (alive) setState({ ready: true, flags: map.get(String(id)) })
    })
    return () => {
      alive = false
    }
  }, [id])

  return state
}
