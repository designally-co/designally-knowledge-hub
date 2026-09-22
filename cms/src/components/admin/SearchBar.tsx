'use client'

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useListQuery } from '@payloadcms/ui'
import gsap from 'gsap'
import { Search, X } from 'lucide-react'

import { MOTION, duration } from './motion'
import './SearchBar.css'

/**
 * The phone's search — Content Studio's `LibraryBar`, ported whole.
 *
 * WHAT THIS REPLACES. The disc was CSS alone: Payload's own field pinned into
 * the header at 44px and grown to the line by `:focus-within`, with the state
 * being focus itself. It got the shape right and could not get anything else —
 * no way out but tapping the list behind it, no way to clear a term but
 * selecting the text and deleting it, and a width transition where Studio has
 * a field unrolling from the disc it came out of. Those are the two things
 * asked for here, and both of them need a component: a close button is markup,
 * and the fold is a tween with a callback after it.
 *
 * IT TYPES INTO PAYLOAD'S FIELD RATHER THAN CALLING PAYLOAD'S QUERY, and that
 * is the whole architecture of this file.
 *
 * It called `handleSearchChange` directly first — the same call Payload's
 * `SearchFilter` makes — and clearing the term did not stick: the list came
 * back unfiltered and the URL went straight back to `?search=koto`. Payload's
 * field is HIDDEN below 48rem, not unmounted, so its effects are still running,
 * and it holds its own copy of the term. When the URL lost `search`, its sync
 * effect read `searchParam === previousSearch` (both now undefined), decided
 * nothing had changed, kept `koto` in its state — and its debounce then wrote
 * `koto` back. Two owners of one query, and the hidden one won.
 *
 * So there is one owner, and it is Payload's. This field is the phone's face
 * for it: every keystroke is written into `#search-filter-input` with the
 * native value setter and an `input` event, which is what React listens for, and
 * Payload does the debounce, the URL and the refetch exactly as it does on the
 * desk. Nothing here races it because nothing here writes the query.
 *
 * PHONE ONLY. The desk row has the width for a field standing open beside the
 * language button and Create, and that row is untouched — this is display:none
 * above 48rem, the way Studio's bar is `lg:hidden`.
 */

/* The field clipped to its right end — the width of the disc it opens from —
   and the field in full. Both round, so the clip keeps the pill's shape at
   every frame between them. The left inset is measured rather than written:
   Studio's bar is a known width and could say 88%, and this one spans whatever
   the phone is. */
const DISC = 44
const IN_FULL = 'inset(0% 0% 0% 0% round 999px)'

function asDisc(field: HTMLElement): string {
  const width = field.offsetWidth || DISC
  const left = Math.max(0, 100 - (DISC / width) * 100)
  return `inset(0% 0% 0% ${left}% round 999px)`
}

/**
 * Put a term into Payload's own search field, the way a person would.
 *
 * The native setter, then an `input` event: React tracks an input's value on
 * the DOM node and ignores an event whose value it thinks it already has, so
 * assigning `input.value` alone updates the box and tells React nothing.
 */
function typeInto(term: string): boolean {
  const input = document.getElementById('search-filter-input')
  if (!(input instanceof HTMLInputElement)) return false

  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (!setter) return false

  setter.call(input, term)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  return true
}

