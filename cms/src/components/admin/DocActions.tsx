'use client'

import React from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
/* THE ICONS ARE LUCIDE'S OWN, from the package this product already ships,
   rather than paths copied out of it by hand. Same library the nav's glyphs
   come from — those are masked into Payload's markup because there is no
   component to render there; here the markup is mine, so the components are. */
import { Check, Ellipsis, ExternalLink, Link2, Pencil, Trash2 } from 'lucide-react'
import { SaveButton, useDocumentInfo, useFormFields, useFormModified } from '@payloadcms/ui'

import './DocActions.css'

/**
 * Everything you can DO to a document, in the header band.
 *
 * THE RAIL WAS DOING TWO JOBS. It held the document's properties — tag, status,
 * date, slug, translation, provenance — and, stacked on top of them, a column of
 * controls: Save, Edit, two glyphs, and Delete at the far end. Reading down it
 * you crossed from "what this is" to "what I can do to it" and back again, and
 * the two never looked different enough to tell apart at a glance.
 *
 * So the rail keeps the typed content and this takes the verbs. The band across
 * the top already says WHERE you are; it now also says what is available here,
 * which is what a header is for.
 *
 * TWO CONTROLS:
 *
 *   Save   the primary, and the only filled thing on the screen
 *   ⋯      every other verb, one press away
 *
 * A PORTAL, BECAUSE THE HEADER IS NOT MINE TO RENDER. Payload's own slot for
 * view actions renders in that band, but it is mounted OUTSIDE the document's
 * form — and Save, the dirty state and the slug all come from form context. This
 * component is a `ui` field, so it lives inside the form, and React context
 * passes through a portal: the markup lands in the header while the hooks keep
 * reading the form they were always reading.
 *
 * ONE COMPONENT, THREE COLLECTIONS. It was written for articles and was article-
 * shaped throughout — the DELETE path, the list to return to, and the wording of
 * the question were all literals. Resources and Media wore Payload's own control
 * bar instead: a strip of timestamps with Save inside it and a dot menu, above
 * an otherwise identical screen. What differs between the three is a handful of
 * menu rows, so that is the only thing a caller passes; everything below —
 * the popover, its keyboard, the confirmation, the deletion — is shared.
 */

/** The header's action slot, which exists a frame or two after a client-side nav. */
function useHeaderSlot() {
  const [host, setHost] = React.useState<Element | null>(null)

  React.useEffect(() => {
    let frame = 0
    let tries = 0
    const find = () => {
      const el = document.querySelector('.app-header__actions')
      if (el) return setHost(el)
      if (tries++ < 30) frame = requestAnimationFrame(find)
    }
    find()
    return () => cancelAnimationFrame(frame)
  }, [])

  return host
}

/** One row of the ⋯ menu, above the delete that every document gets. */
type MenuRow = {
  /** Shown greyed, with `note` under it, when the row cannot be used yet. */
  disabled?: boolean
  external?: boolean
  href?: string
  icon: React.ReactNode
  key: string
  label: string
  note?: string
  onClick?: () => void
}

type DocBarProps = {
  /** The API and admin path segment: `articles`, `resources`, `media`. */
  collection: string
  /** What the question calls it: "article", "resource", "file". */
  noun: string
  /** Anything above Delete. Built by the caller, which knows the fields. */
  rows: MenuRow[]
  /** The sentence under "Delete permanently", when there is more to say. */
  deleteWarning?: string
}

function DocBar({ collection, deleteWarning, noun, rows }: DocBarProps) {
  const { id } = useDocumentInfo()
  const host = useHeaderSlot()
  const modified = useFormModified()

  if (!host) return null

  return createPortal(
    <div className="da-bar">
      {/* THE STATE, IN WORDS. Save is filled whether or not there is anything to
          write, so the button cannot be the thing that tells you there is —
          this is. */}
      {modified ? <p className="da-bar__unsaved">Unsaved changes</p> : null}

      {/* Payload's own `SaveButton` rather than a button of mine wired to
          `submit()`: it already knows about validation state, the
          disabled-while-saving case and the keyboard shortcut. */}
      <div className="da-bar__save">
        <SaveButton />
      </div>

      <DocMenu
        collection={collection}
        deleteWarning={deleteWarning}
        id={id}
        noun={noun}
        rows={rows}
      />
    </div>,
    host,
  )
}

