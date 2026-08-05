import React from 'react'

import { Icon } from '@/components/ds'

/**
 * Dark, full-bleed promo band that sits under the Insights section: a three-phone
 * image over black, then the "Follow Designally" pitch and social buttons.
 *
 * The promo artwork is a single image at `phonesSrc` (default `/Brand Promo.webp`).
 * Set the real Instagram / Facebook URLs via `instagramHref` / `facebookHref`.
 */
export function InsightsVideoPromo({
  kicker,
  heading,
  body,
  frequency,
  instagramLabel = 'Instagram',
  facebookLabel = 'Facebook',
  instagramHref = '#',
  facebookHref = '#',
  phonesSrc = '/Brand Promo.webp',
  phonesAlt = '',
}: {
  kicker: string
  heading: string
  body: string
  frequency: string
  instagramLabel?: string
  facebookLabel?: string
  instagramHref?: string
  facebookHref?: string
  phonesSrc?: string
  phonesAlt?: string
}) {
  return (
    <section className="ivp" aria-labelledby="ivp-heading">
      <div className="shell ivp__inner">
        <div className="ivp__stage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="ivp__stage-img"
            src={phonesSrc}
            alt={phonesAlt}
            aria-hidden={phonesAlt ? undefined : true}
            loading="lazy"
            decoding="async"
          />
        </div>

        <p className="ivp__kicker">{kicker}</p>
        <h2 id="ivp-heading" className="ivp__heading">
          {heading}
        </h2>
        <p className="ivp__body">{body}</p>

        <div className="ivp__actions">
          <a className="ivp__btn" href={instagramHref} target="_blank" rel="noopener noreferrer">
            <Icon name="instagram" size={18} />
            {instagramLabel}
          </a>
          <a className="ivp__btn" href={facebookHref} target="_blank" rel="noopener noreferrer">
            <Icon name="facebook" size={18} />
            {facebookLabel}
          </a>
        </div>

        <p className="ivp__freq">{frequency}</p>
      </div>
    </section>
  )
}
