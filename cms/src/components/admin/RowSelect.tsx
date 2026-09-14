'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

import { ConfirmDialog } from './ConfirmDialog'
import './RowSelect.css'

/**
 * Deleting one row on a phone: swipe it left.
 *
 * THIS WAS SELECTION, AND ON A PHONE IT IS NOT ANY MORE. Press-and-hold used to
 * turn the list into a mode — checkboxes, a bar of bulk actions, taps that chose
 * instead of opened — so that eight articles could be deleted at once. That is
 * desk work, and on a phone the one thing actually done to a row is getting rid
 * of it. So the phone does what phone lists do everywhere else (Mail, Messages):
 * drag a row to the left and a Delete sits behind it; tap it, answer the same
 * question the document's own Delete asks, and that one row goes. The desk keeps
 * its checkboxes and the selection bar.
 *
 * THE FILE KEEPS ITS NAME so the admin's import map — generated, and guarded at
 * build time — does not have to change for a behaviour change.
 *
 * IT IS A PROVIDER because the rows are Payload's, rendered from a tree with no
 * component of ours in it, and because the drag has to be caught before the
 * row's own link turns the gesture into a navigation — which means the
 * document, in the capture phase.
 *
 * NOT ON USERS. That list holds the one account the whole team signs in as,
 * which is also the account Content Studio's API key belongs to; one mistaken
 * swipe would lock everyone out and stop publishing. It stays deletable from its
 * own screen, deliberately.
 */

const PHONE = '(max-width: 48rem)'

/* The page's own list. NOT the picker's: a sheet's table is how you choose the
   one file you came for. */
const LIST = '.template-default__wrap .collection-list'
const ROW = `${LIST} tbody tr`
const TABLES = `${LIST} .collection-list__tables`

/** How far an open row sits to the left: the width of the Delete behind it. */
const OPEN = 88
/** Past half of that on release, the row stays open; short of it, it closes. */
const SNAP = OPEN / 2
/** A drag that travels this far has declared which way it is going. */
const SLOP = 10

const NOT_SWIPEABLE = new Set(['users'])

const NOUNS: Record<string, string> = {
  articles: 'article',
  media: 'file',
  resources: 'resource',
  subscribers: 'subscriber',
}

type Target = {
  collection: string
  height: number
  id: string
  row: HTMLTableRowElement
  title: string
  top: number
}

