'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Copy } from 'lucide-react'

import { adminDate } from './adminDate'
import { CardOpener, useIsPhone } from './CardOpener'
import { ConfirmDialog, Dialog } from './ConfirmDialog'
import './SubscriberCells.css'

/**
 * A subscriber, in the row.
 *
 * WHY THERE IS NO SUBSCRIBER SCREEN ANY MORE. Nothing on it could be edited.
 * The address is the one the person typed and confirmed, the language and the
 * page they signed up from are a record of that moment, and the status changes
 * only when they confirm or leave — the single exception being an unsubscribe
 * made on their behalf. A whole document view, opened over the list, to read
 * four facts the table already prints and press one button, is a screen that
 * exists because Payload draws documents and not because anything is decided
 * on it.
 *
 * So it follows Users: the list is the screen. The table already says who,
 * what state, which language and when; the two facts it has no column for —
 * the page they signed up from, and the unsubscribe — open into the row.
 *
 * THE ROW OPENS, NOT THE CELL. A cell that grew would push its own column down
 * and leave the address and the date floating at the top of a tall row. The
 * detail is drawn across the whole row instead, positioned against the `<tr>`,
 * with the row's cells padded to make the space. Ported from UserApiCell,
 * including the measured inset: the panel starts where the reading starts —
 * the email's column, not the checkbox gutter.
 */

type CellProps = {
  cellData?: unknown
  rowData?: Record<string, unknown>
}

const ICON = { size: 16, strokeWidth: 1.75 } as const

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending confirmation',
  subscribed: 'Subscribed',
  unsubscribed: 'Unsubscribed',
}

/* What the state means for sending, said once. The pill names the state; this
   says what follows from it, which is the part that decides what you do next. */
const STATUS_NOTES: Record<string, string> = {
  pending: 'No newsletters until they confirm their address.',
  subscribed: 'Receives every newsletter.',
  unsubscribed: 'Receives nothing. Signing up again is their way back.',
}

const asText = (value: unknown) => (typeof value === 'string' && value ? value : null)

/* The admin's one date shape, shared so a September row does not read "Sept"
   here and "Sep" in the table beside it. See adminDate. */
const asDate = (value: unknown) => adminDate(value)

/**
 * The address, and a way to copy it.
 *
 * Payload links a list's first column to the document; this collection's
 * document is now a redirect back to the list, so that link went nowhere. What
 * is actually wanted from an address in a table is the address itself — pasted
 * into a mail client, or searched for in a provider — so the link is text and
 * the verb beside it is Copy.
 */
export const SubscriberEmailCell: React.FC<CellProps> = ({ cellData }) => {
  const email = asText(cellData) ?? ''
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
    } catch {
      // The address is on screen either way; a refused clipboard is not news.
    }
  }

  return (
    <span className="da-sub-email">
      <span className="da-sub-email__value">{email}</span>
      {email ? (
        <button
          aria-label={copied ? 'Email copied' : `Copy ${email}`}
          className="da-sub-email__copy"
          onClick={copy}
          type="button"
        >
          {copied ? <Check aria-hidden="true" {...ICON} /> : <Copy aria-hidden="true" {...ICON} />}
        </button>
      ) : null}
    </span>
  )
}

