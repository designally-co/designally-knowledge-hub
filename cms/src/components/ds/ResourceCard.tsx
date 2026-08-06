import React from 'react'
import { Tag } from './Tag'
import { ResourceFigure, type ResourceGlyphName } from './ResourceFigure'

/* ResourceCard — the downloadable-resource tile. The folder artwork lives in
   ResourceFigure, shared with the detail page's hero so a card and the page it
   opens are the same object.

   Resources carry no uploaded imagery, so the panel *is* the artwork: `color`
   and `glyph` both come from the resource's category preset, which is why every
   Fonts card looks like every other Fonts card. Neither is derived from the
   card's position in the grid — a category has to keep the same identity
   wherever it lands, or the set stops reading as a taxonomy. */

export type { ResourceGlyphName }

export interface ResourceCardProps {
  title: string
  date?: string
  category?: string
  color?: string
  glyph?: ResourceGlyphName
  /** Formats the download ships in, e.g. ["Figma", "PDF"]. */
  formats?: string[]
  href?: string
  onClick?: React.MouseEventHandler
  className?: string
  style?: React.CSSProperties
}

export function ResourceCard({
  title,
  date,
  category,
  color = 'var(--be-gold)',
  glyph,
  formats,
  href = '#',
  onClick,
  className = '',
  style,
}: ResourceCardProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={['resource-card', className].filter(Boolean).join(' ')}
      style={style}
    >
      <ResourceFigure title={title} color={color} glyph={glyph} />
      {category && (
        <div className="resource-card__tags">
          <Tag>{category}</Tag>
        </div>
      )}
      <h3 className="resource-card__title">{title}</h3>
      {formats && formats.length > 0 && (
        <p className="resource-card__formats">{formats.join(' · ')}</p>
      )}
      {date && <p className="resource-card__date">{date}</p>}
    </a>
  )
}
