'use client'

import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { useFormFields } from '@payloadcms/ui'

import { useCover } from './CoverPreview'
import './ArticleRead.css'

/**
 * The article, read rather than edited. The overview's main column.
 *
 * THE SAME RENDERER THE PUBLIC PAGE USES. The body goes through `RichText` from
 * the Lexical package, which is exactly what `/[lang]/articles/[slug]` renders —
 * so this is the article, not a description of it, and a block that would break
 * on the live page breaks here where someone can see it. Writing a second
 * serialiser for the admin would have meant two answers to what an article looks
 * like, and the admin's would have been the one nobody checked.
 *
 * FROM FORM STATE, NOT FROM THE SAVED DOCUMENT. `useFormFields` means this
 * tracks the form rather than the database, so an unsaved change to the status
 * or the tag in the rail beside it does not leave the article showing a version
 * that no longer matches. It also means the preview is correct the instant you
 * come back from the writing surface, with no refetch.
 *
 * READ-ONLY IS THE POINT, AND IT IS STRUCTURAL. There is no input here to guard
 * — the inputs are elsewhere in the same form, hidden by the overview's own CSS
 * (ArticleViews.css). Nothing on this layer can take a keystroke.
 */
export function ArticleRead() {
  const title = useFormFields(([fields]) => fields?.title?.value)
  const summary = useFormFields(([fields]) => fields?.summary?.value)
  const body = useFormFields(([fields]) => fields?.body?.value)
  const { src, alt } = useCover()

  const headline = typeof title === 'string' ? title : ''
  const deck = typeof summary === 'string' ? summary : ''

  return (
    <article className="da-articleread">
      {/* HEADLINE, DECK, THEN COVER — the order the published page uses, and the
          order the writing surface puts them in. Rendering the picture first
          would make this layer the one place in the product where the article
          begins with something other than what it is called. */}
      {/* `h1` on purpose: on this layer the headline IS the heading of the
          document, and the surrounding admin chrome has none of its own. */}
      <h1 className="da-articleread__title">
        {headline || <span className="da-articleread__missing">Untitled</span>}
      </h1>

      {deck ? <p className="da-articleread__deck">{deck}</p> : null}

      {src ? (
        <div className="da-articleread__cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={alt || ''} className="da-articleread__hero" src={src} />
        </div>
      ) : null}

      {body ? (
        <div className="da-articleread__body">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <RichText data={body as any} />
        </div>
      ) : (
        <p className="da-articleread__empty">
          This article has no body yet. <strong>Edit</strong> opens the writing surface.
        </p>
      )}
    </article>
  )
}
