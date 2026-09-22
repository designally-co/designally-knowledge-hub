'use client'

import React from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
/* THE ICONS ARE LUCIDE'S OWN, from the package this product already ships,
   rather than paths copied out of it by hand. Same library the nav's glyphs
   come from — those are masked into Payload's markup because there is no
   component to render there; here the markup is mine, so the components are. */
import { Check, Download, Ellipsis, ExternalLink, Expand, Link2, Pencil, Replace, Trash2, X } from 'lucide-react'
import { SaveButton, useDocumentDrawerContext, useDocumentInfo, useFormFields, useFormModified, useLocale, useModal } from '@payloadcms/ui'

import { DEFAULT_LOCALE, isLocale, localeHref } from '../../lib/i18n'
import { adminDate } from './adminDate'
import { DetailCloseGuard } from './DetailModals'

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

/** A host that may not exist on the first frame after a client-side nav. */
function useHost(selector: string) {
  const [host, setHost] = React.useState<Element | null>(null)

  React.useEffect(() => {
    let frame = 0
    let tries = 0
    const find = () => {
      const el = document.querySelector(selector)
      if (el) return setHost(el)
      if (tries++ < 30) frame = requestAnimationFrame(find)
    }
    find()
    return () => cancelAnimationFrame(frame)
  }, [selector])

  return host
}

/**
 * Where this bar belongs: the header band, or the sheet it is standing in.
 *
 * THE SAME FORM OPENS IN TWO PLACES. A media document is usually a screen, and
 * its Save goes into the band across the top of that screen. But "Create New" in
 * the picker opens the SAME form inside a drawer over an article — and the bar
 * kept portalling into the app header, which by then is behind a sheet and
 * belongs to a different document. The window showed two Saves stacked in one
 * corner, both hidden, and the sheet had no way to save at all.
 *
 * An anchor in the form answers it: whatever the form is standing in, we are
 * standing in it too. Inside a sheet the bar goes to the foot of that sheet and
 * the heading — Payload writes "[Untitled]" over a document that has never been
 * saved — is replaced by the name of what you are making.
 */
function useBarSlots() {
  const anchor = React.useRef<HTMLSpanElement | null>(null)
  const [slots, setSlots] = React.useState<null | {
    foot: Element
    sheet: boolean
    title: Element | null
  }>(null)

  React.useEffect(() => {
    let frame = 0
    let tries = 0
    const find = () => {
      const sheet = anchor.current?.closest('.drawer__content') ?? null
      const foot = sheet ?? document.querySelector('.app-header__actions')
      if (foot) {
        return setSlots({
          foot,
          sheet: Boolean(sheet),
          title: sheet?.querySelector('.doc-drawer__header-text') ?? null,
        })
      }
      if (tries++ < 30) frame = requestAnimationFrame(find)
    }
    find()
    return () => cancelAnimationFrame(frame)
  }, [])

  return { anchor, slots }
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
  /** A control to the left of Save. The writing surface puts Cancel here. */
  before?: React.ReactNode
  /** False on a screen where there is nothing behind the ⋯ worth showing. */
  menu?: boolean
  /** A selector for somewhere other than the bar to put the ⋯. The media sheet
   *  sends it into the card, onto the filename's line. */
  menuHost?: string
}

