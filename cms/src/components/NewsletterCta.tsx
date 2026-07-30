'use client'

import React from 'react'

/*
 * NewsletterCta — reusable newsletter sign-up band. Full-bleed mint panel with
 * the wave pattern (public/newsletter-waves.svg), the reading illustration, a
 * serif headline, and an inline email form. Copy is overridable so the same
 * section can be reused across pages.
 *
 * NOTE: the form is UI-only for now — it needs a newsletter provider wired up
 * (Mailchimp / Buttondown / ConvertKit / etc.). onSubmit just prevents the
 * default reload; swap in the real action when the provider is chosen.
 */
export interface NewsletterCtaProps {
  eyebrow?: string
  title?: string
  lede?: string
}

export function NewsletterCta({
  eyebrow = 'Spec Sheet · Newsletter',
  title = 'Better design thinking, twice a month.',
  lede = 'One case study, one practical workflow, and useful ideas about branding, design, and AI.',
}: NewsletterCtaProps) {
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
            <p className="cta__eyebrow">{eyebrow}</p>
            <h2 className="cta__title" id="cta-title">
              {title}
            </h2>
          </div>
        </div>

        <div className="cta__signup">
          <p className="cta__lede">{lede}</p>
          <form className="cta__form" onSubmit={(e) => e.preventDefault()}>
            <input
              className="cta__input"
              type="email"
              name="email"
              placeholder="Enter your email"
              aria-label="Email address"
              required
            />
            <button className="cta__submit" type="submit">
              Subscribe
            </button>
          </form>
          <p className="cta__note">No spam. Unsubscribe at any time.</p>
        </div>
      </div>
    </section>
  )
}