/**
 * Every verb except Save, behind one glyph.
 *
 * IT IS THE PLATFORM'S POPOVER, not a menu invented here. `.barmenu` in the
 * Designally platform is a canvas tile at the card radius with 6px of padding,
 * held to the page by the Edge and never by a shadow — "borders, not shadows" —
 * growing out of the control it hangs off in one 180ms move. Its rows are a
 * 20px mark on the leading edge and a 14.5/600 label, highlighted on the warm
 * white; the destructive one carries the critical hue through to its mark. All
 * of that is ported here, including the concentric corners: the panel's 26
 * minus its own 6 of padding gives the first and last rows a 20px curve, so a
 * row's highlight follows the panel instead of cutting a crescent out of it.
 *
 * DELETE IS THE ONLY ROW IT OWNS. Every document can be deleted and every
 * deletion is the same three steps — ask, DELETE, return to the list — so it is
 * here rather than in three callers. The rest is whatever the collection handed
 * over.
 *
 * DELETE CONFIRMS IN PLACE, and the platform's rule for that is followed too:
 * a confirmation among rows is a recessed block inside the menu, but a
 * confirmation that IS the menu takes the panel's own shape rather than
 * floating in a second frame.
 */
function DocMenu({
  collection,
  deleteWarning,
  id,
  noun,
  rows,
}: DocBarProps & { id: number | string | undefined }) {
  const router = useRouter()

  const [open, setOpen] = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [error, setError] = React.useState<null | string>(null)

  const wrap = React.useRef<HTMLDivElement | null>(null)
  const trigger = React.useRef<HTMLButtonElement | null>(null)
  const panel = React.useRef<HTMLDivElement | null>(null)

  /* Closing: a click anywhere else, or Escape. Escape also returns the focus it
     took, which is the half of "press Escape" that usually goes missing. */
  React.useEffect(() => {
    if (!open) return

    const onPointer = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }

    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  /* Opening puts the caret on the first item, so the menu is usable from the
     keyboard the moment it appears rather than after four more Tabs.

     EXCEPT ON THE QUESTION, WHERE THE SAFE ANSWER TAKES IT. The first item there
     is "Delete permanently", and focusing it means the Enter key that opened the
     confirmation also answers it — measured, and the article would be gone. The
     keyboard lands on "Keep"; deleting costs a deliberate move either way. */
  React.useEffect(() => {
    if (!open) return
    const target = confirming
      ? panel.current?.querySelector<HTMLElement>('.da-bar__no')
      : /* The first item that can actually take it: while the form is dirty the
           first row is a disabled Edit, and focusing that lands the caret
           nowhere — measured, `document.activeElement` came back as the body. */
        panel.current?.querySelector<HTMLElement>('[data-item]:not(:disabled)')
    target?.focus()
  }, [open, confirming])

  /* The question resets when the menu closes: reopening it should never find
     "Delete permanently" sitting under the pointer. */
  React.useEffect(() => {
    if (!open) {
      setConfirming(false)
      setError(null)
    }
  }, [open])

  const move = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('[data-item]') || [])
    if (!items.length) return
    event.preventDefault()
    const at = items.indexOf(document.activeElement as HTMLElement)
    const next = event.key === 'ArrowDown' ? at + 1 : at - 1
    items[(next + items.length) % items.length].focus()
  }

  /* REBUILT RATHER THAN REUSED. Payload's `DeleteDocument` lives in the dot menu
     on a control bar this view does not have, and importing it directly does not
     work: `@payloadcms/ui/elements/*` is a real subpath in the exports map, but
     reaching a client component through a second specifier gives it a second
     module instance whose `useConfig()` reads a context that was never populated
     — measured, as `Cannot destructure property 'config' … as it is undefined`,
     which took the whole screen down. This is the plain DELETE that Payload's
     own control calls in the end. */
  const destroy = async () => {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/${collection}/${id}`, {
        credentials: 'include',
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(String(res.status))
      /* Back to the list, and `refresh()` so it re-fetches rather than showing
         the deleted document out of the router cache. */
      router.push(`/admin/collections/${collection}`)
      router.refresh()
    } catch {
      setDeleting(false)
      setError(`That did not delete. The ${noun} is unchanged.`)
    }
  }

  return (
    <div className="da-bar__menu" ref={wrap}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="More actions"
        className={`da-bar__more${open ? ' da-bar__more--on' : ''}`}
        onClick={() => setOpen((was) => !was)}
        ref={trigger}
        title="More actions"
        type="button"
      >
        <Ellipsis aria-hidden="true" size={18} strokeWidth={2} />
      </button>

      {open ? (
        <div className="da-bar__panel" onKeyDown={move} ref={panel} role="menu">
          {confirming ? (
            <div className="da-bar__confirm">
              <p className="da-bar__question">
                Delete this {noun}? {deleteWarning ?? 'This cannot be undone.'}
              </p>
              <div className="da-bar__row">
                <button
                  className="da-bar__yes"
                  data-item
                  disabled={deleting}
                  onClick={destroy}
                  type="button"
                >
                  {deleting ? 'Deleting…' : 'Delete permanently'}
                </button>
                <button
                  className="da-bar__no"
                  data-item
                  disabled={deleting}
                  onClick={() => setConfirming(false)}
                  type="button"
                >
                  Keep
                </button>
              </div>
              {error ? (
                <p className="da-bar__error" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              {rows.map((row) => {
                /* Three shapes of row, and the tag is decided by what it does
                   rather than by how it looks: an internal destination is a
                   `Link` so the router keeps the page, an external one is an
                   anchor with the relationship spelled out, and everything else
                   is a button. */
                if (row.disabled) {
                  return (
                    <React.Fragment key={row.key}>
                      <button className="da-bar__item" data-item disabled role="menuitem" type="button">
                        {row.icon}
                        {row.label}
                      </button>
                      {row.note ? <p className="da-bar__note">{row.note}</p> : null}
                    </React.Fragment>
                  )
                }

                if (row.href && row.external) {
                  return (
                    <a
                      className="da-bar__item"
                      data-item
                      href={row.href}
                      key={row.key}
                      rel="noreferrer"
                      role="menuitem"
                      target="_blank"
                    >
                      {row.icon}
                      {row.label}
                    </a>
                  )
                }

                if (row.href) {
                  return (
                    <Link
                      className="da-bar__item"
                      data-item
                      href={row.href}
                      key={row.key}
                      role="menuitem"
                    >
                      {row.icon}
                      {row.label}
                    </Link>
                  )
                }

                return (
                  <button
                    className="da-bar__item"
                    data-item
                    key={row.key}
                    onClick={row.onClick}
                    role="menuitem"
                    type="button"
                  >
                    {row.icon}
                    {row.label}
                  </button>
                )
              })}

              {id ? (
                <button
                  className="da-bar__item da-bar__item--danger"
                  data-item
                  onClick={() => setConfirming(true)}
                  role="menuitem"
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={20} strokeWidth={2} />
                  Delete {noun}
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

/** Copy an address to the clipboard, and say so on the row for two seconds. */
function useCopy(url: null | string) {
  const [copied, setCopied] = React.useState(false)

  const copy = React.useCallback(async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused. Say nothing rather than claim a copy
      // that did not happen — the address is on the page either way.
    }
  }, [url])

  return { copied, copy }
}

const ICON = { size: 20, strokeWidth: 2 } as const

/* ---- articles ------------------------------------------------------------ */

export function ArticleActions() {
  const { id } = useDocumentInfo()
  const modified = useFormModified()
  const slug = useFormFields(([fields]) => fields?.slug?.value)
  const status = useFormFields(([fields]) => fields?.status?.value)

  const path = typeof slug === 'string' && slug ? `/en/articles/${slug}` : null
  const url = path && typeof window !== 'undefined' ? `${window.location.origin}${path}` : null
  const { copied, copy } = useCopy(url)

  const rows: MenuRow[] = []

  /* THE FIRST ROW, because it is the one you came for.
     DISABLED WHILE THE FORM IS DIRTY: the two layers share one form, so crossing
     to the writing surface with an unsaved edit in the rail would discard it.
     The note says so — the platform's own device for the one sentence a menu
     still holds. */
  if (id) {
    rows.push({
      disabled: modified,
      href: `/admin/collections/articles/${id}/write`,
      icon: <Pencil aria-hidden="true" {...ICON} />,
      key: 'write',
      label: 'Edit article',
      note: modified ? 'Save first — this page and the writing surface are one form.' : undefined,
    })
  }

  /* Only when there is a public page to open. A draft's URL 404s, and a control
     offering to show you something that is not there is worse than no control. */
  if (status === 'published' && path) {
    rows.push({
      external: true,
      href: path,
      icon: <ExternalLink aria-hidden="true" {...ICON} />,
      key: 'view',
      label: 'View on site',
    })
  }

  if (path) {
    rows.push({
      icon: copied ? <Check aria-hidden="true" {...ICON} /> : <Link2 aria-hidden="true" {...ICON} />,
      key: 'copy',
      label: copied ? 'Link copied' : 'Copy link',
      onClick: copy,
    })
  }

  return <DocBar collection="articles" noun="article" rows={rows} />
}

/* ---- resources ----------------------------------------------------------- */

/**
 * The same bar on the download screen.
 *
 * NO "EDIT" ROW, because there is no second layer: a resource is a description
 * and a list of files, all of it on this one page. The article's first row is
 * the way into its writing surface, and a resource has nothing to cross to.
 */
export function ResourceActions() {
  const slug = useFormFields(([fields]) => fields?.slug?.value)
  const status = useFormFields(([fields]) => fields?.status?.value)

  const path = typeof slug === 'string' && slug ? `/en/resources/${slug}` : null
  const url = path && typeof window !== 'undefined' ? `${window.location.origin}${path}` : null
  const { copied, copy } = useCopy(url)

  const rows: MenuRow[] = []

  if (status === 'published' && path) {
    rows.push({
      external: true,
      href: path,
      icon: <ExternalLink aria-hidden="true" {...ICON} />,
      key: 'view',
      label: 'View on site',
    })
  }

  if (path) {
    rows.push({
      icon: copied ? <Check aria-hidden="true" {...ICON} /> : <Link2 aria-hidden="true" {...ICON} />,
      key: 'copy',
      label: copied ? 'Link copied' : 'Copy link',
      onClick: copy,
    })
  }

  return <DocBar collection="resources" noun="resource" rows={rows} />
}

/* ---- media --------------------------------------------------------------- */

/**
 * The same bar on an uploaded file.
 *
 * ITS "PUBLIC PAGE" IS THE FILE ITSELF, so the two link rows point at the asset
 * rather than at a page about it — opening one is how you check that the crop
 * is the crop you meant, and the address is what Content Studio and the site
 * both reference.
 *
 * AND THE QUESTION IS DIFFERENT. Deleting an article removes an article;
 * deleting a file can empty a picture out of an article that is still
 * published, and nothing on this screen would say which. The confirmation says
 * so instead of promising it "cannot be undone", which is true of all of them
 * and not the part worth reading twice.
 */
export function MediaActions() {
  const { savedDocumentData } = useDocumentInfo()

  const url = typeof savedDocumentData?.url === 'string' ? savedDocumentData.url : null
  const absolute = url && typeof window !== 'undefined' ? `${window.location.origin}${url}` : url
  const { copied, copy } = useCopy(absolute)

  const rows: MenuRow[] = []

  if (url) {
    rows.push(
      {
        external: true,
        href: url,
        icon: <ExternalLink aria-hidden="true" {...ICON} />,
        key: 'open',
        label: 'Open file',
      },
      {
        icon: copied ? <Check aria-hidden="true" {...ICON} /> : <Link2 aria-hidden="true" {...ICON} />,
        key: 'copy',
        label: copied ? 'Link copied' : 'Copy file link',
        onClick: copy,
      },
    )
  }

  return (
    <DocBar
      collection="media"
      deleteWarning="Anything using it — a cover, a card, a download — loses its file."
      noun="file"
      rows={rows}
    />
  )
}

/* ---- provenance, at the foot of the rail --------------------------------- */

/**
 * When the document was last touched, and when it was made.
 *
 * PROVENANCE, NOT AN ACTION — so it sits at the foot of the rail, with the rest
 * of what the document IS. It answers "is this the version I remember?", which
 * is a question you ask once on arrival and never again while working.
 *
 * It reads `savedDocumentData` and has never cared which collection it is in,
 * which is why the account screen and the media screen use it unchanged.
 */
export function DocMeta() {
  const { savedDocumentData } = useDocumentInfo()

  const when = (value: unknown) => {
    if (typeof value !== 'string') return null
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const updated = when(savedDocumentData?.updatedAt)
  const created = when(savedDocumentData?.createdAt)

  /* A document that has never been saved has neither, and an empty pair of
     labels is worse than nothing at the end of the rail. */
  if (!updated && !created) return null

  return (
    <dl className="da-meta">
      {updated ? (
        <div className="da-meta__row">
          <dt className="da-meta__label">Last modified</dt>
          <dd className="da-meta__value">{updated}</dd>
        </div>
      ) : null}
      {created ? (
        <div className="da-meta__row">
          <dt className="da-meta__label">Created</dt>
          <dd className="da-meta__value">{created}</dd>
        </div>
      ) : null}
    </dl>
  )
}

/** The name the article screen and the account screen registered it under. */
export { DocMeta as ArticleMeta }
