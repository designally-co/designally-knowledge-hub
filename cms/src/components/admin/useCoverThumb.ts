'use client'

import React from 'react'
import { useConfig } from '@payloadcms/ui'

/**
 * The thumbnail for an article's uploaded cover, in a list that cannot fetch it.
 *
 * PAYLOAD'S LIST VIEW FETCHES AT `depth: 0`, HARDCODED — `@payloadcms/next`'s
 * List view passes it literally, so there is no config that changes it. A
 * relationship therefore arrives as a bare id, and an upload has no `url`
 * attached. The Articles list read `coverUrl` instead, a plain string that
 * Content Studio used to set, and fell back to a lettered tile otherwise.
 *
 * Content Studio now uploads into the Hub's media library and sets `coverImage`,
 * the relationship — which is the better thing to set, since it is what gives
 * the public page real dimensions and responsive derivatives. But it left the
 * list with an id it could not resolve, so every row showed a letter.
 *
 * ONE REQUEST PER PAGE OF ROWS, NOT ONE PER ROW. Every mounted cell drops its id
 * into a shared set; the first one to do so schedules a flush on the microtask
 * queue, so a rendered page of ten rows resolves as a single `where[id][in]`
 * query. That is the objection the lettered fallback was built to avoid — a
 * request per row, per page — and batching is what answers it rather than
 * accepting the letter.
 *
 * RESULTS ARE CACHED FOR THE SESSION, INCLUDING MISSES. A id that resolves to
 * nothing is stored as `null` so that paging back and forth does not re-ask a
 * question already answered, and a failed request degrades to exactly the tile
 * that was there before.
 */

const cache = new Map<number, string | null>()
const pending = new Set<number>()
/* Asked for, not yet answered. Without this an id is re-requested by any cell
   that mounts while the first request is still open — which React's development
   double-invoke does on every single row. */
const inflight = new Set<number>()
const listeners = new Set<() => void>()
let scheduled = false

function announce() {
  for (const listener of listeners) listener()
}

async function flush(api: string) {
  const ids = [...pending]
  pending.clear()
  scheduled = false
  if (ids.length === 0) return
  for (const id of ids) inflight.add(id)

  try {
    const query = `where[id][in]=${ids.join(',')}&depth=0&limit=${ids.length}`
    const res = await fetch(`${api}/media?${query}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    const json = res.ok ? ((await res.json()) as { docs?: MediaDoc[] }) : null

    for (const doc of json?.docs ?? []) {
      if (typeof doc?.id !== 'number') continue
      /* The 400px derivative the collection already generates and the admin
         already uses for its own thumbnails — not the 1800px hero. */
      const url = doc.sizes?.thumbnail?.url || doc.url || null
      cache.set(doc.id, url)
    }
  } catch {
    /* Deliberately silent: a cover is decoration in this column, and a row that
       cannot show one still shows its name, its tag and its status. */
  }

  /* Anything the response did not account for is a miss, recorded so it is not
     asked for again on every re-render. */
  for (const id of ids) {
    if (!cache.has(id)) cache.set(id, null)
    inflight.delete(id)
  }
  announce()
}

type MediaDoc = {
  id?: number
  url?: string | null
  sizes?: { thumbnail?: { url?: string | null } | null } | null
}

/** The media id an article row carries, whatever shape it arrives in. */
export function coverImageId(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  if (value && typeof value === 'object') {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'number') return id
  }
  return null
}

export function useCoverThumb(id: number | null): string | null {
  const { config } = useConfig()
  const api = `${config.serverURL ?? ''}${config.routes?.api ?? '/api'}`
  const [, rerender] = React.useReducer((n: number) => n + 1, 0)

  React.useEffect(() => {
    if (id === null || cache.has(id)) return

    /* Subscribe either way: an id already in flight still needs this cell to
       re-render when the answer arrives. */
    listeners.add(rerender)
    if (!inflight.has(id)) {
      pending.add(id)
      if (!scheduled) {
        scheduled = true
        queueMicrotask(() => void flush(api))
      }
    }
    return () => {
      listeners.delete(rerender)
    }
  }, [api, id])

  return id === null ? null : (cache.get(id) ?? null)
}
