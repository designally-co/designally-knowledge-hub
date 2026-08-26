'use client'

import React from 'react'
import { Thumbnail } from '@payloadcms/ui'

import './MediaCells.css'

/**
 * The media library, with the pictures in it.
 *
 * IT WAS A TEXT TABLE OF IMAGES. Alt, Credit, Updated At, Created At — four
 * columns of words describing files nobody could see, sorted and identified by
 * ALT TEXT, which is a string written for screen readers rather than a name for
 * a picture. Choosing a cover meant recognising an image by its description.
 *
 * The library is the growing half of the Hub: every Content Studio publish
 * uploads its cover here, so it gains an image per article and is already the
 * source for most of them. A list you cannot look at gets worse every week.
 *
 * WHY PAYLOAD'S OWN `Thumbnail` AND NOT A RAW IMAGE TAG. It ships the states this
 * needs and they are easy to forget: a shimmer while the file loads, and a file
 * icon when there is nothing to show. That second case is not an edge case here
 * — this collection accepts PDFs, which have no image to render at all, and
 * SVGs, which get no resized derivatives.
 *
 * One thing it does NOT do is find the file: `Thumbnail` takes `fileSrc` and
 * uses `doc` only for the alt attribute. So the row picks the size — the 400px
 * `thumbnail` derivative when one exists, the original when it does not, which
 * is the SVG and PDF case.
 *
 * THE PICTURE GETS ITS OWN COLUMN, AND THAT IS NOT A STYLE CHOICE.
 *
 * The obvious placement is the `alt` column, since `useAsTitle` is `alt` and
 * that column is the row's identity. It cannot go there. Payload hands a CUSTOM
 * cell only:
 *
 *     cellData, collectionSlug, field, rowData, viewType, link
 *
 * — measured, by logging the props. No `onClick`. Selection inside a list
 * drawer is wired by `DefaultCell` itself, which renders
 * `button.default-cell__first-cell` when it is handed one; a custom cell is
 * never handed one and has no handle to call. So a custom cell on the title
 * column silently destroys "Choose from existing": the drawer fills with
 * pictures that cannot be picked, and nothing errors.
 *
 * Hence a separate `preview` column for the image, with `alt` left as Payload's
 * default cell so it keeps both its behaviours — the link in the list, the
 * select button in the drawer. The thumbnail is the recognition aid; the name
 * beside it stays the target.
 */

type MediaRow = {
  url?: string | null
  filename?: string | null
  mimeType?: string | null
  sizes?: { thumbnail?: { url?: string | null } | null } | null
}

type CellProps = {
  cellData?: unknown
  rowData?: MediaRow
}

/** The picture. The words live in the `alt` column beside it. */
export const MediaPreviewCell: React.FC<CellProps> = ({ rowData }) => {
  const src = rowData?.sizes?.thumbnail?.url || rowData?.url || undefined

  return (
    <Thumbnail
      className="da-media-thumb"
      doc={{ filename: rowData?.filename ?? '' }}
      fileSrc={src}
      size="small"
    />
  )
}

/**
 * An empty optional field, rendered as an em dash.
 *
 * Payload's placeholder for a null cell is the field name in angle brackets —
 * `<No Credit>` — which is developer syntax shown to an editor, and reads like
 * something is wrong rather than like a field nobody filled in. Credit is
 * optional; empty is the normal case, and should look normal.
 */
export const QuietTextCell: React.FC<CellProps> = ({ cellData }) => {
  const text = typeof cellData === 'string' ? cellData.trim() : ''
  if (!text) return <span className="da-media-cell__none">—</span>
  return <>{text}</>
}
