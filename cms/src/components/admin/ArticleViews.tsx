'use client'

import React from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { DefaultEditView, useDocumentInfo } from '@payloadcms/ui'
import type { DocumentViewClientProps } from 'payload'

import './ArticleViews.css'

/**
 * The article as two layers: one to manage it, one to write it.
 *
 * WHY TWO. A published article is mostly read and rarely rewritten — you come to
 * it to check what went out, change its status, fix the share card, duplicate it
 * for next time. Landing on a live editor for all of that puts a caret in the
 * middle of finished prose, and every one of those visits is a chance to nudge a
 * paragraph without meaning to. So the document opens on the article as it
 * reads, with the controls around it, and writing is somewhere you choose to go.
 *
 * BOTH LAYERS ARE THE SAME FORM. Each renders Payload's own `DefaultEditView` —
 * the same fields, the same form state, the same Save, the same validation and
 * localisation. The difference is a class name on the wrapper and the CSS that
 * hangs off it: the overview hides the writing and shows a rendered copy of it,
 * and the writing surface hides everything that is not the writing.
 *
 * WHICH MEANS NOTHING IS UNMOUNTED, AND THAT IS THE POINT. The form submits
 * every field it holds, so a field that is merely out of sight still round-trips
 * its value. Rendering only a subset per view would post a document with the
 * rest missing — hiding is what keeps the two layers editing one document
 * instead of two halves of one.
 */

/**
 * The landing layer: the article as published, with the controls around it.
 * Route: /admin/collections/articles/:id
 */
export function ArticleOverview(props: DocumentViewClientProps) {
  /* A BODY CLASS, FOR THE SAME REASON THE WRITING SURFACE NEEDS ONE. The
     document tabs are a sibling of this component rendered above it, not a
     descendant, so no class on this div can reach them — scoping the rule to
     `.da-doc--overview` left the tabs row on screen and only two of the three
     headers went. Removed again on the way out, so every other document in the
     admin keeps its tabs. */
  React.useEffect(() => {
    document.body.classList.add('da-overview')
    return () => document.body.classList.remove('da-overview')
  }, [])

  return (
    <div className="da-doc da-doc--overview">
      <DefaultEditView {...props} />
    </div>
  )
}

/**
 * The way back, placed INTO the document's own control bar.
 *
 * A PORTAL, BECAUSE THE BAR IS NOT MINE TO RENDER. Writing mode hides every
 * other piece of admin chrome and leaves one bar — Payload's `doc-controls`,
 * kept because it owns Save, which is not worth reimplementing. This view
 * renders below that bar, so the only way to put a control inside it is to send
 * one there. The alternative slot Payload offers for view actions renders in the
 * app header, which is precisely the bar writing mode removes.
 *
 * IT REPLACES A GREAT DEAL. With the header, the breadcrumb and the tabs gone,
 * this is the only way out of the writing surface that is not the browser's back
 * button — so it is a real link to a real URL, and it says where it goes.
 */
function WriteBack() {
  const { id } = useDocumentInfo()
  const [host, setHost] = React.useState<Element | null>(null)

  /* The bar is a sibling rendered above this view, so it exists by the time an
     effect runs — but not necessarily on the first frame after a client-side
     navigation, hence the retry rather than a single query. */
  React.useEffect(() => {
    let frame = 0
    let tries = 0
    const find = () => {
      const el = document.querySelector('.doc-controls__content')
      if (el) return setHost(el)
      if (tries++ < 30) frame = requestAnimationFrame(find)
    }
    find()
    return () => cancelAnimationFrame(frame)
  }, [])

  if (!host || !id) return null

  return createPortal(
    <Link
      aria-label="Back to the article"
      className="da-iconbtn da-writeback"
      href={`/admin/collections/articles/${id}`}
      title="Back to the article"
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
          d="M11 3.5L5.5 9l5.5 5.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
      </svg>
    </Link>,
    host,
  )
}

/**
 * The writing layer: title, deck, cover and body, and nothing else.
 * Route: /admin/collections/articles/:id/write
 *
 * THE CLASS GOES ON `<body>`, NOT ON THIS DIV. Everything writing mode has to
 * remove — the nav, the app header, the breadcrumb, the document tabs — is an
 * ANCESTOR or a sibling of this component, so no class of its own can reach any
 * of it. A class on the body can, and it is removed again on the way out, so
 * the chrome comes back the moment you leave.
 */
export function ArticleWrite(props: DocumentViewClientProps) {
  React.useEffect(() => {
    document.body.classList.add('da-writing')
    return () => document.body.classList.remove('da-writing')
  }, [])

  return (
    <div className="da-doc da-doc--write">
      <WriteBack />
      <DefaultEditView {...props} />
    </div>
  )
}
