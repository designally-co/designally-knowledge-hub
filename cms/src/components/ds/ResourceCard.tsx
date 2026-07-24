import React from 'react'
import { Tag } from './Tag'

/* ResourceCard — the downloadable-resource tile. A coloured "document" panel
   (title reversed out in white) sits behind a frosted glass "folder pocket".
   `color` sets the document panel (a brand spot colour). */
export interface ResourceCardProps {
  title: string
  date?: string
  tags?: string[]
  color?: string
  href?: string
  onClick?: React.MouseEventHandler
  className?: string
  style?: React.CSSProperties
}

export function ResourceCard({
  title,
  date,
  tags = [],
  color = 'var(--be-gold)',
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
      style={{ '--doc-color': color, ...style } as React.CSSProperties}
    >
      <div className="resource-card__figure" aria-hidden="true">
        <div className="resource-card__doc">
          <span className="resource-card__doc-title">{title}</span>
        </div>
        <div className="resource-card__pocket" />
      </div>
      {tags.length > 0 && (
        <div className="resource-card__tags">
          {tags.map((t) => (
            <Tag key={t} tone="warm">
              {t}
            </Tag>
          ))}
        </div>
      )}
      <h3 className="resource-card__title">{title}</h3>
      {date && <p className="resource-card__date">{date}</p>}
    </a>
  )
}