export const SubscriberStatusCell: React.FC<CellProps> = ({ cellData, rowData }) => {
  const id = rowData?.id
  const router = useRouter()
  const cell = React.useRef<HTMLDivElement>(null)

  const [status, setStatus] = React.useState(asText(cellData) ?? 'pending')
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [confirming, setConfirming] = React.useState(false)
  /* ON A PHONE THE DETAIL IS A SHEET, not a panel opening inside the card. The
     card is one subscriber; its facts, its note and the one thing that can be
     done to it are a sheet's worth, and a card that grew by three hundred
     pixels pushed every subscriber under it off the screen. */
  const phone = useIsPhone()
  const [sheet, setSheet] = React.useState(false)
  const email = asText(rowData?.email) ?? ''
  const label = STATUS_LABELS[status] ?? status

  /* ALL THREE COME FROM THE ROW. `rowData` is the whole document — Payload
     hands a cell the record, not the one value its column shows — so the
     language, the sign-up path and the date are already here. None of them is
     a column any more; a subscriber's detail is short enough that fetching it
     again per row would be a request to learn what the page already knows. */
  const language = rowData?.locale === 'th' ? 'ไทย (Thai)' : 'English'
  const source = asText(rowData?.source)
  const signedUp = asDate(rowData?.createdAt)

  /* The panel is positioned against the row, and the row padded to hold it. */
  React.useEffect(() => {
    const row = cell.current?.closest('tr')
    if (!row) return
    row.classList.toggle('da-row--sub', open)
    if (open) {
      const first = row.querySelector('td:nth-child(2)') ?? row.firstElementChild
      const inset = first ? first.getBoundingClientRect().left - row.getBoundingClientRect().left : 16
      ;(row as HTMLElement).style.setProperty('--da-sub-inset', `${Math.round(inset)}px`)
    }
    return () => {
      row.classList.remove('da-row--sub')
      ;(row as HTMLElement).style.removeProperty('--da-sub-inset')
    }
  }, [open])

  const unsubscribe = async () => {
    if (!id) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/subscribers/${id}`, {
        body: JSON.stringify({ status: 'unsubscribed' }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })
      if (!res.ok) throw new Error(String(res.status))
      setStatus('unsubscribed')
      setConfirming(false)
      router.refresh()
    } catch {
      setError('Could not unsubscribe. Try again.')
    } finally {
      setBusy(false)
    }
  }

  /* The detail — written once, and shown in the row on a desk or in the sheet
     on a phone. */
  const detail = (
    <div className="da-sub-cell__detail">
      <dl className="da-sub-facts">
        <div className="da-sub-facts__row">
          <dt>Signed up from</dt>
          {/* The title carries the whole path, because the cell shows as
              much of it as fits and an ellipsis for the rest. */}
          <dd
            className={source ? 'da-sub-facts__path' : 'da-sub-facts__empty'}
            title={source ?? undefined}
          >
            {source ?? 'Not recorded'}
          </dd>
        </div>
        <div className="da-sub-facts__row">
          <dt>Language</dt>
          <dd>{language}</dd>
        </div>
        {signedUp ? (
          <div className="da-sub-facts__row">
            <dt>Signed up</dt>
            <dd>{signedUp}</dd>
          </div>
        ) : null}
      </dl>

      <div className="da-sub-cell__foot">
        <p className="da-sub-cell__note">{STATUS_NOTES[status] ?? ''}</p>
        {status !== 'unsubscribed' ? (
          <button
            className="da-sub-cell__stop"
            disabled={busy}
            onClick={() => setConfirming(true)}
            type="button"
          >
            Unsubscribe
          </button>
        ) : null}
      </div>

      {error ? <p className="da-sub-cell__error" role="alert">{error}</p> : null}
    </div>
  )

  const confirmation = (
    <ConfirmDialog
      confirmLabel="Unsubscribe"
      description="They stop receiving newsletters. The record stays, which is what keeps them off the next send — only they can sign up again."
      onCancel={() => setConfirming(false)}
      onConfirm={unsubscribe}
      open={confirming}
      title="Unsubscribe this address?"
    />
  )

  /*
   * THE CARD SAYS THE STATE AND OPENS. The state is a phrase — "Pending
   * confirmation" is 165px — so it takes the line under the address rather
   * than crowding it, with the chevron opposite at the card's edge.
   *
   * THE SHEET IS HEADED BY WHO, across the whole line. The state went in the
   * corner first, where the user sheet keeps its switch — and a 24-character
   * address beside a 110px chip broke as "browser.test@examp / le.com". So the
   * corner is empty (the sheet ends in Done; a close disc up there would be one
   * control too many) and the state opens the body instead. Unsubscribing asks
   * first, on a dialog of its own over this one, and the sheet stays behind it
   * showing the state it produced.
   */
  if (phone) {
    return (
      <div className="da-sub-cell da-sub-cell--card" ref={cell}>
        <CardOpener
          label={`${email || 'Subscriber'}: ${label}. Show details`}
          layout="below"
          onOpen={() => {
            setError(null)
            setSheet(true)
          }}
        >
          <span className={`da-sub-state da-sub-state--${status}`}>{label}</span>
        </CardOpener>

        <Dialog aside={null} onClose={() => setSheet(false)} open={sheet} title={email || 'Subscriber'}>
          <div className="da-sub-sheet">
            <span className={`da-sub-state da-sub-state--${status}`}>{label}</span>
            {detail}
            <div className="da-confirm__actions">
              <button
                className="da-confirm__button da-confirm__button--primary"
                onClick={() => setSheet(false)}
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </Dialog>

        {confirmation}
      </div>
    )
  }

  return (
    <div className="da-sub-cell" ref={cell}>
      <div className="da-sub-cell__head">
        <span className={`da-sub-state da-sub-state--${status}`}>{label}</span>
        <button
          aria-expanded={open}
          aria-label={open ? 'Hide details' : 'Show details'}
          className={`da-sub-cell__disclose${open ? ' da-sub-cell__disclose--on' : ''}`}
          onClick={() => setOpen((was) => !was)}
          type="button"
        >
          <ChevronDown aria-hidden="true" {...ICON} />
        </button>
      </div>

      {open ? detail : null}

      {confirmation}
    </div>
  )
}