function DocBar({ before, collection, deleteWarning, menu = true, menuHost, noun, rows }: DocBarProps) {
  const { id } = useDocumentInfo()
  const { anchor, slots } = useBarSlots()
  const modified = useFormModified()
  /* Hooks cannot be called conditionally, so this asks for the host whether or
     not a caller wanted one; with no selector it looks for nothing. */
  const elsewhere = useHost(menuHost ?? '\0none')

  // Existing documents keep their actions when opened over the list. A new
  // upload has no saved file to open, copy or delete yet.
  const showMenu = menu && (!slots?.sheet || id !== undefined)

  return (
    <>
      {/* Not rendered — read. `closest` off this tells the bar which of the two
          places it is in; a `ui` field has no other way to know. */}
      <span hidden ref={anchor} />
      {/* Media is the one collection whose documents open in a drawer over the
          list, and a drawer's X and Escape bypass Payload's own unsaved-changes
          guard. See DetailModals. */}
      {collection === 'media' ? <DetailCloseGuard /> : null}

      {slots
        ? createPortal(
            <div className={slots.sheet ? 'da-bar da-bar--sheet' : 'da-bar'}>
              {/* THE STATE, IN WORDS. Save is filled whether or not there is
                  anything to write, so the button cannot be the thing that tells
                  you there is — this is. */}
              {/* TWO LENGTHS OF THE SAME SENTENCE. On a phone the band holds a
                  way back, a state and two controls in 375px, and "Unsaved
                  changes" is the only part of that with a shorter honest form.
                  CSS picks; both are in the markup so neither is a content hack.
                  See `.da-bar__unsaved-short` in DocActions.css. */}
              {modified ? (
                <p className="da-bar__unsaved">
                  <span className="da-bar__unsaved-long">Unsaved changes</span>
                  <span className="da-bar__unsaved-short">Unsaved</span>
                </p>
              ) : null}

              {before}

              {/* THE ⋯ COMES BEFORE SAVE, and the order is the point: the
                  primary sits at the end of the row, where the eye stops and
                  the thumb lands, with everything else leading up to it. Save
                  after the menu also puts it beside Cancel on the surfaces that
                  carry one, so the two answers to "am I done" are together. */}
              {showMenu && !menuHost ? (
                <DocMenu
                  collection={collection}
                  deleteWarning={deleteWarning}
                  id={id}
                  noun={noun}
                  rows={rows}
                />
              ) : null}

              {/* Payload's own `SaveButton` rather than a button of mine wired to
                  `submit()`: it already knows about validation state, the
                  disabled-while-saving case and the keyboard shortcut. */}
              <div className="da-bar__save">
                <SaveButton />
              </div>
            </div>,
            slots.foot,
          )
        : null}

      {/* THE ⋯ WHERE THE CALLER ASKED FOR IT. On the media sheet the verbs are
          all about the file, so the menu belongs on the file's card rather than
          in the row of answers at the foot — opposite the filename, the way the
          date and the size sit at the two ends of the line below. */}
      {showMenu && menuHost && elsewhere
        ? createPortal(
            <DocMenu
              collection={collection}
              deleteWarning={deleteWarning}
              id={id}
              noun={noun}
              rows={rows}
            />,
            elsewhere,
          )
        : null}

      {/* "[Untitled]" is what Payload calls a document with no title yet, which
          is a true thing to say and a poor heading for the sheet asking you to
          make one. */}
      {slots?.sheet && slots.title && !id
        ? createPortal(<span className="da-sheet__title">New {noun}</span>, slots.title)
        : null}
    </>
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
  const drawer = useDocumentDrawerContext()

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
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      trigger.current?.focus()
    }

    document.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey, true)
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
      if (drawer.drawerSlug && drawer.onDelete) {
        await drawer.onDelete({ id: String(id) })
      } else {
        router.push(`/admin/collections/${collection}`)
        router.refresh()
      }
    } catch {
      setDeleting(false)
      setError(`That did not delete. The ${noun} is unchanged.`)
    }
  }

  /* A MENU OF ONE IS NOT A MENU. When everything else a document can do has
     found a better home — on media, download and replace sit on the file and
     the link is copied beside its name — the ⋯ is a press that reveals a single
     row. It says the word instead, and opens straight onto the question the row
     would have asked. Same panel, same confirmation, same keyboard landing on
     "Keep". */
  const onlyDelete = rows.length === 0 && id !== undefined

  return (
    <div className="da-bar__menu" ref={wrap}>
      {onlyDelete ? (
        <button
          aria-expanded={open}
          aria-haspopup="menu"
          className={`da-bar__delete${open ? ' da-bar__delete--on' : ''}`}
          onClick={() => {
            setConfirming(true)
            setOpen((was) => !was)
          }}
          ref={trigger}
          type="button"
        >
          <Trash2 aria-hidden="true" size={16} strokeWidth={2} />
          Delete {noun}
        </button>
      ) : (
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
      )}

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
                  /* Where there is no menu behind the question, Keep closes the
                     panel — stepping back from it would otherwise reveal a list
                     holding the one row this replaced. */
                  onClick={() => (onlyDelete ? setOpen(false) : setConfirming(false))}
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

/**
 * The public address of a document, in the locale the editor is looking at.
 *
 * BOTH LINKS USED TO HARDCODE `/en/...`, WHICH IS THE ONE SHAPE THE PUBLIC SITE
 * NEVER SERVES. English is served unprefixed and only *rewritten* to the
 * internal `/en` tree by the middleware; a literal `/en/articles/x` is not
 * already-prefixed as far as that rewrite is concerned, so it becomes
 * `/en/en/articles/x`, falls through to the catch-all and 404s. "View article"
 * therefore opened a not-found page for every published article.
 *
 * `localeHref` is the same function the front end builds its own links with, so
 * the admin now answers this question the way the site does — and a Thai
 * document links to `/th/...` rather than to the English page, which the
 * hardcoded prefix could not do either.
 */
function usePublicPath(collection: 'articles' | 'resources', slug: unknown): string | null {
  const { code } = useLocale()
  if (typeof slug !== 'string' || !slug) return null
  return localeHref(isLocale(code) ? code : DEFAULT_LOCALE, `/${collection}/${slug}`)
}

/* ---- articles ------------------------------------------------------------ */

export function ArticleActions() {
  const { id } = useDocumentInfo()
  const modified = useFormModified()
  /* The two layers share one form and one component, so this bar is the bar on
     both — and "Edit article" is a link to the page you are already reading
     when you are already on the writing surface. */
  const writing = usePathname()?.endsWith('/write') ?? false
  const slug = useFormFields(([fields]) => fields?.slug?.value)
  const status = useFormFields(([fields]) => fields?.status?.value)

  const path = usePublicPath('articles', slug)
  const url = path && typeof window !== 'undefined' ? `${window.location.origin}${path}` : null
  const { copied, copy } = useCopy(url)

  const rows: MenuRow[] = []

  /* THE FIRST ROW, because it is the one you came for.
     DISABLED WHILE THE FORM IS DIRTY: the two layers share one form, so crossing
     to the writing surface with an unsaved edit in the rail would discard it.
     The note says so — the platform's own device for the one sentence a menu
     still holds. */
  if (id && !writing) {
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

  /*
   * THE WRITING SURFACE CARRIES TWO CONTROLS AND NOTHING ELSE.
   *
   * Its ⋯ held View on site, Copy link and Delete — three things to do to an
   * article, none of them a thing to do mid-sentence, and all three are one
   * click away on the overview the breadcrumb above already returns to. The
   * back disc went with it for the same reason: the crumb is a way out, and two
   * ways out on a screen with two controls is one too many.
   *
   * CANCEL IS THE PAIR SAVE NEEDED. A screen that can be saved should say how
   * to leave it without saving, and "the browser's back button" is not an
   * answer. It goes to the overview — one layer up, where you came from.
   */
  if (writing) {
    return (
      <DocBar
        before={<CancelWriting id={id} modified={modified} />}
        collection="articles"
        menu={false}
        noun="article"
        rows={[]}
      />
    )
  }

  return <DocBar collection="articles" noun="article" rows={rows} />
}

/**
 * Leave the writing surface without saving.
 *
 * IT ASKS WHEN THERE IS SOMETHING TO LOSE. A Cancel that silently discards a
 * paragraph is worse than no Cancel; with a clean form there is nothing to
 * confirm and it just goes. `window.confirm` rather than a panel of my own: it
 * is one line, it cannot be missed, and the platform's in-place confirmation —
 * the one the ⋯ menu uses for Delete — needs a panel to live in, which this bar
 * does not have.
 */
function CancelWriting({ id, modified }: { id: number | string | undefined; modified: boolean }) {
  if (!id) return null

  return (
    <Link
      className="da-bar__cancel"
      href={`/admin/collections/articles/${id}`}
      onClick={(event) => {
        if (modified && !window.confirm('Leave without saving? This edit will be lost.')) {
          event.preventDefault()
        }
      }}
    >
      Cancel
    </Link>
  )
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

  const path = usePublicPath('resources', slug)
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

/* ---- subscribers --------------------------------------------------------- */

/* THERE IS NO BAR HERE. A subscriber has no document view to put one on: the
   route returns to the list, and the two things there are to do with an address
   — copy it, stop sending to it — are in the row. See SubscriberCells. */

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
  const { id, savedDocumentData } = useDocumentInfo()

  const url = typeof savedDocumentData?.url === 'string' ? savedDocumentData.url : null
  const mimeType =
    typeof savedDocumentData?.mimeType === 'string' ? savedDocumentData.mimeType : ''
  const isImage = mimeType.startsWith('image/')

  /* THE ERRAND THE SHEET WAS OPENED ON. The list marks a file without a
     description in red and says "Needs description"; the drawer opened from
     that row said nothing — an empty Description box identical to the empty
     Credit box under it, on a form where neither is required. The request has
     to survive the doorway, in the same words and the same colour. */
  const alt = typeof savedDocumentData?.alt === 'string' ? savedDocumentData.alt : ''
  const needsAlt = Boolean(id) && alt.trim() === ''

  React.useEffect(() => {
    const root = document.querySelector<HTMLElement>('.collection-edit--media')
    if (!root) return
    root.classList.toggle('da-needs-alt', needsAlt)
    /* The corner's trash only stands down once there is a menu row doing its
       job — on a file that has never been saved there is no row, and hiding it
       would leave no way to choose a different file. */
    root.classList.toggle('da-has-replace', Boolean(url))
    return () => {
      root.classList.remove('da-needs-alt')
      root.classList.remove('da-has-replace')
    }
  }, [needsAlt, url])

  /* THE FILE, NOT THE THUMBNAIL OF IT. This screen draws the picture at the
     sheet's full width, and Payload was filling that with `adminThumbnail` —
     the 400px derivative — so a 1280px photograph arrived as a 400px file
     stretched to 720 and looked it.

     The collection is right to point `adminThumbnail` at the small one: it is
     what the LIST loads, forty rows at a time. Only this one `img` wants the
     original, so only this one `img` is repointed.

     THE OBSERVER IS THE POINT. Payload re-renders this block after a save and
     after the image editor closes, which puts the derivative back; without
     watching for that the picture silently softens the first time you save. */
  const filename =
    typeof savedDocumentData?.filename === 'string' ? savedDocumentData.filename : ''

  React.useEffect(() => {
    if (!url) return

    /* NAMES FOR THE THREE DISCS, while we are already in here.
     *
     * Payload gives the two image actions their name as visible text, which the
     * stylesheet clips to draw them as glyphs — so the accessible name survives
     * and the TOOLTIP does not, because `title` cannot be set from CSS. Remove
     * is worse: it is an icon-only button with no text and no `aria-label`, so
     * it had no name at all, before any of this.
     *
     * Both are one attribute each, and this is the only component mounted on
     * the screen that can set them. */
    const NAMES: [string, string][] = [
      ['.file-field__previewSizes', 'Preview sizes'],
      ['.file-field__edit', 'Edit image'],
      ['.file-details__remove', 'Remove file'],
    ]

    const swap = () => {
      /* A FILE THAT NOBODY HAS DESCRIBED YET IS NOT "[Untitled]". A description
         is optional at the door now — files land in a batch and get described
         after — and Payload names a document by the field it titles with, so an
         undescribed one arrived in the breadcrumb as the word it uses for
         nothing at all. It has a name: the file's own. */
      if (filename) {
        for (const el of document.querySelectorAll<HTMLElement>('.render-title')) {
          const shown = el.textContent?.trim()
          /* Two ways Payload names a file it cannot name. A document that has
             never been saved is "[Untitled]"; a saved one with no description
             falls back to the row's own id, which is how the drawer came to be
             announced to a screen reader as "7". */
          if (shown === '[Untitled]' || (needsAlt && shown !== filename)) {
            el.textContent = filename
          }
        }
      }

      const img = document.querySelector<HTMLImageElement>('.file-details .thumbnail img')
      // The guard is what keeps this from feeding itself: setting `src` is an
      // attribute mutation, which is one of the things being watched.
      if (img && img.getAttribute('src') !== url) img.setAttribute('src', url)

      /* The sentence under Description, promoted from an explanation to the
         request, for as long as the answer is missing. Written here rather
         than in CSS because a screen reader has to hear it — the input's
         `aria-describedby` points at this very element. */
      const note = document.querySelector<HTMLElement>(
        '.field-type:has(#field-alt) .field-description',
      )
      if (note) {
        const wanted = needsAlt
          ? 'This file still needs a description before it can go on a page.'
          : "For readers who can't see it. Needed to publish."
        if (note.textContent !== wanted) note.textContent = wanted
      }

      for (const [selector, name] of NAMES) {
        const el = document.querySelector<HTMLElement>(selector)
        if (!el) continue
        if (el.getAttribute('title') !== name) el.setAttribute('title', name)
        // Only where there is no text to name it — overriding a visible label
        // with an invisible one is how a button ends up called two things.
        if (!el.textContent?.trim() && el.getAttribute('aria-label') !== name) {
          el.setAttribute('aria-label', name)
        }
      }
    }

    swap()
    const watch = new MutationObserver(swap)
    watch.observe(document.body, {
      attributeFilter: ['src', 'title', 'aria-label'],
      attributes: true,
      childList: true,
      subtree: true,
    })
    return () => watch.disconnect()
  }, [filename, needsAlt, url])
  // Only a path needs the origin. A file in R2 already has its full address,
  // and prefixing it would copy "https://hub…https://img…" to the clipboard.
  const absolute =
    url && url.startsWith('/') && typeof window !== 'undefined' ? `${window.location.origin}${url}` : url
  const { copied, copy } = useCopy(absolute)

  const rows: MenuRow[] = []

  /*
   * EVERY VERB ABOUT THE FILE, IN ONE SHORT LIST.
   *
   * They were spread across the sheet for a while — the link beside the name,
   * download and replace as discs on the picture — and spread is what a menu
   * exists to undo: four things done to one file, read in a column, in the
   * corner the ✕ used to sit in. What stays on the picture is the pair that
   * changes the picture itself.
   *
   * DOWNLOAD FETCHES THE BYTES rather than linking to them. A plain link does
   * what the file's type decides — a browser shows a JPEG and saves a zip —
   * so one label could not be true of both. The blob makes the verb true for
   * every type, with the plain link as the fallback when a store on another
   * origin refuses the fetch.
   */
  if (url) {
    rows.push(
      {
        icon: copied ? <Check aria-hidden="true" {...ICON} /> : <Link2 aria-hidden="true" {...ICON} />,
        key: 'copy',
        label: copied ? 'Link copied' : 'Copy file link',
        onClick: copy,
      },
      {
        icon: <Download aria-hidden="true" {...ICON} />,
        key: 'download',
        label: 'Download file',
        onClick: async () => {
          try {
            const res = await fetch(url, { credentials: 'include' })
            if (!res.ok) throw new Error(String(res.status))
            const blob = await res.blob()
            const href = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = href
            link.download = filename || 'file'
            document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(href)
          } catch {
            window.open(url, '_blank', 'noopener')
          }
        },
      },
      {
        icon: <Replace aria-hidden="true" {...ICON} />,
        key: 'replace',
        label: 'Replace file',
        note: 'Clears this file so you can choose another. Nothing changes until you save.',
        /* Payload's own remove is hidden (custom.scss) and pressed from here,
           the same way the lightbox stands in for its preview button. */
        onClick: () => {
          document.querySelector<HTMLButtonElement>('.doc-drawer .file-details__remove')?.click()
        },
      },
    )
  }

  return (
    <>
      <DocBar
        before={<SheetCancel />}
        collection="media"
        menuHost=".da-filename"
        deleteWarning="Anything using it — a cover, a card, a download — loses its file."
        noun="file"
        rows={rows}
      />
      {/* A LIGHTBOX NEEDS SOMETHING TO SHOW. It rendered for anything with a
          url, so ⤢ on a zip built an `<img src="…/fonts.zip">` and opened a
          full-screen black veil with a close button in it — which reads as the
          app having broken.

          RENDERED BEFORE THE OTHER TWO so the corner reads in the order it is
          tabbed: crop, view, download, replace. Both portal into the same host,
          so JSX order here is DOM order there, and the columns in custom.scss
          follow it. */}
      {url && isImage ? <MediaLightbox alt={alt} url={url} /> : null}
      {url ? <FileName filename={filename} /> : null}
    </>
  )
}

/**
 * What the file IS, as three labelled facts.
 *
 * PAYLOAD RUNS THEM TOGETHER: "108KB - 1280x720 - image/jpeg", one line, three
 * facts, two hyphens doing the work of punctuation, under a filename that is a
 * fourth. Nothing in it is labelled, so every reader parses the same string
 * again — and the one people actually come for, the dimensions, is in the
 * middle where it is hardest to find.
 *
 * The same three, from the fields Payload already stores, each under its own
 * word. `image/jpeg` becomes JPEG because the MIME type is how a server names a
 * file and not how a person does; 1280x720 becomes 1280 × 720 with the sign
 * that means "by"; 108KB becomes 108 KB, which is a number and a unit rather
 * than a word.
 *
 * Portalled into Payload's own `.file-meta`, so it sits under the filename
 * where the line it replaces was — see the CSS that hides that line.
 */
export function MediaFacts() {
  const { savedDocumentData } = useDocumentInfo()
  const host = useHost('.file-meta')

  if (!host) return null

  const bytes = Number(savedDocumentData?.filesize)

  /* Binary units, because that is what an operating system will show for the
     same file. One decimal past a megabyte and none below it: "1.4 MB" is worth
     reading, "108.3 KB" is three characters of noise. */
  const size = Number.isFinite(bytes)
    ? bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`
    : null

  /* WHEN IT ARRIVED IS A FACT ABOUT THE FILE, so it stands with the others
     rather than alone at the foot of the sheet in a different type. Type,
     dimensions, size and date are one answer to "what is this" — four labelled
     pairs read in one pass, where a stray row under the form is a second stop
     for a fourth fact of the same kind. */
  const created = adminDate(savedDocumentData?.createdAt)

  /*
   * TWO FACTS, NOT FOUR.
   *
   * Type went because the filename under the picture already ends in it —
   * `.jpg` said twice, once as a label and once as three letters of the name
   * above it. Dimensions went because nothing on this screen acts on them: the
   * site picks a derivative, the crop tool shows its own numbers, and a reader
   * who wants the pixels is looking at the picture.
   *
   * What is left is what someone actually asks of a file they did not upload:
   * how heavy it is, and when it arrived.
   */
  /* WHEN FIRST, HOW HEAVY SECOND. A library is scanned by age — what landed
     this week, what has been here since August — and the weight is the thing
     you check once, about one file, usually before sending it somewhere. */
  const facts: [string, string][] = []
  if (created) facts.push(['Created', created])
  if (size) facts.push(['Size', size])

  if (!facts.length) return null

  return createPortal(
    <dl className="da-facts">
      {facts.map(([label, value]) => (
        <div className="da-facts__row" key={label}>
          <dt className="da-facts__label">{label}</dt>
          <dd className="da-facts__value">{value}</dd>
        </div>
      ))}
    </dl>,
    host,
  )
}

/**
 * The file at full size, over everything.
 *
 * IT REPLACES PAYLOAD'S "PREVIEW SIZES", which answered a different question:
 * it opened a drawer listing the derivatives — original, card, thumbnail — each
 * with its filename and byte count, for choosing between them. Nobody on this
 * install chooses between them; the sizes are generated and the site picks. What
 * the control is reached for is "let me see the picture", and 600px in a sheet
 * is not seeing it.
 *
 * So it opens the file itself, as large as the window allows, on a ground dark
 * enough to judge an edge against — and carries one control, because there is
 * one thing to do next.
 *
 * THE BUTTON IS OURS TOO. Payload's is hidden (custom.scss) rather than
 * intercepted: a click handler that has to cancel someone else's is a race with
 * whatever they change next, and this way the disc in the corner and the thing
 * it opens are the same component's.
 */
/**
 * The file's name, above the file.
 *
 * Payload prints it UNDER the picture with its own copy button beside it — a
 * button with no label and two tooltips inside it, which a screen reader read
 * as "Copy URL Copy URL". Both stand down (custom.scss) and this takes their
 * place, above the picture, where the name of a thing goes.
 *
 * THE VERBS ARE NOT HERE ANY MORE. Copying the link, downloading and replacing
 * moved into the ⋯ in the sheet's corner: they are a short list of things done
 * to one file, and a short list is what a menu is for. What stays on the
 * picture is the pair that changes the picture — crop and full size.
 */
function FileName({ filename }: { filename: string }) {
  const slot = useHost('.file-details > header')
  if (!slot) return null

  return createPortal(
    <div className="da-filename">
      <span className="da-filename__text">{filename}</span>
    </div>,
    slot,
  )
}

/**
 * Leaving without saving, said as a word.
 *
 * THE ✕ IN THE CORNER IS GONE and this is what replaced it. A disc in the
 * corner is a way out that has to be recognised; a button beside Save is one
 * that can be read, and it stands where the answer to "Save" belongs — the two
 * halves of the same question, side by side, rather than at opposite corners of
 * the sheet.
 *
 * It closes the modal by its own slug, and `DetailCloseGuard` intercepts the
 * click first when the form is dirty, so Cancel asks the same question the
 * backdrop and Escape ask.
 */
function SheetCancel() {
  const { drawerSlug } = useDocumentDrawerContext()
  const { closeModal } = useModal()

  if (!drawerSlug) return null

  return (
    <button className="da-bar__cancel da-bar__cancel--sheet" onClick={() => closeModal(drawerSlug)} type="button">
      Cancel
    </button>
  )
}

function MediaLightbox({ alt, url }: { alt: string; url: string }) {
  const [open, setOpen] = React.useState(false)
  const slot = useHost('.file-details > header')
  const closer = React.useRef<HTMLButtonElement | null>(null)
  const opener = React.useRef<HTMLButtonElement | null>(null)

  /* Escape closes and hands focus back to the disc that opened it — the half of
     "press Escape" that usually goes missing. */
  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      opener.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  /* The page behind must not scroll while a full-screen thing is over it. */
  React.useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closer.current?.focus()
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!slot) return null

  return (
    <>
      {createPortal(
        <button
          aria-label="View full size"
          className="da-expand"
          onClick={() => setOpen(true)}
          ref={opener}
          title="View full size"
          type="button"
        >
          <Expand aria-hidden="true" size={18} strokeWidth={2} />
        </button>,
        slot,
      )}

      {open
        ? createPortal(
            /* The ground closes on a click, which is what a dark field around a
               picture has meant since the first lightbox. The picture itself
               does not, so a mis-click on the thing you came to look at is not
               the thing that dismisses it. */
            <div
              aria-label={alt || 'Full size'}
              aria-modal="true"
              className="da-lightbox"
              onClick={() => setOpen(false)}
              role="dialog"
            >
              <button
                aria-label="Close"
                className="da-lightbox__close"
                onClick={() => setOpen(false)}
                ref={closer}
                title="Close"
                type="button"
              >
                <X aria-hidden="true" size={18} strokeWidth={2} />
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={alt}
                className="da-lightbox__img"
                onClick={(event) => event.stopPropagation()}
                src={url}
              />
            </div>,
            document.body,
          )
        : null}
    </>
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

  /* WHEN IT ARRIVED, AND NOT WHEN IT WAS LAST TOUCHED. "Last modified" was the
     first of the pair and it answered nothing: on a library where almost
     everything is saved the moment it is looked at, it says that somebody
     opened this recently — which is you, a second ago. The date worth keeping
     is the one that places the thing. */
  const created = adminDate(savedDocumentData?.createdAt)

  /* A document that has never been saved has none, and a label with nothing
     after it is worse than nothing at the end of the rail. */
  if (!created) return null

  return (
    <dl className="da-meta">
      <div className="da-meta__row">
        <dt className="da-meta__label">Created</dt>
        <dd className="da-meta__value">{created}</dd>
      </div>
    </dl>
  )
}

/** The name the article screen and the account screen registered it under. */
export { DocMeta as ArticleMeta }
