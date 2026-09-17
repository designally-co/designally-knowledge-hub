import React from 'react'
import Link from 'next/link'

/* FilterChip — an outlined pill that narrows a listing. It is a link, so the
   filter lives in the URL and works without JavaScript; the active chip fills
   with ink. A sibling of Tag: same pill, but interactive. */
export interface FilterChipProps {
  href: string
  active?: boolean
  children: React.ReactNode
  className?: string
  [key: string]: unknown
}

export function FilterChip({ href, active = false, children, className = '', ...rest }: FilterChipProps) {
  return (
    <Link
      href={href}
      className={['filter-chip', active && 'filter-chip--active', className].filter(Boolean).join(' ')}
      aria-current={active ? 'true' : undefined}
      {...rest}
    >
      {children}
    </Link>
  )
}
