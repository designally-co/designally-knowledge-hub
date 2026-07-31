'use client'

import React from 'react'

import { DEFAULT_LOCALE, getDictionary, type Dictionary } from '@/lib/i18n'

/*
 * NewsletterCta — reusable newsletter sign-up band. Full-bleed mint panel with
 * the wave pattern (public/newsletter-waves.svg), the reading illustration, a
 * serif headline, and an inline email form. Copy comes from the active locale's
 * dictionary; individual strings can still be overridden per placement.
 *
 * NOTE: the form is UI-only for now — it needs a newsletter provider wired up.
 * onSubmit just prevents the default reload.
 */
export interface NewsletterCtaProps {
  dict?: Dictionary
  eyebrow?: string
  title?: string
  lede?: string
}

export function NewsletterCta({
  dict = getDictionary(DEFAULT_LOCALE),
  eyebrow,
  title,
  lede,
}: NewsletterCtaProps) {
  const c = dict.cta
  return (
    <section className="cta" aria-labelledby="cta-title">
      <div className="shell cta__inner">
        <div className="cta__lead">
          <img
            className="cta__art"
            src="/man-reading.png"
            alt=""
            width={235}
            height={280}
            loading="lazy"
            decoding="async"
          />
          <div className="cta__copy">
            <p className="cta__eyebrow">{eyebrow ?? c.eyebrow}</p>
            <h2 className="cta__title" id="cta-title">
              {title ?? c.title}
            </h2>
          </div>
        </div>

        <div className="cta__signup">
          <p className="cta__lede">{lede ?? c.lede}</p>
          <form className="cta__form" onSubmit={(e) => e.preventDefault()}>
            <input
              className="cta__input"
              type="email"
              name="email"
              placeholder={c.placeholder}
              aria-label={c.placeholder}
              required
            />
            <button className="cta__submit" type="submit">
              {c.button}
            </button>
          </form>
          <p className="cta__note">{c.note}</p>
        </div>
      </div>
    </section>
  )
}
