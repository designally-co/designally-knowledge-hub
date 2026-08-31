import type { Metadata } from 'next'

import { NewsletterForm } from '@/components/NewsletterForm'
import { CATEGORY_CHROME, RESOURCES_CHROME } from '@/lib/listingChrome'
import { getDictionary, isLocale, type Locale } from '@/lib/i18n'

/**
 * Newsletter — what the letter is, and the three reasons somebody wants it.
 *
 * IT OPENS ON THE THING IT IS SELLING. The About and Contact pages open on a
 * statement and put their action further down; this page's action IS the
 * statement, so the field is in the hero and the band at the foot is the second
 * ask rather than the first.
 *
 * AND IT DOES NOT CARRY THE BAND. Every other page ends with the newsletter
 * band, and that band now says what this page's hero says — the same eyebrow,
 * the same headline, near enough the same line. One screen apart, twice, is a
 * page repeating itself rather than closing. The hero is the ask here.
 *
 * THE CARD TINTS ARE THE SURFACES' OWN, from `listingChrome`, mixed toward
 * white in CSS. Three more colours chosen here would be a fourth palette on a
 * site that already has one.
 */

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)
  return {
    title: `${dict.newsletter.title} — Designally Knowledge Hub`,
    description: dict.newsletter.lede,
  }
}

export default async function NewsletterPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)
  const n = dict.newsletter

  const tints = [
    CATEGORY_CHROME.Design.tint,
    RESOURCES_CHROME.tint,
    CATEGORY_CHROME['Design with AI'].tint,
  ]

  return (
    <div className="news">
      {/* ---- the offer, and the field ------------------------------------ */}
      <section className="news-hero" aria-labelledby="news-title">
        <div className="shell news-hero__inner">
          <div className="news-hero__copy">
            <p className="about-eyebrow">{n.eyebrow}</p>
            <h1 className="news-hero__title" id="news-title">
              {n.title}
            </h1>
            <p className="news-hero__lede">{n.lede}</p>

            {/* The site's own sign-up, not a second one: same field, same
                button, same note, from the same component the band uses. */}
            <div className="news-hero__form">
              <NewsletterForm dict={dict} />
            </div>
          </div>

          {/* THE NEWSLETTER'S OWN CHARACTER, not the band's. The reading
              figure at the foot of every page is a different drawing, so the
              two can both appear here without one reading as a repeat of the
              other — which is what the design does.

              Supplied as a 989px PNG at 693K; shipped as an 840px WebP at 141K,
              which is the size it is actually drawn at on the widest screen. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="news-hero__art"
            decoding="async"
            height={751}
            src="/newsletter-character.webp"
            width={840}
          />
        </div>
      </section>

      {/* ---- why -------------------------------------------------------- */}
      <section className="news-why" aria-labelledby="news-why-title">
        <div className="shell news-why__inner">
          <p className="about-eyebrow news-why__label">{n.whyLabel}</p>
          <h2 className="news-why__statement" id="news-why-title">
            {n.whyStatement}
          </h2>

          {/* THREE CARDS, EACH A PROBLEM AND ITS ANSWER. They lean and overlap
              for the reason the About page's four do — a row of upright panels
              is a table of features, and these are three things somebody
              recognises about their own week. */}
          <ul className="news-cards">
            {n.reasons.map((reason, i) => (
              <li
                className="news-card"
                key={reason.index}
                style={{
                  ['--card-tint' as string]: tints[i],
                  ['--i' as string]: i - 1,
                  /* Handed over as a number rather than derived in CSS with
                     `abs()`, which is recent enough that an unsupported browser
                     would invalidate the whole transform and flatten the fan. */
                  ['--lift' as string]: Math.abs(i - 1),
                  ['--z' as string]: i + 1,
                }}
              >
                <p className="news-card__index">
                  <span>{reason.index}</span>
                  <span aria-hidden="true">·</span>
                  <span>{reason.label}</span>
                </p>
                <p className="news-card__problem">{reason.problem}</p>
                <h3 className="news-card__title">{reason.title}</h3>
                <p className="news-card__answer">{reason.answer}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

    </div>
  )
}
