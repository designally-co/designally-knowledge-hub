'use client'

import React from 'react'
import { useListQuery } from '@payloadcms/ui'

import './MediaUsage.css'

/**
 * All files, or only the ones nothing uses — the media library's one filter.
 *
 * WHY IT EXISTS. Every publish from Article Studio used to file its cover as a
 * new row, so by October 2026 the library held each picture two, three and
 * four times under the same name, with only one of each on an article. The
 * Hub no longer does that (endpoints/mediaFromUrl, the Articles hooks), but
 * the copies already made are still here, and nothing on the card says which
 * of two identical pictures is the one in use. "Unused" answers that: the
 * list narrows to the files no article (draft or published), resource or body
 * points at, and deleting them is Payload's own select-and-delete, with its
 * confirmation. This control only shows; it never deletes.
 *
 * THE SERVER DECIDES WHAT "UNUSED" MEANS (endpoints/mediaUnused, which reads
 * lib/mediaUsage). The list is then filtered to those ids, so the view is a
 * snapshot taken when you press it — press it again to take a new one.
 *
 * DESK ONLY. A tidy-up done over a shelf of pictures is a desk job, and the
 * phone's header line is already full (see LocaleSwitch for what it costs).
 */

/** The ids the list is filtered to by this control, or null when it is not. */
function filteredIds(where: unknown): unknown[] | null {
  if (!where || typeof where !== 'object') return null
  const record = where as Record<string, unknown>
  const id = record.id as { in?: unknown } | undefined
  if (id && Array.isArray(id.in)) return id.in
  for (const value of Object.values(record)) {
    const found = Array.isArray(value)
      ? value.map(filteredIds).find((ids) => ids !== null) ?? null
      : filteredIds(value)
    if (found) return found
  }
  return null
}

async function fetchUnused(): Promise<number[] | null> {
  try {
    const res = await fetch('/api/media/unused', { cache: 'no-store', credentials: 'include' })
    if (!res.ok) return null
    const json = (await res.json()) as { ids?: number[] }
    return Array.isArray(json.ids) ? json.ids : null
  } catch {
    return null
  }
}

export function MediaUsage() {
  const { data, handleWhereChange, query } = useListQuery()
  const active = filteredIds(query?.where) !== null

  const [count, setCount] = React.useState<number | null>(null)
  const [busy, setBusy] = React.useState(false)

  /* Counted again whenever the list changes size — after a delete, the number
     on the button should already be the new one. */
  const total = data?.totalDocs
  React.useEffect(() => {
    let live = true
    void fetchUnused().then((ids) => {
      if (live) setCount(ids ? ids.length : null)
    })
    return () => {
      live = false
    }
  }, [total])

  const showUnused = async () => {
    if (busy) return
    setBusy(true)
    const ids = await fetchUnused()
    setBusy(false)
    if (!ids) return
    setCount(ids.length)
    /* An empty `in` is not "nothing" to every database adapter, so no unused
       files is asked for as an id that cannot exist: an empty list, honestly. */
    await handleWhereChange?.({ id: { in: ids.length ? ids : [0] } })
  }

  const showAll = async () => {
    await handleWhereChange?.({})
  }

  return (
    <div aria-label="Show" className="da-usage" role="group">
      <button
        aria-pressed={!active}
        className={`da-usage__opt${active ? '' : ' da-usage__opt--on'}`}
        onClick={() => void (active ? showAll() : undefined)}
        type="button"
      >
        All
      </button>
      <button
        aria-busy={busy || undefined}
        aria-pressed={active}
        className={`da-usage__opt${active ? ' da-usage__opt--on' : ''}`}
        onClick={() => void showUnused()}
        title="Files no article or resource uses, drafts included"
        type="button"
      >
        Unused{count !== null ? <span className="da-usage__count">{count}</span> : null}
      </button>
    </div>
  )
}
