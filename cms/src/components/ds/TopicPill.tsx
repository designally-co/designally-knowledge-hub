'use client'
import React from 'react'

/* TopicPill — a white, fully-rounded "sticker" pill used in the Topics cloud.
   The rotation is passed as a custom property; below 36em the stylesheet
   ignores it. */
export interface TopicPillProps {
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  rotate?: number
  active?: boolean
  href?: string
  onClick?: React.MouseEventHandler
  className?: string
  style?: React.CSSProperties
  [key: string]: unknown
}

export function TopicPill({
  children,
  size = 'md',
  rotate = 0,
  active = false,
  href,
  onClick,
  className = '',
  style,
  ...rest
}: TopicPillProps) {
  const classes = [
    'topic-pill',
    `topic-pill--${size}`,
    active ? 'topic-pill--active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const css = { '--pill-rotate': `${rotate}deg`, ...style } as React.CSSProperties

  if (href) {
    return (
      <a href={href} onClick={onClick} className={classes} style={css} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      style={css}
      aria-pressed={active || undefined}
      {...rest}
    >
      {children}
    </button>
  )
}
