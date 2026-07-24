'use client'
import React from 'react'
import { Icon } from './Icon'

/* IconButton — circular icon-only control. `label` supplies the accessible
   name (the icon is aria-hidden). */
export interface IconButtonProps {
  icon?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'outline' | 'solid' | 'inverse' | 'ghost' | 'bare'
  label?: string
  onClick?: React.MouseEventHandler
  href?: string
  className?: string
  style?: React.CSSProperties
  [key: string]: unknown
}

export function IconButton({
  icon = 'arrow-right',
  size = 'md',
  variant = 'outline',
  label = '',
  onClick,
  href,
  className = '',
  style,
  ...rest
}: IconButtonProps) {
  const iconSize = { sm: 16, md: 20, lg: 24 }[size] || 20
  const classes = ['icon-btn', `icon-btn--${variant}`, `icon-btn--${size}`, className]
    .filter(Boolean)
    .join(' ')
  const glyph = <Icon name={icon} size={iconSize} strokeWidth={2} />

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        aria-label={label || icon}
        className={classes}
        style={style}
        {...rest}
      >
        {glyph}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label || icon}
      className={classes}
      style={style}
      {...rest}
    >
      {glyph}
    </button>
  )
}
