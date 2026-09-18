import React from 'react'

import { Icon } from '@/components/ds'

/**
 * PromoBanner — the shared "browse the category" banner used by every homepage
 * section (Case Studies, Insights, Workflows). Each instance has the identical
 * font, label, outline circular-arrow button, background pattern, and a
 * right-hand graphic; sections vary only the colour (a `--promo-bg` custom
 * property set on the wrapper `className`) and the graphic.
 *
 * Pass `ctaLabel` to swap the arrow for a line of plain text. It is not a
 * button of its own: the whole banner is the link. `arrow={false}` drops the
 * arrow and leaves the label alone.
 *
 * Each section passes its own `graphic` from /public/promo; `man-reading.png`
 * is the fallback for a banner that has none.
 */
type PromoBannerProps = {
  label: string
  ctaLabel?: string
  arrow?: boolean
  href: string
  className?: string
  graphic?: string
  ariaLabel?: string
}

export function PromoBanner({
  label,
  ctaLabel,
  arrow = true,
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
        {ctaLabel ? (
          <span className="promo-banner__cta">{ctaLabel}</span>
        ) : (
          arrow && (
            <span className="promo-banner__icon" aria-hidden="true">
              <Icon name="arrow-right" size={24} strokeWidth={1.8} />
            </span>
          )
        )}
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
