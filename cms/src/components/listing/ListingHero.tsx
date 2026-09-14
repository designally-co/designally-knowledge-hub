import React from 'react'

/*
 * ListingHero — the tinted band at the top of a listing page: a section icon,
 * the surface title, and an optional intro line. The band colour and icon come
 * from the surface's chrome (see lib/listingChrome). A faint wave pattern is
 * overlaid in CSS; the tint is passed as the `--band` custom property.
 * `inline` sets the intro beside the title on one line (search's "Search ·
 * Results for …") instead of under it.
 */
export interface ListingHeroProps {
  title: string
  description?: string
  icon?: string | null
  tint: string
  inline?: boolean
}

export function ListingHero({ title, description, icon, tint, inline = false }: ListingHeroProps) {
  return (
    <section
      className={`listing-hero${inline ? ' listing-hero--inline' : ''}`}
      style={{ ['--band' as string]: tint }}
    >
      <div className="listing-hero__inner">
        <h1 className="listing-hero__heading">
          {icon && (
            <img className="listing-hero__icon section-icon" src={icon} alt="" aria-hidden="true" />
          )}
          <span>{title}</span>
        </h1>
        {description && <p className="listing-hero__desc">{description}</p>}
      </div>
    </section>
  )
}
