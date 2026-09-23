'use client'

import React from 'react'
import { Check, ChevronDown, ChevronRight, Copy, Eye, EyeOff } from 'lucide-react'

import { ConfirmDialog, Dialog } from './ConfirmDialog'
import { Switch } from './Switch'
import './UserApiCell.css'

/**
 * API access, in the row.
 *
 * WHY THERE IS NO USER SCREEN ANY MORE. A user here is not a person's profile —
 * every account arrives through Google sign-in, the email is the Google
 * account's and editing it changes nothing anyone can sign in with, and a
 * password can never be used (`POST /api/users/login` is refused outright).
 * What is actually decided about a user is one thing: whether they hold a key
 * Content Studio can publish with. A whole screen to reach one switch, through
 * a form of fields that must not be touched, is a screen that exists because
 * Payload draws documents rather than because anything is edited on it.
 *
 * So the decision moves to where the accounts are listed. The column used to
 * print "true" — the only raw value left in these tables, and a word that
 * answers a question nobody asked in those terms. It is the switch now, and
 * turning it on opens the row onto the key itself.
 *
 * IT WRITES THROUGH THE API, because a list cell has no form around it: the
 * same `PATCH /api/users/:id` the document screen sent, with the same hooks and
 * the same access control behind it. A key is a v4 UUID, which is exactly what
 * Payload's own "Generate" produced before it was reached from here.
 */

type CellProps = {
  rowData?: Record<string, unknown>
}

const ICON = { size: 16, strokeWidth: 1.75 } as const

/* The same shape Payload's own button produced — a v4 UUID — from the browser's
   own generator rather than a package this app does not depend on directly. */
const newKey = () => crypto.randomUUID()

/** Below this the row is a card, and a card holds one account. */
const PHONE = '(max-width: 48rem)'

/**
 * Whether this is the phone's layout — where the row opens onto a sheet.
 *
 * ON A DESK THE KEY OPENS IN THE ROW, behind a caret, because the table is a
 * list of accounts and every enabled one opened at once is seven key boxes and
 * no list. A card is not a row in a table: it is one account with a switch, a
 * masked credential and two buttons on it, which is a screen's worth of
 * decision sitting in a list. So on a phone the card says the state and opens,
 * and the deciding happens somewhere that has room for it.
 *
 * `false` until the browser answers, because this renders on the server too and
 * a desk is the safe guess: it shows a caret for a frame on a phone rather than
 * the row's own controls for a frame on a desk.
 */
