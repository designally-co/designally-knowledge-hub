import type { Metadata } from 'next'
import Link from 'next/link'

import { Icon, SectionHeading } from '@/components/ds'
import { NewsletterCta } from '@/components/NewsletterCta'
import { CATEGORY_CHROME, RESOURCES_CHROME } from '@/lib/listingChrome'
import { categorySlug } from '@/lib/tags'
import { getDictionary, isLocale, localeHref, type Locale } from '@/lib/i18n'

/**
 * About — what this publication is, who makes it, and how to read it.
 *
 * STATIC COPY, FROM THE DICTIONARY. Nothing here comes from Payload: the page
 * says what the Hub is for, which is a decision rather than content, and it has
 * to exist in both languages whether or not anything has been published yet.
 *
 * BUILT FROM WHAT THE SITE ALREADY HAS. `SectionHeading`, `IconButton`, `Icon`
 * and `NewsletterCta` are the site's own; the four cards take their tints and
 * marks from `listingChrome`, which is the same table the listing pages wear —
 * so the card for Insights is the blue the Insights band is, not a fifth blue
 * chosen here. The bands reuse `hero-bg-pattern.svg`, the watermark the hero,
 * the article header and the promo banners already carry.
 */

/**
 * The studio photograph, when there is one.
 *
 * The composition has a figure beside "Why we exist" and this repo has no
 * photograph to put in it — the three images in `/public` are the newsletter's
 * illustration, the phones artwork and the footer's texture, none of which is a
 * picture of anybody working. So the frame holds its own place until one
 * arrives, and swapping it in is one line: drop a file in `/public` and name it
 * here. Nothing else changes; the figure gives up its placeholder shape to the
 * picture's own ratio on its own.
 */
const STUDIO_IMAGE: null | string = null

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
    title: `${dict.about.eyebrow} — Designally Knowledge Hub`,
    description: dict.about.lede,
  }
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)
  const a = dict.about

  /* The four surfaces, in the order the nav lists them. Labels come from the
     home dictionary rather than being restated here — these are the same four
     words the header, the footer and the homepage sections use. */
  const surfaces = [
    {
      key: 'case-studies',
      label: dict.home.caseStudies,
      chrome: CATEGORY_CHROME.Design,
      href: localeHref(locale, `/category/${categorySlug('Design')}`),
    },
    {
      key: 'insights',
      label: dict.home.insights,
      chrome: CATEGORY_CHROME.Insights,
      href: localeHref(locale, `/category/${categorySlug('Insights')}`),
    },
    {
      key: 'workflows',
      label: dict.home.workflows,
      chrome: CATEGORY_CHROME['Design with AI'],
      href: localeHref(locale, `/category/${categorySlug('Design with AI')}`),
    },
    {
      key: 'resources',
      label: dict.home.resources,
      chrome: RESOURCES_CHROME,
      href: localeHref(locale, '/resources'),
    },
  ]

  return (
    <div className="about">
      {/* ---- the opening ------------------------------------------------- */}
      <section className="about-hero" aria-labelledby="about-title">
        <div className="shell about-hero__inner">
          <p className="about-eyebrow">{a.eyebrow}</p>
          <h1 className="about-hero__title" id="about-title">
            {a.title}
          </h1>
          <p className="about-hero__lede">{a.lede}</p>

          {/* THE LABEL SITS IN THE HERO'S OWN GRID, in the column the statement
              below it starts in — the composition hangs the section's name off
              the left margin and lets the argument run down the right. */}
          <div className="about-why">
            <p className="about-why__label">{a.whyLabel}</p>

            <div className="about-why__column">
              {/* THE FRAME IS ALWAYS DRAWN. Empty it is a placeholder holding
                  the composition's shape; with `STUDIO_IMAGE` set it becomes
                  the window and gives up its own ratio to the picture's. */}
              <figure className="about-why__figure">
                {STUDIO_IMAGE ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" loading="lazy" src={STUDIO_IMAGE} />
                ) : null}
              </figure>

              <p className="about-why__statement">{a.whyStatement}</p>

              <div className="about-why__body">
                {a.whyBody.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- the four surfaces ------------------------------------------- */}
      <section className="about-find" aria-labelledby="about-find-title">
        <div className="shell about-find__inner">
          <p className="about-eyebrow about-eyebrow--on-dark">{a.findEyebrow}</p>
          <SectionHeading align="center" onDark className="about-find__heading">
            <span id="about-find-title">{a.findTitle}</span>
          </SectionHeading>
          <p className="about-find__lede">{a.findLede}</p>

          {/* THE CARDS FAN, and the tilt is the point: four upright rectangles
              in a row would be a nav bar. Each leans a little further than the
              last, the way a hand of cards does, and straightens under the
              pointer. */}
          <ul className="about-cards">
            {surfaces.map((surface, i) => (
              <li
                className="about-cards__item"
                key={surface.key}
                /* The lean, and how far the card drops for it. Both are handed
                   to CSS as numbers rather than derived there with `abs()`,
                   which is recent enough that an unsupported browser would
                   invalidate the whole transform and flatten the fan. */
                style={{
                  ['--i' as string]: i - 1.5,
                  ['--lift' as string]: Math.abs(i - 1.5),
                  ['--z' as string]: i + 1,
                }}
              >
                <Link
                  className="about-card"
                  href={surface.href}
                  style={{ ['--card-tint' as string]: surface.chrome.tint }}
                >
                  <span className="about-card__mark" aria-hidden="true">
                    {surface.chrome.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" src={surface.chrome.icon} />
                    ) : null}
                  </span>

                  <span className="about-card__arrow" aria-hidden="true">
                    <Icon name="arrow-right" size={16} strokeWidth={2.25} />
                  </span>

                  <span className="about-card__label">{surface.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- how it is written ------------------------------------------- */}
      <section className="about-principles" aria-labelledby="about-principles-title">
        <div className="shell about-principles__inner">
          <div className="about-principles__lead">
            <p className="about-eyebrow">{a.principlesLabel}</p>
            <h2 className="about-principles__title" id="about-principles-title">
              {a.principlesTitle[0]}
              <br />
              {a.principlesTitle[1]}
            </h2>
          </div>

          {/* An ordered list, because they are numbered and the numbers are read
              — the counter is drawn from the list itself rather than typed into
              each row. */}
          <ol className="about-principles__list">
            {a.principles.map((principle) => (
              <li className="about-principle" key={principle.title}>
                <h3 className="about-principle__title">{principle.title}</h3>
                <p className="about-principle__body">{principle.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- who makes it ------------------------------------------------ */}
      <section className="about-studio" aria-labelledby="about-studio-title">
        <div className="shell about-studio__inner">
          <div className="about-studio__lead">
            <p className="about-eyebrow about-eyebrow--on-accent">{a.studioLabel}</p>
            <h2 className="about-studio__title" id="about-studio-title">
              {a.studioTitle}
            </h2>
          </div>

          <div className="about-studio__body">
            <p>{a.studioBody}</p>
            {/* Off-site, so it says so: a new tab and the relationship spelled
                out for anything reading the markup rather than the page. */}
            <a
              className="about-studio__link"
              href="https://designally.co"
              rel="noreferrer"
              target="_blank"
            >
              {a.studioLink}
              <Icon name="arrow-right" size={17} strokeWidth={2.25} />
            </a>
          </div>
        </div>
      </section>

      <NewsletterCta dict={dict} />
    </div>
  )
}
