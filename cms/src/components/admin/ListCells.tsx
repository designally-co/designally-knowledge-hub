'use client'

import React from 'react'
import Link from 'next/link'

import { CATEGORY_CHROME } from '../../lib/listingChrome'
import { coverImageId, useCoverThumb } from './useCoverThumb'
import { categoryForTag } from '../../lib/tags'
import './ListCells.css'

/**
 * Cells for the Articles list, turning it into a triage view.
 *
 * The rule the whole thing is built on: a row that needs attention should look
 * different from one that does not, and a row that is fine should be quiet.
 * So the settled states are stated plainly in grey and only the actionable ones
 * take the accent. A column of green ticks would carry the same information and
 * none of the meaning — the eye would have to read every row to find the two
 * that matter.
 *
 * Sorting, filtering, pagination and selection are all still Payload's. These
 * are presentation only.
 */

type CellProps = {
  cellData?: unknown
  rowData?: Record<string, unknown>
}

/* -------------------------------------------------------------------------- */
/* Status                                                                      */
/* -------------------------------------------------------------------------- */

export const StatusCell: React.FC<CellProps> = ({ cellData }) => {
  const value = typeof cellData === 'string' ? cellData : ''
  const isDraft = value !== 'published'
  return (
    <span className={`da-chip ${isDraft ? 'da-chip--act' : 'da-chip--settled'}`}>
      {/* The dot is decoration and is hidden from assistive tech: the word
          beside it already carries the state, and a second announcement of the
          same fact is noise in a table read row by row. */}
      <span aria-hidden="true" className="da-chip__dot" />
      {isDraft ? 'Draft' : 'Published'}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Tag                                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The tag, with its category's own band colour as a dot.
 *
 * The colours are the ones the public site already wears — the background of
 * each section's graphic, from listingChrome — so a row here is coloured the
 * same way the page it becomes is. They are pale by design (they are made to
 * sit behind a headline), which is precisely why the category is also spelled
 * out in text: the dot is recognition, never the only carrier of the meaning.
 */
export const TagCell: React.FC<CellProps> = ({ cellData }) => {
  const tag = typeof cellData === 'string' ? cellData : ''
  if (!tag) return <span className="da-cell-empty">—</span>

  const category = categoryForTag(tag)
  const tint = category ? CATEGORY_CHROME[category].tint : 'transparent'

  return (
    <span className="da-tag">
      <span aria-hidden="true" className="da-tag__dot" style={{ backgroundColor: tint }} />
      <span className="da-tag__text">
        {tag}
        {category ? <span className="da-tag__cat">{category}</span> : null}
      </span>
    </span>
  )
}

/*
 * There were Thai and Summary cells here. They are gone, along with the
 * per-table `locale=all` fetch that fed them: Content Studio translates and
 * writes the dek as it publishes, so for articles arriving that way both
 * columns read "Yes" down every row — width spent to say nothing. The
 * dashboard still checks both, since an article written by hand here gets
 * neither done for it, and those sections disappear when they are empty.
 */

/* -------------------------------------------------------------------------- */
/* Title — the row's identity                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The article, as a picture and a name.
 *
 * A list of titles is a list of strings; a list of covers is a list of
 * articles. This is the one column that says which row you are looking at, and
 * a 40px crop of the thing itself is faster to recognise than any amount of
 * text — the same reason the media library got thumbnails.
 *
 * IT RENDERS THE LINK ITSELF. Payload's `DefaultCell` is what normally wraps
 * the first column in a `<Link>`, using the `link` and `linkURL` props it
 * receives; a custom Cell replaces that wrapper entirely, so a row built here
 * without an anchor would simply stop opening. The `link` prop is honoured
 * rather than assumed, because the same cell renders inside relationship
 * drawers where the row is a selection and must NOT navigate.
 *
 * AND IT IS NEXT'S `Link`, NOT A BARE `<a>`, which is what `DefaultCell` uses
 * and what the rest of this admin uses. A plain anchor made every row click a
 * full document load: the shell was rebuilt from scratch, and the sidebar
 * painted expanded for a frame before hydration re-applied the collapsed class
 * — a visible flash of the whole rail on the way from the list to an article.
 *
 * THE COVER COMES FROM WHICHEVER FIELD HOLDS IT. `coverUrl` is a plain string
 * and renders directly. `coverImage` is an upload, and the list fetches at
 * `depth: 0` — hardcoded in Payload's List view — so it arrives as a bare id
 * with no URL attached; `useCoverThumb` resolves those in ONE batched request
 * per page of rows rather than the per-row waterfall that once made the
 * lettered tile the better trade. The tile is still what a row falls back to,
 * now only when there is genuinely no cover to show.
 *
 * This column went blank-but-for-letters when Content Studio moved from setting
 * `coverUrl` to uploading into the media library and setting `coverImage` —
 * the better field to set, and the one this cell could not read.
 */
export const ArticleRowTitle: React.FC<
  CellProps & { link?: boolean; linkURL?: string }
> = ({ cellData, link, linkURL, rowData }) => {
  const title = typeof cellData === 'string' && cellData.trim() ? cellData : 'Untitled'

  const cover = rowData?.coverUrl
  const uploaded = rowData?.coverImage
  /* Already populated when the row came from somewhere that fetches deeper than
     the list does; an id everywhere else, which the hook resolves. */
  const embedded =
    uploaded && typeof uploaded === 'object' && typeof (uploaded as { url?: unknown }).url === 'string'
      ? (uploaded as { url: string }).url
      : null
  const fetched = useCoverThumb(embedded ? null : coverImageId(uploaded))
  const src =
    (typeof cover === 'string' && cover.trim() ? cover.trim() : null) ?? embedded ?? fetched

  const inner = (
    <>
      <span className="da-row__thumb">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="da-row__img" loading="lazy" src={src} />
        ) : (
          <span aria-hidden="true" className="da-row__initial">
            {title.trim().charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className="da-row__name">{title}</span>
    </>
  )

  const id = rowData?.id
  const href = linkURL || (id !== undefined ? `/admin/collections/articles/${String(id)}` : null)

  if (!link || !href) return <span className="da-row__id">{inner}</span>

  return (
    <Link className="da-row__id da-row__id--link" href={href}>
      {inner}
    </Link>
  )
}