function useIsPhone(): boolean {
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

export const UserApiCell: React.FC<CellProps> = ({ rowData }) => {
  const id = rowData?.id
  const email = typeof rowData?.email === 'string' ? rowData.email : ''
  const cell = React.useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = React.useState(Boolean(rowData?.enableAPIKey))
  const [apiKey, setApiKey] = React.useState<null | string>(null)
  const [open, setOpen] = React.useState(false)
  const phone = useIsPhone()
  const [sheet, setSheet] = React.useState(false)
  /* In the sheet the key is simply there — it is the reason the sheet opened.
     In the table it waits to be asked for. */
  const showKey = Boolean(enabled) && (phone ? sheet : open)
  const [shown, setShown] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<null | string>(null)
  const [confirming, setConfirming] = React.useState(false)

  /* The list does not carry the key — `apiKey` is not a column, and it should
     not be one: forty rows of credentials on a screen anyone can leave open. It
     is fetched for the row that is open, and only that row. */
  React.useEffect(() => {
    if (!showKey || !id || apiKey) return
    let live = true
    void (async () => {
      try {
        const res = await fetch(`/api/users/${id}?depth=0`, { credentials: 'include' })
        if (!res.ok) return
        const doc = (await res.json()) as { apiKey?: string }
        if (live && typeof doc.apiKey === 'string') setApiKey(doc.apiKey)
      } catch {
        // The row still says access is on; a key that will not load is a
        // network fault, not a state worth printing in a table cell.
      }
    })()
    return () => {
      live = false
    }
  }, [apiKey, id, showKey])

  const save = React.useCallback(
    async (patch: Record<string, unknown>) => {
      if (!id) return false
      setBusy(true)
      setError(null)
      try {
        const res = await fetch(`/api/users/${id}`, {
          body: JSON.stringify(patch),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        })
        if (!res.ok) throw new Error(String(res.status))
        return true
      } catch {
        setError('Could not save. Try again.')
        return false
      } finally {
        setBusy(false)
      }
    },
    [id],
  )

  const toggle = async (next: boolean) => {
    /* Turning it on with no key would leave access enabled and nothing to
       authenticate with, which reads as working and is not. */
    const key = next && !apiKey ? newKey() : undefined
    const ok = await save(key ? { apiKey: key, enableAPIKey: true } : { enableAPIKey: next })
    if (!ok) return
    if (key) setApiKey(key)
    setEnabled(next)
    setShown(false)
    setOpen(next ? open : false)
  }

  const regenerate = async () => {
    const key = newKey()
    const ok = await save({ apiKey: key, enableAPIKey: true })
    if (!ok) return
    setApiKey(key)
    setConfirming(false)
  }

  /* THE ROW OPENS, NOT THE COLUMN. A cell that grew would push its own column
     down and leave the email and the dates floating at the top of a tall row.
     The key is drawn across the whole row instead — absolutely, against the
     `<tr>` — and the row is told to make room for it, so every other cell stays
     exactly where it was.
     It starts where the reading starts: the email's column, not the row's edge,
     which is the checkbox's gutter. The offset is measured rather than guessed,
     because the selection column is not always there. */
  React.useEffect(() => {
    const row = cell.current?.closest('tr')
    if (!row) return
    const across = showKey && !phone
    row.classList.toggle('da-row--api', across)
    if (across) {
      const first = row.querySelector('td:nth-child(2)') ?? row.firstElementChild
      const inset = first ? first.getBoundingClientRect().left - row.getBoundingClientRect().left : 16
      ;(row as HTMLElement).style.setProperty('--da-api-inset', `${Math.round(inset)}px`)
    }
    return () => {
      row.classList.remove('da-row--api')
      ;(row as HTMLElement).style.removeProperty('--da-api-inset')
    }
  }, [showKey, phone])

  const copy = async () => {
    if (!apiKey) return
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Refused clipboard access says nothing useful here; the key is on screen.
    }
  }

  /* The switch, the key and the way to replace it — the whole of what is
     decided about an account. In the table this is the row; in a sheet it is
     the sheet's body, which is why it is written once. */
  const controls = (
    <>
      <div className="da-api-cell__head">
        <Switch checked={enabled} label="API access" onChange={toggle} />

        {/* THE KEY IS NOT THE POINT OF THE TABLE. With every enabled account
            opened at once, a list of seven is seven key boxes and no list. The
            switch says whether there is access; this asks to see the key for
            one row. */}
        {enabled && !phone ? (
          <button
            aria-expanded={open}
            aria-label={open ? 'Hide key' : 'Show key'}
            className={`da-api-cell__disclose${open ? ' da-api-cell__disclose--on' : ''}`}
            onClick={() => setOpen((was) => !was)}
            type="button"
          >
            <ChevronDown aria-hidden="true" {...ICON} />
          </button>
        ) : null}
      </div>

      {showKey ? (
        <div className="da-api-cell__key">
          <span className="da-api-cell__value">
            {/* Dots until asked, and a monospace face when shown: a key is read
                character by character when it is being checked against another
                one. */}
            {shown ? apiKey ?? 'Loading…' : '••••••••••••••••••••••••••••••••••••'}
          </span>

          <button
            aria-label={shown ? 'Hide key' : 'Show key'}
            className="da-api-cell__icon"
            disabled={!apiKey}
            onClick={() => setShown((was) => !was)}
            type="button"
          >
            {shown ? <EyeOff aria-hidden="true" {...ICON} /> : <Eye aria-hidden="true" {...ICON} />}
          </button>

          <button
            aria-label={copied ? 'Key copied' : 'Copy key'}
            className="da-api-cell__icon"
            disabled={!apiKey}
            onClick={copy}
            type="button"
          >
            {copied ? <Check aria-hidden="true" {...ICON} /> : <Copy aria-hidden="true" {...ICON} />}
          </button>

          <button
            className="da-api-cell__regen"
            disabled={busy}
            onClick={() => setConfirming(true)}
            type="button"
          >
            Generate new
          </button>
        </div>
      ) : null}

      {error ? <p className="da-api-cell__error">{error}</p> : null}
    </>
  )

  /* The question worth asking twice: the key in Content Studio stops working
     the moment this one is written, and nothing on either screen would say why
     publishing had stopped. It is rendered beside whichever surface is in use,
     and portals over it either way. */
  const confirmation = (
    <ConfirmDialog
      confirmLabel="Generate new key"
      description="Content Studio publishes with the current key. It stops working the moment a new one is made, until the new key is pasted into Content Studio."
      onCancel={() => setConfirming(false)}
      onConfirm={regenerate}
      open={confirming}
      title="Replace this key?"
    />
  )

  /*
   * THE CARD SAYS THE STATE AND OPENS.
   *
   * A button the size of the card rather than a control at the end of it: the
   * whole row is the tap target, which is what a list of cards teaches a thumb
   * to expect, and the state and the chevron ride at its end where the eye
   * already is. It is transparent, so the address underneath is what you read;
   * it is a `button`, so Tab reaches it and Enter opens it, which a click
   * handler on a `<tr>` never would.
   */
  if (phone) {
    return (
      <div className="da-api-cell da-api-cell--card" ref={cell}>
        <button
          aria-haspopup="dialog"
          aria-label={`API access for ${email || 'this account'}: ${enabled ? 'on' : 'off'}`}
          className="da-api-cell__open"
          onClick={() => setSheet(true)}
          type="button"
        >
          <span className={`da-api-state${enabled ? ' da-api-state--on' : ''}`}>
            {enabled ? 'On' : 'Off'}
          </span>
          <ChevronRight aria-hidden="true" className="da-api-cell__chevron" size={18} />
        </button>

        <Dialog onClose={() => setSheet(false)} open={sheet} title="API access">
          <div className="da-api-sheet">{controls}</div>
        </Dialog>

        {confirmation}
      </div>
    )
  }

  return (
    <div className="da-api-cell" ref={cell}>
      {controls}
      {confirmation}
    </div>
  )
}

/**
 * The account's address, as text.
 *
 * Payload links the first column of a list to the document, and this
 * collection's document is a redirect back to the list — so the email looked
 * clickable, lit up under the pointer and went nowhere. A link that returns you
 * to where you already are is worse than no link: it reads as a way in.
 */
export const UserEmailCell: React.FC<{ cellData?: unknown }> = ({ cellData }) => (
  <span className="da-user-email">{typeof cellData === 'string' ? cellData : ''}</span>
)
