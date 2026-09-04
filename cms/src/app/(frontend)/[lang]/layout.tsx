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
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Hanken+Grotesk:wght@400..800&family=Noto+Serif+Thai:wght@400;500;600&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
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
