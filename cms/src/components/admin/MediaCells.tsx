'use client'

import React from 'react'
import Link from 'next/link'
import { Thumbnail, useListDrawerContext } from '@payloadcms/ui'

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
 * THE PICTURE IS IN FRONT OF THE NAME, the way an article's cover is in front
 * of its title — one column, recognised and read in one move.
 *
 * IT USED TO BE A COLUMN OF ITS OWN, and the reason was real: Payload hands a
 * custom cell only `cellData, collectionSlug, field, rowData, viewType, link`
 * — measured, by logging the props — with no `onClick`. Selection inside a list
 * drawer is wired by `DefaultCell`, which renders
 * `button.default-cell__first-cell` when it is handed one, so a custom cell in
 * the first column silently destroyed "Choose from existing": the drawer filled
 * with pictures that could not be picked, and nothing errored.
 *
 * THE HANDLE IS THE DRAWER ITSELF. `RenderDefaultCell` publishes its props on a
 * context — `useCellProps()` — but that is no use here: the table renders each
 * column into `renderedCells` on the SERVER, so a custom cell is never inside
 * that provider and reads null. Tried, and the row fell through to its link:
 * clicking a picture asked "Leave without saving" instead of choosing it.
 *
 * `useListDrawerContext()` is a different thing. The drawer's provider wraps the
 * whole list, so it IS an ancestor of this cell once hydrated, and it carries
 * `isInDrawer` and the same `onSelect` that Payload's own first cell calls. So
 * this one makes the same swap: a button that selects while a drawer is open, a
 * link to the file otherwise.
 */

type MediaRow = {
  id?: number | string
  url?: string | null
  filename?: string | null
  mimeType?: string | null
  sizes?: { thumbnail?: { url?: string | null } | null } | null
}

type CellProps = {
  cellData?: unknown
  rowData?: MediaRow
}

/**
 * The file's row: the picture, then what it is called.
 *
 * `Thumbnail` is Payload's own — it ships the states this needs and they are
 * easy to forget: a shimmer while the file loads, and a file icon when there is
 * nothing to show. That second case is not an edge case here, since this
 * collection accepts PDFs, which have no image at all.
 */
export const MediaRowTitle: React.FC<CellProps & { link?: boolean }> = ({ cellData, rowData }) => {
  /* `{}` outside a drawer — the context's own default — so this is safe on the
     full list, where the row is a link. See the note above. */
  const { isInDrawer, onSelect } = useListDrawerContext()

  const name =
    typeof cellData === 'string' && cellData.trim() ? cellData : rowData?.filename || 'Untitled'
  const src = rowData?.sizes?.thumbnail?.url || rowData?.url || undefined

  const inner = (
    <>
      <Thumbnail
        className="da-media-thumb"
        doc={{ filename: rowData?.filename ?? '' }}
        fileSrc={src}
        size="small"
      />
      <span className="da-row__name">{name}</span>
    </>
  )

  const id = rowData?.id

  /* In a drawer the row is a chooser, not a link — the same swap Payload makes,
     from the same handler it would have called. */
  if (isInDrawer && typeof onSelect === 'function') {
    return (
      <button
        className="da-row__id da-row__id--pick"
        onClick={() =>
          onSelect({
            collectionSlug: 'media',
            /* `Data` is Payload's own index-signature type; the row shape here
               is a narrowed view of the same object. */
            doc: (rowData ?? {}) as Record<string, unknown>,
            docID: String(id),
          })
        }
        type="button"
      >
        {inner}
      </button>
    )
  }

  if (id === undefined) {
    return <span className="da-row__id">{inner}</span>
  }

  return (
    <Link className="da-row__id da-row__id--link" href={`/admin/collections/media/${String(id)}`}>
      {inner}
    </Link>
  )
}

/** The picture on its own — kept for anywhere that still asks for the column. */
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
