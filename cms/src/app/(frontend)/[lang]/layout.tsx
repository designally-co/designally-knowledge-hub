import React from 'react'
import { notFound } from 'next/navigation'

import { IBM_Plex_Sans_Thai, Poppins, Spline_Sans_Mono, Zalando_Sans } from 'next/font/google'
import '@/styles/index.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { LOCALES, getDictionary, isLocale, type Locale } from '@/lib/i18n'
/* The origin moved to its own module: the sitemap and robots.txt need the same
   answer this layout does. See lib/siteURL. */
import { siteURL } from '@/lib/siteURL'
/*
 * MEASUREMENT, BECAUSE THE NORTH-STAR METRIC IS SESSIONS AND NOTHING COUNTED
 * ONE. Vercel's own, for two reasons beyond it being one line: it sets no
 * cookies, so this site needs neither a consent banner nor a lawful basis to
 * record a page view, and it runs on the platform the Hub already deploys to.
 * It answers "how many people arrived, from where, on which page", which is
 * the question the metric asks.
 */
import { Analytics } from '@vercel/analytics/next'

/*
 * THE STUDIO'S THREE FACES, LOADED THE STUDIO'S WAY. Zalando Sans for display,
 * headings and every label; Poppins for Latin body; IBM Plex Sans Thai for
 * Thai in both roles, because Zalando has no Thai glyphs — the fallback is per
 * codepoint, so a bilingual line resolves correctly inside one run of text.
 * Spline Sans Mono for the odd aligned figure.
 *
 * next/font rather than a <link> to Google: the files are self-hosted at build
 * time, so there is no third-party request on the critical path and no flash
 * of fallback while a stylesheet round-trips. Each face sets a variable that
 * tokens/typography.css reads; the string fallbacks there cover any document
 * this layout does not wrap.
 *
 * Zalando is loaded as its variable face, not four cuts: a label that wants to
 * sit between two weights can. Poppins lists 300/400/600/700 — 500 is
 * deliberately absent from the system, so it is not loaded and a stray
 * `font-weight: 500` resolves to a neighbour rather than being synthesised.
 */
const zalando = Zalando_Sans({ variable: '--font-zalando', subsets: ['latin'] })
const poppins = Poppins({ variable: '--font-poppins', subsets: ['latin'], weight: ['300', '400', '600', '700'] })
const plexThai = IBM_Plex_Sans_Thai({
  variable: '--font-plex-thai',
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
})
const splineMono = Spline_Sans_Mono({ variable: '--font-spline-mono', subsets: ['latin'] })

export const metadata = {
  metadataBase: new URL(siteURL),
  title: 'Designally Knowledge Hub',
  description:
    'A free library of design templates, articles and resources from Designally — your creative design ally.',
}

// Prerender both locales.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

/**
 * Public-site root layout, per locale. English is served unprefixed (the
 * middleware rewrites `/…` → `/en/…`); Thai lives under `/th`. Separate from the
 * Payload admin layout via route groups.
 */
export default async function FrontendLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale: Locale = lang
  const dict = getDictionary(locale)

  return (
    <html
      lang={locale}
      className={`${zalando.variable} ${poppins.variable} ${plexThai.variable} ${splineMono.variable}`}
    >
      <body>
        <a className="skip-link" href="#main">
          {dict.skipToContent}
        </a>
        <SiteHeader locale={locale} dict={dict} />
        <main id="main">{children}</main>
        <SiteFooter locale={locale} dict={dict} />
        <Analytics />
      </body>
    </html>
  )
}