/** The collection and id a row links to — `/admin/collections/articles/16`. */
const targetOf = (row: HTMLTableRowElement): Omit<Target, 'height' | 'row' | 'top'> | null => {
  const href = row.querySelector<HTMLAnchorElement>('a[href*="/admin/collections/"]')?.getAttribute('href')
  const match = href?.match(/\/admin\/collections\/([^/?#]+)\/([^/?#]+)/)
  if (!match || NOT_SWIPEABLE.has(match[1])) return null
  const title =
    row.querySelector('.da-row__name')?.textContent?.trim() ||
    row.querySelector('.cell-email')?.textContent?.trim() ||
    row.querySelector('a[href*="/admin/collections/"]')?.textContent?.trim() ||
    ''
  return { collection: match[1], id: decodeURIComponent(match[2]), title: title.slice(0, 120) }
}

export function RowSelect({ children }: { children?: React.ReactNode }) {
  const router = useRouter()
  const [revealed, setRevealed] = React.useState<Target | null>(null)
  const [host, setHost] = React.useState<Element | null>(null)
  const [asking, setAsking] = React.useState<Target | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  /* The open row lives in a ref as well as in state: the listeners below are
     registered once and must read the current one, not the one from the render
     that registered them. */
  const openRow = React.useRef<HTMLTableRowElement | null>(null)

  const slide = React.useCallback((row: HTMLTableRowElement | null, x: number, animate: boolean) => {
    if (!row) return
    row.toggleAttribute('data-da-swiping', !animate)
    row.style.transform = x ? `translateX(${x}px)` : ''
  }, [])

  const close = React.useCallback(() => {
    slide(openRow.current, 0, true)
    openRow.current = null
    setRevealed(null)
  }, [slide])

  React.useEffect(() => {
    const phone = () => window.matchMedia(PHONE).matches

    /* Where the Delete goes: behind the row, in the tables' own box, so it
       scrolls with the list rather than with the window. */
    const place = (row: HTMLTableRowElement): Target | null => {
      const what = targetOf(row)
      const tables = row.closest(TABLES)
      if (!what || !tables) return null
      const r = row.getBoundingClientRect()
      const t = tables.getBoundingClientRect()
      setHost(tables)
      return { ...what, height: r.height, row, top: r.top - t.top }
    }

    let drag: {
      axis: 'x' | 'y' | null
      base: number
      row: HTMLTableRowElement
      x: number
      y: number
    } | null = null
    /* A drag ends in a click, which would otherwise open the row just dragged.
       THE ROW, NOT THE NEXT CLICK ANYWHERE: a browser does not always follow a
       drag with a click, and a flag that waited for "the next click" caught the
       Cancel in the confirmation instead — measured, the dialog stayed open with
       the page still held. Only a click on the row that was dragged is eaten. */
    let swallow: HTMLTableRowElement | null = null

    const onDown = (event: PointerEvent) => {
      /* A new touch is a new gesture: whatever the last drag left to swallow is
         no longer owed. */
      swallow = null
      if (!phone()) return
      const target = event.target as Element | null
      if (target?.closest('.da-swipe__action')) return
      const row = target?.closest?.<HTMLTableRowElement>(ROW)

      /* A touch anywhere else puts an open row away. */
      if (openRow.current && row !== openRow.current) close()
      if (!row || !targetOf(row)) return

      drag = {
        axis: null,
        base: row === openRow.current ? -OPEN : 0,
        row,
        x: event.clientX,
        y: event.clientY,
      }
    }

    const onMove = (event: PointerEvent) => {
      if (!drag) return
      const dx = event.clientX - drag.x
      const dy = event.clientY - drag.y

      if (!drag.axis) {
        if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        if (drag.axis === 'y') {
          drag = null
          return
        }
        const placed = place(drag.row)
        if (!placed) {
          drag = null
          return
        }
        openRow.current = drag.row
        setRevealed(placed)
      }

      /* Left only, and a little past the Delete with resistance, so the edge is
         felt rather than hit. */
      const raw = drag.base + dx
      const x = raw > 0 ? 0 : raw < -OPEN ? -OPEN + (raw + OPEN) / 3 : raw
      slide(drag.row, x, false)
    }

    const onUp = () => {
      if (!drag) return
      const { axis, row } = drag
      drag = null
      if (axis !== 'x') return
      swallow = row
      /* Where the row actually is, read back from its own transform, rather
         than recomputed from the pointer — the resistance past the Delete means
         the two are not the same number. */
      const current = new DOMMatrixReadOnly(getComputedStyle(row).transform).m41
      if (current <= -SNAP) {
        slide(row, -OPEN, true)
        openRow.current = row
      } else {
        close()
      }
    }

    const onCancel = () => {
      if (!drag) return
      const { row } = drag
      drag = null
      if (row === openRow.current) slide(row, -OPEN, true)
      else slide(row, 0, true)
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const owed = swallow
      swallow = null
      if (!phone()) return
      if (target?.closest('.da-swipe__action')) return

      if (owed && target?.closest(ROW) === owed) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      /* A tap on the open row closes it rather than opening the document behind
         a Delete that is still showing. */
      if (openRow.current && target?.closest(ROW) === openRow.current) {
        event.preventDefault()
        event.stopPropagation()
        close()
      }
    }

    /* A NAME ON EVERY BOX, on the desk where the boxes are. Payload renders them
       with `aria-label=""`, which is not a name; the row's own title is. */
    const name = () => {
      for (const row of document.querySelectorAll<HTMLTableRowElement>(ROW)) {
        const box = row.querySelector<HTMLInputElement>('.cell-_select input[type="checkbox"]')
        if (!box || box.getAttribute('aria-label')) continue
        const what = row.querySelector('.da-row__name')?.textContent?.trim().slice(0, 60)
        box.setAttribute('aria-label', what ? `Select ${what}` : 'Select this row')
      }
    }

    /* A route change, a delete, a new page of results: the rows are replaced,
       and a Delete left behind a row that no longer exists would delete
       whatever the id pointed at. */
    const watch = new MutationObserver(() => {
      name()
      if (openRow.current && !openRow.current.isConnected) {
        openRow.current = null
        setRevealed(null)
      }
    })

    /* Leaving the phone width puts the row away: the Delete belongs to the
       phone. */
    const media = window.matchMedia(PHONE)
    const onMedia = () => close()

    /* A RESIZE MOVES THE DELETE, IT DOES NOT CLOSE THE ROW. The confirmation
       itself holds the page still (`overflow: hidden` on the body), which takes
       the scrollbar away and fires a resize — so closing here meant pressing
       Cancel also snapped the row shut, measured. A rotation changes the row's
       height and position, so the Delete is placed again instead. */
    const onResize = () => {
      if (!openRow.current) return
      if (!phone()) return close()
      const placed = place(openRow.current)
      if (placed) setRevealed(placed)
    }

    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('pointermove', onMove, true)
    document.addEventListener('pointerup', onUp, true)
    document.addEventListener('pointercancel', onCancel, true)
    document.addEventListener('click', onClick, true)
    window.addEventListener('resize', onResize)
    media.addEventListener('change', onMedia)
    watch.observe(document.body, { childList: true, subtree: true })
    name()

    return () => {
      watch.disconnect()
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('pointermove', onMove, true)
      document.removeEventListener('pointerup', onUp, true)
      document.removeEventListener('pointercancel', onCancel, true)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('resize', onResize)
      media.removeEventListener('change', onMedia)
    }
  }, [close, slide])

  const noun = asking ? NOUNS[asking.collection] || 'item' : 'item'

  const destroy = async () => {
    if (!asking || deleting) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/${asking.collection}/${encodeURIComponent(asking.id)}`, {
        credentials: 'include',
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(String(res.status))
      setAsking(null)
      close()
      /* `refresh()` so the list re-fetches rather than showing the deleted row
         out of the router cache. */
      router.refresh()
    } catch {
      setError(`That did not delete. The ${NOUNS[asking.collection] || 'item'} is unchanged.`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {children}

      {revealed && host
        ? createPortal(
            <button
              aria-label={`Delete ${revealed.title || 'this item'}`}
              className="da-swipe__action"
              onClick={() => {
                setError(null)
                setAsking(revealed)
              }}
              style={{ blockSize: revealed.height, insetBlockStart: revealed.top }}
              type="button"
            >
              <Trash2 aria-hidden="true" size={18} strokeWidth={2} />
              <span>Delete</span>
            </button>,
            host,
          )
        : null}

      <ConfirmDialog
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        description={
          error ??
          (asking?.title
            ? `“${asking.title}” will be deleted permanently.`
            : `This ${noun} will be deleted permanently.`)
        }
        onCancel={() => {
          if (deleting) return
          setAsking(null)
          setError(null)
        }}
        onConfirm={destroy}
        open={Boolean(asking)}
        title={`Delete this ${noun}?`}
      />
    </>
  )
}
