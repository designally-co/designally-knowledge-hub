import React from 'react'

import { Icon } from '@/components/ds'
import { PromoBanner } from '@/components/PromoBanner'

/**
 * PromoBannerCell — a section's banner as one tile in its row of cards: the
 * banner headed with the section's name and no arrow, and under it a ruled
 * "see all" line to the same place. Shared by Insights and Resources; the
 * section's `bannerClassName` sets only its colour and shape (see
 * promo-banner.css for the tile itself).
 */
type PromoBannerCellProps = {
  label: string
  href: string
  seeAllLabel: string
  className?: string
  bannerClassName?: string
}

export function PromoBannerCell({
  label,
  href,
  seeAllLabel,
  className = '',
  bannerClassName = '',
}: PromoBannerCellProps) {
  return (
    <div className={['promo-cell', className].filter(Boolean).join(' ')}>
      <PromoBanner
        className={['promo-banner--tile', bannerClassName].filter(Boolean).join(' ')}
        label={label}
        href={href}
        arrow={false}
      />
      <a className="promo-see-all" href={href}>
        <span>{seeAllLabel}</span>
        <Icon className="promo-see-all__icon" name="arrow-right" size={24} strokeWidth={1.8} />
      </a>
    </div>
  )
}