export function SearchBar() {
  const { handleSearchChange, query } = useListQuery()

  const param = typeof query?.search === 'string' ? query.search : ''
  const [value, setValue] = useState(param)
  /* Open if a term is already running, so arriving on a filtered link — the
     back button, a bookmark, a locale switch — shows you what is filtering the
     list rather than a short list with no stated reason for being short. */
  const [open, setOpen] = useState(param !== '')

  /* Adopted during render rather than in an effect, so a query that changed
     underneath the box never paints stale for a frame. Only a value we did not
     cause: Payload's debounced change lands back here 300ms after the keystroke
     that caused it, and taking that would overwrite the box with what was typed
     300ms ago. */
  const [lastParam, setLastParam] = useState(param)
  if (param !== lastParam) {
    setLastParam(param)
    if (param !== value.trim()) setValue(param)
  }

  /* The box shows what you typed immediately; Payload's field gets the same
     text and owns everything that happens next. The direct call is the fallback
     for a list rendered without Payload's bar at all — there is none today, and
     a search that silently does nothing would be worse than a duplicated one. */
  const put = useCallback(
    (term: string) => {
      setValue(term)
      if (!typeInto(term)) void handleSearchChange?.(term.trim())
    },
    [handleSearchChange],
  )

  /*
   * THE MOTION, which is the reason the disc and the field are one element
   * rather than two.
   *
   * OPENING GROWS LEFTWARD FROM THE DISC. The field is the disc spread across
   * the line, so it starts where the disc was — clipped to the bar's right end
   * — and uncovers toward the menu button, decelerating into place.
   *
   * CLOSING FOLDS IT BACK, THEN THE DISC RETURNS. The field accelerates into
   * the right end, and only once it has gone does the bar hand the line back —
   * so `close` takes the state change as a callback rather than making it
   * itself, or the field would vanish and animate nothing.
   */
  const bar = useRef<HTMLDivElement>(null)
  /* The state last animated to. Compared rather than counted, so the first
     render — and React's development double-run of effects — animates nothing:
     a list arriving with a term in it is not a search opening. */
  const shown = useRef(open)

  useLayoutEffect(() => {
    if (shown.current === open) return
    shown.current = open

    const node = bar.current?.querySelector<HTMLElement>(
      open ? '[data-search-field]' : '[data-search-disc]',
    )
    if (!node) return

    if (open) {
      /* THE CLIP ALONE, WITH NO `autoAlpha` — unlike the close below, and
         unlike Studio, whose field fades in because it is replacing a title
         that is fading out on the same line.
         `autoAlpha: 0` sets `visibility: hidden`, and a hidden element cannot
         hold focus: React focuses the fresh input during the same commit this
         effect runs in, GSAP hid its wrapper a moment later, and the field
         opened with no caret and no keyboard. There is nothing for the fade to
         do here in any case. The clip starts as a 44px circle exactly where
         the disc was, so what opens is the disc itself, unrolling. */
      gsap.fromTo(
        node,
        { clipPath: asDisc(node) },
        {
          clipPath: IN_FULL,
          duration: duration(MOTION.CONTENT),
          ease: MOTION.EASE_ENTER,
          clearProps: 'clipPath',
        },
      )
    } else {
      gsap.fromTo(
        node,
        { autoAlpha: 0, y: -4 },
        {
          autoAlpha: 1,
          y: 0,
          duration: duration(MOTION.CONTENT),
          ease: MOTION.EASE_ENTER,
          clearProps: 'transform,opacity,visibility',
        },
      )
    }
  }, [open])

  const close = useCallback(() => {
    /* EMPTYING THE FIELD IS THE WHOLE OF IT — and emptying it means emptying
       Payload's, which is the one that decides what the list shows. */
    const done = () => {
      setOpen(false)
      put('')
    }

    const field = bar.current?.querySelector<HTMLElement>('[data-search-field]')
    if (!field) {
      done()
      return
    }

    gsap.to(field, {
      clipPath: asDisc(field),
      autoAlpha: 0,
      duration: duration(MOTION.EXIT),
      ease: MOTION.EASE_EXIT,
      overwrite: 'auto',
      onComplete: done,
    })
  }, [put])

  return (
    <div className={`da-search${open ? ' da-search--open' : ''}`} ref={bar}>
      {open ? (
        /* `position: relative` on the wrapper, so the X is placed against the
           pill rather than after it — which is what the field's trailing
           padding reserves the room for. */
        <div className="da-search__field" data-search-field>
          <Search aria-hidden className="da-search__glass" size={16} />
          <input
            aria-label="Search by title"
            autoFocus
            className="da-search__input"
            onChange={(event) => put(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                close()
              }
            }}
            placeholder="Search by Title"
            type="text"
            value={value}
          />
          <button
            aria-label="Close search"
            className="da-search__close"
            onClick={close}
            type="button"
          >
            <X aria-hidden size={16} />
          </button>
        </div>
      ) : (
        /* White, not accent. Search commits nothing — it narrows a list — and
           the accent belongs to Create. It matches the menu button at the other
           end of the same line. */
        <button
          aria-label="Search"
          className="da-search__disc"
          data-search-disc
          onClick={() => setOpen(true)}
          type="button"
        >
          <Search aria-hidden size={20} />
        </button>
      )}
    </div>
  )
}
