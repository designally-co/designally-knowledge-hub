import React from 'react'

/* ResourceFigure — the folder artwork a resource is represented by: a coloured
   document panel carrying the title and a category glyph, tucked behind a
   frosted folder pocket.

   Shared by the grid card and the detail page's hero so the two are literally
   the same object at two sizes. It was duplicated before, which is how the
   detail page ended up a plain coloured square while the card grew a pocket and
   a glyph — opening a card stopped looking like opening that card. */

export type ResourceGlyphName = 'grid' | 'type' | 'book' | 'image' | 'shapes'

/** Line glyphs drawn on the document panel, one per resource category. */
function Glyph({ name }: { name: ResourceGlyphName }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg className="resource-card__glyph" viewBox="0 0 24 24" aria-hidden="true">
      {name === 'grid' && (
        <g {...common}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </g>
      )}
      {name === 'type' && (
        <g {...common}>
          <path d="M4 6.5V4.5h16v2" />
          <path d="M12 4.5v15" />
          <path d="M8.5 19.5h7" />
        </g>
      )}
      {name === 'book' && (
        <g {...common}>
          <path d="M4 4.5h6a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H4z" />
          <path d="M20 4.5h-6a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H20z" />
        </g>
      )}
      {name === 'image' && (
        <g {...common}>
          <rect x="3" y="4.5" width="18" height="15" rx="2" />
          <circle cx="8.5" cy="10" r="1.6" />
          <path d="M3.5 17l5-5 4.5 4.5 3-3 4.5 4.5" />
        </g>
      )}
      {name === 'shapes' && (
        <g {...common}>
          <circle cx="7.5" cy="7.5" r="4" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
          <path d="M16.5 3.5l4 7h-8z" />
        </g>
      )}
    </svg>
  )
}

export interface ResourceFigureProps {
  title: string
  color?: string
  glyph?: ResourceGlyphName
  className?: string
}

export function ResourceFigure({
  title,
  color = 'var(--be-gold)',
  glyph,
  className = '',
}: ResourceFigureProps) {
  return (
    <div
      className={['resource-card__figure', className].filter(Boolean).join(' ')}
      style={{ '--doc-color': color } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="resource-card__doc">
        {glyph && <Glyph name={glyph} />}
        <span className="resource-card__doc-title">{title}</span>
      </div>
      {/* The pocket blurs a duplicate of the panel rather than using
          backdrop-filter, which drops out when the folder mask composites. */}
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
  )
}
