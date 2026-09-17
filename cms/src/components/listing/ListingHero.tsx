import React from 'react'

/*
 * ListingHero — the tinted band at the top of a listing page: a section icon,
 * the surface title, and an optional intro line. The band colour and icon come
 * from the surface's chrome (see lib/listingChrome). A faint wave pattern is
 * overlaid in CSS; the tint is passed as the `--band` custom property.
 * `kicker` is a small first line inside the heading, above the title (search's
 * "Search results for" over the query), so the two read as one h1.
 */
export interface ListingHeroProps {
  title: string
  kicker?: string
  description?: string
  icon?: string | null
  tint: string
}

export function ListingHero({ title, kicker, description, icon, tint }: ListingHeroProps) {
  return (
    <section className="listing-hero" style={{ ['--band' as string]: tint }}>
      <div className="listing-hero__inner">
        <h1 className={`listing-hero__heading${kicker ? ' listing-hero__heading--kicked' : ''}`}>
          {kicker && <span className="listing-hero__kicker">{kicker} </span>}
          {icon && (
            <img className="listing-hero__icon section-icon" src={icon} alt="" aria-hidden="true" />
          )}
          <span className="listing-hero__title">{title}</span>
        </h1>
        {description && <p className="listing-hero__desc">{description}</p>}
      </div>
    </section>
  )
}
