'use client'

import React from 'react'

import './RowSelect.css'

/**
 * Selecting several rows on a phone.
 *
 * THE COLUMN IS GONE ON PURPOSE. A list on a phone is one column — the picture
 * and the name — because the four columns come to 726px and the screen is 375.
 * The checkbox went with the rest: it cost 53px of a 284px table to sit there
 * in case you wanted to choose eight things and delete them, which is desk
 * work. But "not worth a permanent column" is not the same as "impossible", and
 * with the column gone there was no way to select anything at all.
 *
 * SO SELECTION IS A MODE, NOT A COLUMN. Press and hold a row: the checkboxes
 * appear, that row is chosen, and Payload's own selection bar comes up from the
 * bottom with Select all, Edit and Delete already in it. While the mode is on, a
 * tap chooses a row instead of opening it. Deselect the last one and the mode
 * ends by itself — the list has nothing to act on, so there is nothing to stay
 * in. This is what a phone list does everywhere else: Photos, Mail, Files.
 *
 * IT IS A PROVIDER because the rows are Payload's, rendered from a tree with no
 * component of ours in it, and because the gesture has to be caught before the
 * row's own link turns the press into a navigation — which means the document,
 * in the capture phase.
 */

const PHONE = '(max-width: 48rem)'
const MODE = 'da-selecting'

/** Long enough not to fire on a scroll flick, short enough to feel deliberate. */
const HOLD = 450
/** A press that travels this far was a scroll. */
const SLOP = 10

/* The page's own list. NOT the picker's: a sheet's table is how you choose the
   one file you came for, and a press-and-hold there would start a second kind
   of selection on top of it. */
const LIST = '.template-default__wrap .collection-list'
const ROW = `${LIST} tbody tr`

export function RowSelect({ children }: { children?: React.ReactNode }) {
  React.useEffect(() => {
    const phone = () => window.matchMedia(PHONE).matches
    const rows = () => [...document.querySelectorAll<HTMLTableRowElement>(ROW)]
    const boxOf = (row: Element | null) =>
      row?.querySelector<HTMLInputElement>('.cell-_select input[type="checkbox"]') ?? null
    const anyChecked = () => rows().some((row) => boxOf(row)?.checked)

    const on = () => document.body.classList.contains(MODE)
    const enter = () => document.body.classList.add(MODE)
    const leave = () => document.body.classList.remove(MODE)

    let timer: number | null = null
    let from: { x: number; y: number } | null = null
    /* A completed hold ends in a click, which would otherwise open the row it
       just selected. */
    let swallow = false

    const disarm = () => {
      if (timer) window.clearTimeout(timer)
      timer = null
      from = null
    }

    /* Read AFTER React has had the toggle: `input.click()` flips the DOM
       immediately, but what matters is the state Payload keeps once its own
       handler has run. */
    const settle = () =>
      window.setTimeout(() => {
        if (on() && !anyChecked()) leave()
      }, 0)

    const onDown = (event: PointerEvent) => {
      if (!phone()) return
      const row = (event.target as Element | null)?.closest?.(ROW)
      if (!row) return

      from = { x: event.clientX, y: event.clientY }
      timer = window.setTimeout(() => {
        timer = null
        swallow = true
        enter()
        const box = boxOf(row)
        if (box && !box.checked) box.click()
      }, HOLD)
    }

    const onMove = (event: PointerEvent) => {
      if (!from) return
      if (Math.abs(event.clientX - from.x) > SLOP || Math.abs(event.clientY - from.y) > SLOP) disarm()
    }

    const onClick = (event: MouseEvent) => {
      if (!phone()) return

      if (swallow) {
        swallow = false
        event.preventDefault()
        event.stopPropagation()
        return
      }

      if (!on()) return

      const target = event.target as Element | null
      const row = target?.closest?.(ROW)
      if (!row) return
      /* A tap on the checkbox is already a tap on the checkbox. */
      if (target?.closest('.cell-_select')) {
        settle()
        return
      }

      event.preventDefault()
      event.stopPropagation()
      boxOf(row)?.click()
      settle()
    }

    /* iOS offers to select the words under a long press. Not on a row that is
       about to become a selection of its own. */
    const onContext = (event: MouseEvent) => {
      if (!phone() || !(timer || on())) return
      if (!(event.target as Element | null)?.closest?.(ROW)) return
      event.preventDefault()
    }

    /* AND A NAME ON EVERY BOX. Payload renders them with `aria-label=""`, which
       is not a name — it is the absence of one, spelled out. A screen reader
       met a column of unlabelled checkboxes with no way to tell which row each
       belonged to. The row's own title is the answer and it is right there. */
    const name = () => {
      for (const row of rows()) {
        const box = boxOf(row)
        if (!box || box.getAttribute('aria-label')) continue
        /* `.da-row__name`, not the whole cell: the cell also holds the "Needs
           description" flag, and reading the two together announced "Select
           office-placeholder-1.pngNeeds description". */
        const what = row.querySelector('.da-row__name')?.textContent?.trim().slice(0, 60)
        box.setAttribute('aria-label', what ? `Select ${what}` : 'Select this row')
      }
    }

    /* A route change, a delete, a new page of results: the rows are replaced
       and nothing is selected any more, so the mode has nothing left to be
       about. */
    const watch = new MutationObserver(() => {
      name()
      if (on() && !anyChecked()) leave()
    })

    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('pointermove', onMove, true)
    document.addEventListener('pointerup', disarm, true)
    document.addEventListener('pointercancel', disarm, true)
    document.addEventListener('click', onClick, true)
    document.addEventListener('contextmenu', onContext)
    watch.observe(document.body, { childList: true, subtree: true })
    name()

    return () => {
      disarm()
      watch.disconnect()
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('pointermove', onMove, true)
      document.removeEventListener('pointerup', disarm, true)
      document.removeEventListener('pointercancel', disarm, true)
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('contextmenu', onContext)
      leave()
    }
  }, [])

  return <>{children}</>
}
