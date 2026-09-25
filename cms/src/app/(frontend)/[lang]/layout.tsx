import React from 'react'
import { notFound } from 'next/navigation'
import { Athiti, Geist, IBM_Plex_Sans_Thai, Ovo } from 'next/font/google'

import '@/styles/index.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { LOCALES, getDictionary, isLocale, type Locale } from '@/lib/i18n'
/* The origin moved to its own module: the sitemap and robots.txt need the same
   answer this layout does. See lib/siteURL. */
import { siteURL } from '@/lib/siteURL'
import { getResourceCategories } from '@/lib/resources'
/*
 * MEASUREMENT, BECAUSE THE NORTH-STAR METRIC IS SESSIONS AND NOTHING COUNTED
 * ONE. Cloudflare Web Analytics: no cookies, so this site needs neither a
 * consent banner nor a lawful basis to record a page view. It answers "how many
 * people arrived, from where, on which page", which is the question the metric
 * asks. Why Cloudflare rather than Vercel's is in the component.
 */
import { CloudflareAnalytics } from '@/components/CloudflareAnalytics'

const DESCRIPTION =
  'A free library of design templates, articles and resources from Designally — your creative design ally.'

/*
 * THE PICTURE A LINK CARRIES. An article and a resource each hand over their
 * own artwork (see their `generateMetadata`); everything else — the homepage,
 * the catalogs, About, Contact, the newsletter — had none, and a link to any of
 * them arrived in a message or a post as a bare grey box.
 *
 * `public/og.png` is the house card: the wordmark on the site's own paper and
 * watermark, the name, the line under it and the address. It is drawn from
 * `scripts/og-source.html`, which says there how to redraw it. One card for
 * both languages: it carries the brand rather than a sentence, so there is
 * nothing on it to translate.
 */
export const metadata = {
  metadataBase: new URL(siteURL),
  title: 'Designally Knowledge Hub',
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Designally Knowledge Hub',
    title: 'Designally Knowledge Hub',
    description: DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Designally Knowledge Hub' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Designally Knowledge Hub',
    description: DESCRIPTION,
    images: ['/og.png'],
  },
}

/*
 * THE FACES, SERVED FROM THIS SITE. They used to arrive through a Google Fonts
 * <link>: a stylesheet on another origin that blocked the first paint, behind
 * two extra connections, before a single glyph could be fetched. next/font
 * downloads them at build time, serves them from the Hub's own domain, and
 * adds a metric-matched fallback so text set before a face lands does not
 * reflow when it does.
 *
 * Each face is exposed as a CSS variable on <html>; tokens/typography.css
 * builds the families from those. English: Ovo + Geist. Thai: Athiti + IBM
 * Plex Sans Thai. Geist is the variable 400–700 axis because the carousel
 * animates its title's weight. IBM Plex Sans Thai is static, so every weight
 * the site sets has to be listed: 500 is the labels', tags', pills' and card
 * titles'. Left out, a Thai page drew all of them at 400.
 *
 * Only the Latin faces are preloaded — every page needs them. The Thai faces
 * are split by unicode-range, so an English page downloads them only if a
 * Thai glyph (the switcher's "ไทย") actually appears.
 */
const ovo = Ovo({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--face-ovo' })
const geist = Geist({ subsets: ['latin'], display: 'swap', variable: '--face-geist' })
const athiti = Athiti({
  weight: ['400', '600'],
  subsets: ['thai', 'latin'],
  display: 'swap',
  preload: false,
  variable: '--face-athiti',
})
const plexThai = IBM_Plex_Sans_Thai({
  weight: ['400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
  preload: false,
  variable: '--face-plex-thai',
})
const FACES = [ovo, geist, athiti, plexThai].map((f) => f.variable).join(' ')

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
  /* Names and slugs only — a client component's props travel to the browser. */
  const resourceCategories = (await getResourceCategories()).map(({ name, slug }) => ({ name, slug }))

  return (
    <html lang={locale} className={FACES}>
      <body>
        <a className="skip-link" href="#main">
          {dict.skipToContent}
        </a>
        <SiteHeader locale={locale} dict={dict} resourceCategories={resourceCategories} />
        <main id="main">{children}</main>
        <SiteFooter locale={locale} dict={dict} />
        <CloudflareAnalytics />
      </body>
    </html>
  )
}
