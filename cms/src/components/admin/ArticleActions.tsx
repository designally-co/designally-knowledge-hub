'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SaveButton, useDocumentInfo, useFormFields, useFormModified } from '@payloadcms/ui'

import './ArticleActions.css'

/**
 * The overview's actions: the way into the writing surface, and the two things
 * you do with a finished article.
 *
 * DUPLICATE AND DELETE ARE NOT HERE, deliberately. Payload already puts both in
 * the document controls at the top of every document, with the confirmation
 * step and the redirect-after-delete already wired. A second Delete of my own
 * beside them would be a second implementation of the most destructive action in
 * the admin, and the two would eventually disagree.
 *
 * EDIT IS A LINK, NOT A BUTTON, because it goes somewhere — middle-click and
 * open-in-new-tab work, and the browser shows the destination on hover.
 *
 * IT ALSO REFUSES TO LEAVE UNSAVED WORK BEHIND. The two layers share one form,
 * so an edit made in the rail and not yet saved is still pending when you cross
 * to the other layer, and crossing would discard it. Rather than let that
 * happen quietly the control says so and stops.
 */
export function ArticleActions() {
  const { id } = useDocumentInfo()
  const router = useRouter()
  const modified = useFormModified()
  const slug = useFormFields(([fields]) => fields?.slug?.value)
  const status = useFormFields(([fields]) => fields?.status?.value)

  const [copied, setCopied] = React.useState(false)

  const path = typeof slug === 'string' && slug ? `/en/articles/${slug}` : null
  const isPublished = status === 'published'

  const copy = async () => {
    if (!path) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused. Say nothing rather than claim a copy
      // that did not happen — the link is visible on the page either way.
    }
  }

  return (
    <div className="da-actions">
      {/* SAVE LIVES HERE NOW, because the bar it used to live in is gone. The
          overview carried three stacked headers — the breadcrumb, the document
          tabs and a row of timestamps with Save on the end — and two of them
          said nothing the rail does not. Payload's own `SaveButton` is used
          rather than a button of mine wired to `submit()`: it already knows
          about validation state, the disabled-while-saving case and the
          keyboard shortcut.

          ITS WEIGHT COMES FROM THE FORM, NOT FROM A STYLESHEET. Save and Edit
          were two full-width pills stacked at the top of the rail, and on a
          document with nothing changed — which is most of the time an article is
          open — the accent sat on Save, an action with nothing to do. It is a
          ghost while the form is clean and takes the accent the moment there is
          something to write, so the strongest thing in the rail is always the
          thing worth doing next. */}
      <div className={`da-actions__save${modified ? ' da-actions__save--dirty' : ''}`}>
        <SaveButton />
        {modified ? <p className="da-actions__unsaved">Unsaved changes</p> : null}
      </div>

      {/* An unsaved document has no id to write to yet. */}
      {id ? (
        modified ? (
          <p className="da-actions__blocked">
            Save first — the writing surface and this page are one form, and
            leaving now would drop the change you just made.
          </p>
        ) : (
          <Link className="da-actions__edit" href={`/admin/collections/articles/${id}/write`}>
            Edit the article
          </Link>
        )
      ) : null}

      {/* ICONS, NOT WORDS. Neither of these changes the document — one opens the
          public page, the other puts its address on the clipboard — so neither
          earns a label beside the one control on this layer that does. Both
          carry their name in `aria-label` and `title`, which is what a glyph
          costs. */}
      <div className="da-actions__quiet">
        {/* Only when there is a public page to open. A draft's URL 404s, and a
            control that offers to show you something that is not there is worse
            than no control. */}
        {isPublished && path ? (
          <a
            aria-label="View on site"
            className="da-iconbtn"
            href={path}
            rel="noreferrer"
            target="_blank"
            title="View on site"
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="18"
              viewBox="0 0 18 18"
              width="18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 3.5H4.5A1.5 1.5 0 003 5v8.5A1.5 1.5 0 004.5 15H13a1.5 1.5 0 001.5-1.5V11"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
              <path d="M10.5 3.5h4v4M14.5 3.5L8 10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </a>
        ) : null}
        {path ? (
          /* The confirmation is the glyph itself: the link icon becomes a tick
             for two seconds. With no label to change, the icon has to carry the
             feedback, and the accessible name changes with it. */
          <button
            aria-label={copied ? 'Link copied' : 'Copy link'}
            className="da-iconbtn"
            onClick={copy}
            title={copied ? 'Link copied' : 'Copy link'}
            type="button"
          >
            {copied ? (
              <svg
                aria-hidden="true"
                fill="none"
                height="18"
                viewBox="0 0 18 18"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 9.5l3.5 3.5L14 5.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                fill="none"
                height="18"
                viewBox="0 0 18 18"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.5 10.5a2.5 2.5 0 003.5 0l2-2a2.5 2.5 0 00-3.5-3.5l-.6.6M10.5 7.5a2.5 2.5 0 00-3.5 0l-2 2a2.5 2.5 0 003.5 3.5l.6-.6"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            )}
          </button>
        ) : null}
      </div>

    </div>
  )
}

/**
 * Delete, at the very end of the rail.
 *
 * IT MOVED AWAY FROM THE THINGS IT RESEMBLES. This used to sit two rows under
 * Save and Edit, in the same group, at 18px — the smallest target in the rail
 * belonging to the only action that cannot be undone. Distance is the cheapest
 * protection there is: it is now last, below the timestamps, behind its own
 * rule, and nothing else lives down there to misclick from.
 *
 * REBUILT RATHER THAN MOVED. Payload's own `DeleteDocument` lives in the dot
 * menu on the control bar the overview no longer has, and importing it directly
 * does not work: `@payloadcms/ui/elements/*` is a real subpath in the package's
 * exports map, but reaching a client component through a second specifier gives
 * it a second module instance, and its `useConfig()` reads a context that was
 * never populated — measured, as `Cannot destructure property 'config' … as it
 * is undefined`, which took the whole screen down. So this is a plain DELETE
 * against the REST API, which is what Payload's control calls in the end.
 *
 * The confirmation is a second click on the same control rather than a modal —
 * the pattern the Thai panel in this rail already uses — so the destructive path
 * always costs two deliberate actions and never a stray one.
 */
export function ArticleDelete() {
  const { id } = useDocumentInfo()
  const router = useRouter()

  const [confirming, setConfirming] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (!id) return null

  const destroy = async () => {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/articles/${id}`, { credentials: 'include', method: 'DELETE' })
      if (!res.ok) throw new Error(String(res.status))
      /* Back to the list, and `refresh()` so it re-fetches rather than showing
         the deleted article from the router cache. */
      router.push('/admin/collections/articles')
      router.refresh()
    } catch {
      setDeleting(false)
      setError('That did not delete. The article is unchanged.')
    }
  }

  if (!confirming) {
    return (
      <div className="da-delete">
        <button className="da-delete__ask" onClick={() => setConfirming(true)} type="button">
          Delete this article
        </button>
      </div>
    )
  }

  return (
    <div className="da-delete">
      <div className="da-delete__confirm">
        <p className="da-delete__question">Delete this article? This cannot be undone.</p>
        <div className="da-delete__row">
          <button
            className="da-delete__yes"
            disabled={deleting}
            onClick={destroy}
            type="button"
          >
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </button>
          <button
            className="da-delete__no"
            disabled={deleting}
            onClick={() => setConfirming(false)}
            type="button"
          >
            Keep
          </button>
        </div>
        {error ? (
          <p className="da-delete__error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/**
 * When the article was last touched, and when it was made.
 *
 * PROVENANCE, NOT AN ACTION — so it sits at the foot of the rail rather than in
 * the bar it came from, where it was the widest thing in a row whose only real
 * job was Save. It answers "is this the version I remember?", which is a
 * question you ask once on arrival and never again while working.
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
