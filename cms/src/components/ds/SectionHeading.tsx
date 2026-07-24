import React from 'react'
import { Icon } from './Icon'
import { IconButton } from './IconButton'

/* SectionHeading — the large editorial serif section title. Optional circular
   next-arrow (IconButton) or a text link on the right. `onDark` for black
   bands. The text-link form draws its arrow with a plain Icon rather than
   nesting a <button> inside the <a>. */
export interface SectionHeadingProps {
  children?: React.ReactNode
  action?: React.ReactNode // "arrow" | node | null
  actionLabel?: string
  onArrow?: React.MouseEventHandler
  onDark?: boolean
  align?: 'left' | 'center'
  className?: string
  style?: React.CSSProperties
}

export function SectionHeading({
  children,
  action,
  actionLabel,
  onArrow,
  onDark = false,
  align = 'left',
  className = '',
  style,
}: SectionHeadingProps) {
  const classes = [
    'section-heading',
    align === 'center' ? 'section-heading--center' : '',
    onDark ? 'section-heading--on-dark' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} style={style}>
      <h2 className="section-heading__title">{children}</h2>

      {action === 'arrow' && (
        <IconButton
          icon="arrow-right"
          variant={onDark ? 'inverse' : 'outline'}
          onClick={onArrow}
          label={`See more ${typeof children === 'string' ? children : ''}`.trim()}
        />
      )}

      {actionLabel && (
        <a href="#" onClick={onArrow} className="section-heading__link">
          {actionLabel}
          <Icon name="arrow-right" size={18} strokeWidth={2.25} />
        </a>
      )}

      {action && action !== 'arrow' && action}
    </div>
  )
}
