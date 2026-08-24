'use client'

import React from 'react'

import { CATEGORY_CHROME } from '../../lib/listingChrome'
import { categoryForTag } from '../../lib/tags'
import { useArticleFlags } from './articleFlags'
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

/* -------------------------------------------------------------------------- */
/* Thai / Summary                                                              */
/* -------------------------------------------------------------------------- */

/** Shared shape: a quiet word when it is fine, the accent when it is not. */
const FlagMark: React.FC<{ missing: boolean; ready: boolean; label: string; ok: string }> = ({
  missing,
  ready,
  label,
  ok,
}) => {
  /* Deliberately blank until the answer is known. A dash would read as "none",
     and guessing "fine" for a beat before flipping to "Missing" is worse than
     saying nothing for that beat. */
  if (!ready) return <span className="da-flag da-flag--pending" aria-hidden="true" />
  if (missing) return <span className="da-flag da-flag--missing">{label}</span>
  return <span className="da-flag da-flag--ok">{ok}</span>
}

export const ThaiCell: React.FC<CellProps> = ({ rowData }) => {
  const { ready, flags } = useArticleFlags(rowData?.id)

  /* A draft is not live, so it cannot be live-and-wrong. Saying "Missing" here
     would be technically true and practically noise. */
  if (rowData?.status !== 'published') return <span className="da-cell-empty">—</span>

  return <FlagMark label="Missing" missing={Boolean(flags?.thaiMissing)} ok="Yes" ready={ready} />
}

export const SummaryCell: React.FC<CellProps> = ({ rowData }) => {
  const { ready, flags } = useArticleFlags(rowData?.id)
  return <FlagMark label="Missing" missing={Boolean(flags?.summaryMissing)} ok="Yes" ready={ready} />
}
