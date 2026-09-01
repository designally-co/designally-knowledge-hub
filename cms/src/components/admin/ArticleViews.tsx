'use client'

import React from 'react'
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
      <DefaultEditView {...props} />
    </div>
  )
}
