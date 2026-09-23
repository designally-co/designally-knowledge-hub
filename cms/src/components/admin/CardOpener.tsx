'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'

import './CardOpener.css'

/** Below this a list row is a card, and a card holds one record. */
const PHONE = '(max-width: 48rem)'

/**
 * Whether this is the phone's layout.
 *
 * `false` until the browser answers, because a list cell renders on the server
 * too and a desk is the safe guess: a desk's own controls for one frame on a
 * phone, rather than a phone's opener for one frame on a desk.
 */
export function useIsPhone(): boolean {
  const [phone, setPhone] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const query = window.matchMedia(PHONE)
    const read = () => setPhone(query.matches)
    read()
    query.addEventListener('change', read)
    return () => query.removeEventListener('change', read)
  }, [])

  return phone
}

/**
 * The card that opens: a transparent button stretched over the whole row, with
 * the record's state and a chevron on it.
 *
 * THE WHOLE CARD IS THE TAP TARGET, which is what a list of cards teaches a
 * thumb to expect, and it is transparent so the address underneath is still
 * what you read. A `button` rather than a handler on the `<tr>`, because Tab
 * reaches a button and Enter opens it, and neither is true of a table row.
 *
 * TWO SHAPES. `end` puts the state and the chevron at the end of the address's
 * own line, for a state that is one short word (a user's On or Off). `below`
 * puts them on a line under it, the state at the start and the chevron at the
 * far edge, for a state that is a phrase ("Pending confirmation") and would
 * crowd an email off its own line. The list's CSS reserves the room either way.
 */
export function CardOpener({
  children,
  label,
  layout = 'end',
  onOpen,
}: {
  /** The state, as it should read on the card. */
  children: React.ReactNode
  /** What a screen reader hears: the record, its state, and that it opens. */
  label: string
  layout?: 'below' | 'end'
  onOpen: () => void
}) {
  return (
    <button
      aria-haspopup="dialog"
      aria-label={label}
      className={`da-card-open da-card-open--${layout}`}
      onClick={onOpen}
      type="button"
    >
      {children}
      <ChevronRight aria-hidden="true" className="da-card-open__chevron" size={18} />
    </button>
  )
}
