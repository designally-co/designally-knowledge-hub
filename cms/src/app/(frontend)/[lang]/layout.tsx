import React from 'react'
import { notFound } from 'next/navigation'

import '@/styles/index.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { LOCALES, getDictionary, isLocale, type Locale } from '@/lib/i18n'

/**
 * Where this site lives, for resolving relative URLs in metadata.
 *
 * A share card's image has to be an absolute URL — a crawler has no page to
 * resolve `/api/media/cover.png` against. `metadataBase` is what lets Next do
 * that resolution, so without it an uploaded cover would be advertised as a
 * path and every platform would fail to fetch it. Vercel exposes the deploy's
 * own hostname at runtime, so this needs no manual configuration; FRONTEND_URL
 * wins when a custom domain is in use.
 */
const siteURL =
  process.env.SITE_URL ||
  process.env.PAYLOAD_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

/* NOT `FRONTEND_URL`. In this repo that variable names the origin allowed to
   call the API and trusted for CSRF, and locally it is still the old Vite SPA
   on :5173 — a different app. Using it here resolved an uploaded cover to
   `http://localhost:5173/api/media/...`, which is a URL nothing serves. This
   site's own origin is what is wanted, so: an explicit SITE_URL, else the
   server URL Payload is already told about, else the deploy's own hostname. */

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
      </body>
    </html>
  )
}
