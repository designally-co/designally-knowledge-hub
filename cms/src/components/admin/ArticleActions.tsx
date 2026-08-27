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

import './ArticleActions.css'

/**
 * Everything you can DO to an article, in the header band.
 *
 * THE RAIL WAS DOING TWO JOBS. It held the article's properties — tag, status,
 * date, slug, translation, provenance — and, stacked on top of them, a column of
 * controls: Save, Edit, two glyphs, and Delete at the far end. Reading down it
 * you crossed from "what this article is" to "what I can do to it" and back
 * again, and the two never looked different enough to tell apart at a glance.
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

export function ArticleActions() {
  const { id } = useDocumentInfo()
  const host = useHeaderSlot()
  const modified = useFormModified()
  const slug = useFormFields(([fields]) => fields?.slug?.value)
  const status = useFormFields(([fields]) => fields?.status?.value)

  const path = typeof slug === 'string' && slug ? `/en/articles/${slug}` : null
  const isPublished = status === 'published'

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

      <ArticleMenu id={id} isPublished={isPublished} modified={modified} path={path} />
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
 * WHAT IS IN HERE. Editing, looking at the published page, copying its address,
 * and deleting it. Two of them only exist for some articles — a draft has no
 * page to view, an unsaved one has no address.
 *
 * DELETE CONFIRMS IN PLACE, and the platform's rule for that is followed too:
 * a confirmation among rows is a recessed block inside the menu, but a
 * confirmation that IS the menu takes the panel's own shape rather than
 * floating in a second frame.
 */
function ArticleMenu({
  id,
  isPublished,
  modified,
  path,
}: {
  id: number | string | undefined
  isPublished: boolean
  modified: boolean
  path: null | string
}) {
  const router = useRouter()

  const [open, setOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
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
      /* The first item that can actually take it: while the form is dirty the
         first row is a disabled Edit, and focusing that lands the caret
         nowhere — measured, `document.activeElement` came back as the body. */
      : panel.current?.querySelector<HTMLElement>('[data-item]:not(:disabled)')
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

  const copy = async () => {
    if (!path) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused. Say nothing rather than claim a copy
      // that did not happen — the address is on the page either way.
    }
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
      const res = await fetch(`/api/articles/${id}`, { credentials: 'include', method: 'DELETE' })
      if (!res.ok) throw new Error(String(res.status))
      /* Back to the list, and `refresh()` so it re-fetches rather than showing
         the deleted article out of the router cache. */
      router.push('/admin/collections/articles')
      router.refresh()
    } catch {
      setDeleting(false)
      setError('That did not delete. The article is unchanged.')
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
        <div
          className="da-bar__panel"
          onKeyDown={move}
          ref={panel}
          role="menu"
        >
          {confirming ? (
            <div className="da-bar__confirm">
              <p className="da-bar__question">Delete this article? This cannot be undone.</p>
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
              {/* THE FIRST ROW, because it is the one you came for. A link, not
                  a button: middle-click and open-in-new-tab work, and the
                  browser shows the destination.

                  DISABLED WHILE THE FORM IS DIRTY. The two layers share one
                  form, so crossing to the writing surface with an unsaved edit
                  in the rail would discard it. The note below says so — the
                  platform's own device for the one sentence a menu still
                  holds. */}
              {id ? (
                modified ? (
                  <>
                    <button
                      className="da-bar__item"
                      data-item
                      disabled
                      role="menuitem"
                      type="button"
                    >
                      <Pencil aria-hidden="true" size={20} strokeWidth={2} />
                      Edit article
                    </button>
                    <p className="da-bar__note">
                      Save first — this page and the writing surface are one form.
                    </p>
                  </>
                ) : (
                  <Link
                    className="da-bar__item"
                    data-item
                    href={`/admin/collections/articles/${id}/write`}
                    role="menuitem"
                  >
                    <Pencil aria-hidden="true" size={20} strokeWidth={2} />
                    Edit article
                  </Link>
                )
              ) : null}

              {/* Only when there is a public page to open. A draft's URL 404s,
                  and a control offering to show you something that is not there
                  is worse than no control. */}
              {isPublished && path ? (
                <a
                  className="da-bar__item"
                  data-item
                  href={path}
                  rel="noreferrer"
                  role="menuitem"
                  target="_blank"
                >
                  <ExternalLink aria-hidden="true" size={20} strokeWidth={2} />
                  View on site
                </a>
              ) : null}

              {path ? (
                <button
                  className="da-bar__item"
                  data-item
                  onClick={copy}
                  role="menuitem"
                  type="button"
                >
                  {copied ? (
                    <Check aria-hidden="true" size={20} strokeWidth={2} />
                  ) : (
                    <Link2 aria-hidden="true" size={20} strokeWidth={2} />
                  )}
                  {copied ? 'Link copied' : 'Copy link'}
                </button>
              ) : null}

              {id ? (
                <button
                  className="da-bar__item da-bar__item--danger"
                  data-item
                  onClick={() => setConfirming(true)}
                  role="menuitem"
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={20} strokeWidth={2} />
                  Delete article
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

/**
 * When the article was last touched, and when it was made.
 *
 * PROVENANCE, NOT AN ACTION — so it sits at the foot of the rail, with the rest
 * of what the article IS. It answers "is this the version I remember?", which is
 * a question you ask once on arrival and never again while working.
 */
export function ArticleMeta() {
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
