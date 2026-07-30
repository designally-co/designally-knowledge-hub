import React from 'react'
import '@/styles/index.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata = {
  title: 'Designally Knowledge Hub',
  description:
    'A free library of design templates, articles and resources from Designally — your creative design ally.',
}

/**
 * Public-site root layout. Separate from the Payload admin layout
 * (src/app/(payload)/layout.tsx) via route groups, so the two never share
 * chrome or styles.
 *
 * Fonts are placeholders (see tokens/fonts.css) loaded here via <link> so Next
 * can preconnect; swap for the real Designally faces when they arrive.
 */
export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Hanken+Grotesk:wght@400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
