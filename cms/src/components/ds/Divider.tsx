import React from 'react'

/* Divider — a full-width 1px rule. `onDark` for dark bands. Spacing around it
   belongs to the layout that places it, via `className`. */
export interface DividerProps {
  tone?: 'onLight' | 'onDark'
  className?: string
}

export function Divider({ tone = 'onLight', className = '' }: DividerProps) {
  return (
    <hr
      className={['divider', tone === 'onDark' && 'divider--on-dark', className].filter(Boolean).join(' ')}
    />
  )
}
