'use client'
import React from 'react'
import { Icon } from './Icon'

/* Button — the brand's pill button. Fully-rounded, tight bold grotesque label.
   Styling lives in styles/components.css (.btn). Press feedback is :active, so
   it fires for touch and keyboard too. */
export interface ButtonProps {
  children?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'inverse'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  iconRight?: string
  href?: string
  onClick?: React.MouseEventHandler
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
  style?: React.CSSProperties
  [key: string]: unknown
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  href,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  style,
  ...rest
}: ButtonProps) {
  const iconSize = { sm: 15, md: 17, lg: 19 }[size] || 17
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, className].filter(Boolean).join(' ')

  const inner = (
    <>
      {icon && <Icon name={icon} size={iconSize} strokeWidth={2.25} />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} size={iconSize} strokeWidth={2.25} />}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        onClick={disabled ? undefined : onClick}
        className={classes}
        style={style}
        aria-disabled={disabled || undefined}
        {...rest}
      >
        {inner}
      </a>
    )
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={classes}
      style={style}
      {...rest}
    >
      {inner}
    </button>
  )
}
