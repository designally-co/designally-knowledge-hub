'use client'

import React from 'react'
import Link from 'next/link'

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

/**
 * The state, and — when there is one — the date it took.
 *
 * ONE COLUMN, BECAUSE THEY ARE ONE FACT. Status and Published Date were
 * neighbours saying the same thing twice: every published row read "Published"
 * beside a date, and every draft read "Draft" beside a blank, because the date
 * does not exist until publishing stamps it. Two columns of chrome for one
 * piece of information. Published rows now carry the date under the chip, the
 * way the tag carries its category, and a draft is simply a draft.
 *
 * IT SITS ON `publishedDate`, NOT ON `status`, AND READS THE ROW FOR BOTH.
 * A column sorts by the field it belongs to, and status has two values: sorting
 * by it groups the drafts and leaves twenty published rows in whatever order
 * they arrived. The date is what anyone actually sorts a library by, so the
 * date's column is the one that carries this cell — which is why neither half
 * comes from `cellData`.
 *
 * The date is formatted here rather than by Payload's date cell, which this
 * replaces: `d MMM yyyy`, the format the field's own picker displays.
 */
const publishedOn = (value: unknown): string => {
  if (typeof value !== 'string' || !value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export const StatusCell: React.FC<CellProps> = ({ rowData }) => {
  const isDraft = rowData?.status !== 'published'
  const date = isDraft ? '' : publishedOn(rowData?.publishedDate)

  return (
    <span className="da-status">
      <span className={`da-chip ${isDraft ? 'da-chip--draft' : 'da-chip--published'}`}>
        {isDraft ? 'Draft' : 'Published'}
      </span>
      {date ? <span className="da-status__date">{date}</span> : null}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Tag                                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The tag, over the category it belongs to.
 *
 * It used to carry the category's band colour as a dot as well. Those tints are
 * pale by design — they are made to sit behind a headline — so at 8px the dot
 * was a grey speck in front of every row, indenting the column to say what the
 * line under the tag already says in words.
 */
export const TagCell: React.FC<CellProps> = ({ cellData }) => {
  const tag = typeof cellData === 'string' ? cellData : ''
  if (!tag) return <span className="da-cell-empty">—</span>

  const category = categoryForTag(tag)

  return (
    <span className="da-tag">
      {tag}
      {category ? <span className="da-tag__cat">{category}</span> : null}
    </span>
  )
}

/**
 * A resource's category, by name.
 *
 * Payload's relationship cell expects a bare id and fetches the name itself;
 * this list arrives with the category already populated, and handed the whole
 * document that cell printed "<No Category>" on every row. The name is right
 * there, so it is simply shown — with a fetch of all categories (a handful,
 * once per page) for the case where only the id arrives.
 */
let categoryNames: Promise<Record<string, string>> | null = null
function loadCategoryNames(): Promise<Record<string, string>> {
  categoryNames ??= fetch('/api/resource-categories?limit=0&depth=0&select[name]=true', {
    credentials: 'include',
  })
    .then((r) => r.json())
    .then((j: { docs?: { id: number | string; name?: string }[] }) =>
      Object.fromEntries((j.docs ?? []).map((d) => [String(d.id), d.name ?? ''])),
    )
    .catch(() => {
      categoryNames = null
      return {}
    })
  return categoryNames
}

export const ResourceCategoryCell: React.FC<CellProps> = ({ cellData }) => {
  const populated =
    cellData && typeof cellData === 'object' && 'name' in cellData
      ? String((cellData as { name?: unknown }).name ?? '')
      : ''
  const id = typeof cellData === 'number' || typeof cellData === 'string' ? String(cellData) : ''
  const [looked, setLooked] = React.useState('')

  React.useEffect(() => {
    if (populated || !id) return
    let live = true
    void loadCategoryNames().then((names) => {
      if (live) setLooked(names[id] ?? '')
    })
    return () => {
      live = false
    }
  }, [populated, id])

  const name = populated || looked
  if (!name) return <span className="da-cell-empty">—</span>
  return <span>{name}</span>
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
