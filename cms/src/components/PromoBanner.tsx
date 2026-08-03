import React from 'react'

import { Icon } from '@/components/ds'

/**
 * PromoBanner — the shared "browse the category" banner used by every homepage
 * section (Case Studies, Insights, Workflows). Each instance has the identical
 * font, label, outline circular-arrow button, background pattern, and a
 * right-hand graphic; sections vary only the colour (a `--promo-bg` custom
 * property set on the wrapper `className`) and the graphic.
 *
 * `man-reading.png` is the placeholder art shared by all banners until the
 * per-section illustrations arrive — pass a different `graphic` to override.
 */
type PromoBannerProps = {
  label: string
  href: string
  className?: string
  graphic?: string
  ariaLabel?: string
}

export function PromoBanner({
  label,
  href,
  className = '',
  graphic = '/man-reading.png',
  ariaLabel,
}: PromoBannerProps) {
  return (
    <a
      className={['promo-banner', className].filter(Boolean).join(' ')}
      href={href}
      aria-label={ariaLabel}
    >
      <span className="promo-banner__content">
        <span className="promo-banner__label">{label}</span>
        <span className="promo-banner__icon" aria-hidden="true">
          <Icon name="arrow-right" size={24} strokeWidth={1.8} />
        </span>
      </span>
      <img
        className="promo-banner__art"
        src={graphic}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </a>
  )
}
