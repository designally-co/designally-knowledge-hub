'use client'

import React from 'react'
import { Check, ChevronDown, Copy, Eye, EyeOff } from 'lucide-react'

import { ApiKeyBox, ICON, MASK, useApiAccess } from './ApiAccess'
import { CardOpener, useIsPhone } from './CardOpener'
import { Dialog } from './ConfirmDialog'
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

export const UserApiCell: React.FC<CellProps> = ({ rowData }) => {
  const id = rowData?.id as number | string | undefined
  const email = typeof rowData?.email === 'string' ? rowData.email : ''
  const cell = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)
  /* ON A DESK THE KEY OPENS IN THE ROW, behind a caret: the table is a list
     of accounts, and every enabled one opened at once is seven key boxes and no
     list. On a phone a card is one account, and its switch, masked credential
     and buttons are a screen's worth of decision — so the card says the state
     and opens a sheet that has room for them. */
  const phone = useIsPhone()
  const [sheet, setSheet] = React.useState(false)

  const access = useApiAccess({
    id,
    initialEnabled: Boolean(rowData?.enableAPIKey),
    visible: phone ? sheet : open,
  })
  const { apiKey, askRegenerate, busy, confirmation, copied, copy, enabled, error, setError, setShown, showKey, shown } =
    access

  /* Turning access off folds the row's key away with it. */
  const toggle = async (next: boolean) => {
    if ((await access.toggle(next)) && !next) setOpen(false)
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

  /*
   * THE CARD SAYS THE STATE AND OPENS. Done, not Save and Cancel: with one
   * button there is nothing to cancel TO, so the switch writes the moment it
   * moves, as it does in the table, and the sheet shows the result. Done,
   * Escape and the overlay all close.
   */
  if (phone) {
    return (
      <div className="da-api-cell da-api-cell--card" ref={cell}>
        <CardOpener
          label={`API access for ${email || 'this account'}: ${enabled ? 'on' : 'off'}`}
          onOpen={() => {
            setShown(false)
            setError(null)
            setSheet(true)
          }}
        >
          <span className={`da-api-state${enabled ? ' da-api-state--on' : ''}`}>{enabled ? 'On' : 'Off'}</span>
        </CardOpener>

        {/* THE SWITCH IS WHERE THE CLOSE WAS: the one decision in the sheet reads
            as its subject rather than its first field. */}
        <Dialog
          aside={<Switch checked={enabled} label="API access" onChange={(next) => void toggle(next)} />}
          onClose={() => setSheet(false)}
          open={sheet}
          title="API access"
        >
          <div className="da-api-sheet">
            {showKey ? <ApiKeyBox access={access} /> : null}
            {error ? <p className="da-api-cell__error">{error}</p> : null}
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
    <div className="da-api-cell" ref={cell}>
      <div className="da-api-cell__head">
        <Switch checked={enabled} label="API access" onChange={(next) => void toggle(next)} />

        {/* THE KEY IS NOT THE POINT OF THE TABLE. The switch says whether there
            is access; this asks to see the key for one row. */}
        {enabled ? (
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
          <span className="da-api-cell__value">{shown ? apiKey ?? 'Loading…' : MASK}</span>

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

          <button className="da-api-cell__regen" disabled={busy} onClick={askRegenerate} type="button">
            Generate new
          </button>
        </div>
      ) : null}

      {error ? <p className="da-api-cell__error">{error}</p> : null}

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
