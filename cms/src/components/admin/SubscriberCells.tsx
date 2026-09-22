'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Copy } from 'lucide-react'

import { ConfirmDialog } from './ConfirmDialog'
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

const asDate = (value: unknown) => {
  const text = asText(value)
  if (!text) return null
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

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

/**
 * When they signed up.
 *
 * The date a row was written is the moment someone submitted the form, so the
 * column says "Signed up" rather than "Created at".
 *
 * IT READS THE ROW, NOT THE CELL. The column is a `ui` field, and Payload hands
 * a cell `doc[field.name]` — here `doc.signedUp`, which no subscriber has. The
 * date has to come from the document itself.
 */
export const SubscriberSignedUpCell: React.FC<CellProps> = ({ rowData }) => (
  <span className="da-sub-date">{asDate(rowData?.createdAt) ?? '—'}</span>
)

export const SubscriberStatusCell: React.FC<CellProps> = ({ cellData, rowData }) => {
  const id = rowData?.id
  const router = useRouter()
  const cell = React.useRef<HTMLDivElement>(null)

  const [status, setStatus] = React.useState(asText(cellData) ?? 'pending')
  const [open, setOpen] = React.useState(false)
  const [source, setSource] = React.useState<string | null | undefined>(undefined)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [confirming, setConfirming] = React.useState(false)

  const locale = rowData?.locale === 'th' ? 'ไทย (Thai)' : 'English'
  const signedUp = asDate(rowData?.createdAt)

  /* `source` is not a column — a path per row would crowd out the four facts
     that matter — so it is fetched for the row that is open, and only that. */
  React.useEffect(() => {
    if (!open || !id || source !== undefined) return
    let live = true
    void (async () => {
      try {
        const res = await fetch(`/api/subscribers/${id}?depth=0`, { credentials: 'include' })
        if (!res.ok) return
        const doc = (await res.json()) as { source?: unknown }
        if (live) setSource(asText(doc.source))
      } catch {
        if (live) setSource(null)
      }
    })()
    return () => {
      live = false
    }
  }, [id, open, source])

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

  return (
    <div className="da-sub-cell" ref={cell}>
      <div className="da-sub-cell__head">
        <span className={`da-sub-state da-sub-state--${status}`}>{STATUS_LABELS[status] ?? status}</span>
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

      {open ? (
        <div className="da-sub-cell__detail">
          <dl className="da-sub-facts">
            <div className="da-sub-facts__row">
              <dt>Signed up from</dt>
              <dd className={source ? 'da-sub-facts__path' : 'da-sub-facts__empty'}>
                {source === undefined ? 'Loading…' : source ?? 'Not recorded'}
              </dd>
            </div>
            <div className="da-sub-facts__row">
              <dt>Language</dt>
              <dd>{locale}</dd>
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
      ) : null}

      <ConfirmDialog
        confirmLabel="Unsubscribe"
        description="They stop receiving newsletters. The record stays, which is what keeps them off the next send — only they can sign up again."
        onCancel={() => setConfirming(false)}
        onConfirm={unsubscribe}
        open={confirming}
        title="Unsubscribe this address?"
      />
    </div>
  )
}
