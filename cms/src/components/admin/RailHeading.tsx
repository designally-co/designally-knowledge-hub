'use client'

import React from 'react'

import './RailHeading.css'

/**
 * A section heading for the editor's right rail.
 *
 * The rail holds every decision about a document that is not the document —
 * when it goes out, where it is filed, what it looks like on a card. Ungrouped
 * that is a column of eight unrelated controls, and the only way to find the
 * one you want is to read all of them. Three headings turn it into three short
 * lists you can skip between.
 *
 * One component, used three times: the text comes from the `ui` field's own
 * `label`, so a new section is a config entry rather than another entry in the
 * import map. A real heading element rather than a CSS `::before`, so it also
 * exists for a screen reader walking the rail by heading.
 */

type Props = {
  field?: { label?: unknown }
}

export const RailHeading: React.FC<Props> = ({ field }) => {
  const label = typeof field?.label === 'string' ? field.label : ''
  if (!label) return null
  return <h3 className="da-rail-head">{label}</h3>
}
