import React from 'react'
import { Tag } from './Tag'

/* ResourceCard — the downloadable-resource tile. A coloured "document" panel
   (title reversed out in white) sits behind a frosted glass "folder pocket".
   `color` sets the document panel (a brand spot colour). `category` is the
   resource's own kind (Fonts, Image, Figma File, …) — a single tag, distinct
   from the article tag taxonomy. */
export interface ResourceCardProps {
  title: string
  date?: string
  category?: string
  color?: string
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
        <div className="resource-card__pocket">
          <div className="resource-card__pocket-cover">
            <span className="resource-card__pocket-cover-title">{title}</span>
          </div>
        </div>
        <svg className="resource-card__edge" viewBox="0 0 200 100" preserveAspectRatio="none">
          <path
            d="M0,22 Q0,8 16,8 L60,8 C82,8 78,22 100,22 L184,22 Q200,22 200,36"
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {category && (
        <div className="resource-card__tags">
          <Tag>{category}</Tag>
        </div>
      )}
      <h3 className="resource-card__title">{title}</h3>
      {date && <p className="resource-card__date">{date}</p>}
    </a>
  )
}
