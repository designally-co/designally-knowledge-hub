import React from 'react'
import { notFound } from 'next/navigation'

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
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* English: Ovo + Geist. Thai: Athiti + IBM Plex Sans Thai, swapped in by
            `:root:lang(th)` in tokens/typography.css. Geist is the variable
            400–700 axis because the carousel animates its title's weight.
            IBM Plex Sans Thai is static, so every weight the site sets has to
            be listed: 500 is the labels', tags', pills' and card titles'. Left
            out, a Thai page drew all of them at 400. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Ovo&family=Geist:wght@400..700&family=Athiti:wght@400;600&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
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
