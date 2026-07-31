import React from 'react'
import { notFound } from 'next/navigation'

import '@/styles/index.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { LOCALES, getDictionary, isLocale, type Locale } from '@/lib/i18n'

export const metadata = {
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
      </body>
    </html>
  )
}
