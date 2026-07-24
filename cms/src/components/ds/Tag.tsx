import React from 'react'

/* Tag — a small uppercase category pill with a hairline outline (no fill).
   Tones: "ink" (neutral), "warm" (rust, on resource cards), "onDark". */
export interface TagProps {
  children?: React.ReactNode
  tone?: 'ink' | 'warm' | 'onDark'
  className?: string
  style?: React.CSSProperties
  [key: string]: unknown
}

export function Tag({ children, tone = 'ink', className = '', style, ...rest }: TagProps) {
  const toneClass =
    { ink: 'tag--ink', warm: 'tag--warm', onDark: 'tag--on-dark' }[tone] || 'tag--ink'
  return (
    <span className={['tag', toneClass, className].filter(Boolean).join(' ')} style={style} {...rest}>
      {children}
    </span>
  )
}
