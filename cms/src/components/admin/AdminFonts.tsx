'use client'

import { useEffect } from 'react'
import { IBM_Plex_Sans_Thai, Poppins, Spline_Sans_Mono, Zalando_Sans } from 'next/font/google'

/*
 * THE STUDIO'S FACES, SELF-HOSTED, FOR THE ADMIN.
 *
 * The theme loaded them with a CSS @import from Google, and said why: the
 * generated (payload)/layout.tsx is not to be edited, and a provider was the
 * way to do it properly if it were ever wanted. It is wanted now — the admin
 * is matched to Content Studio, which self-hosts through next/font, and an
 * @import is a serialised third-party request on every admin load.
 *
 * next/font has to be called at module scope, and it is; what it gives back is
 * a class per face that sets a CSS variable. Payload owns <html> and <body>,
 * so the classes go onto the root in an effect rather than in markup — which
 * costs one frame of fallback on a cold load and nothing after. custom.scss
 * reads the variables with the family names as fallbacks, so the stylesheet is
 * right whether or not this has run yet.
 *
 * Zalando is the variable face, so 500 exists (the studio's heading weight).
 * Poppins lists 300/400/600/700: 500 is deliberately absent from the system.
 */
const zalando = Zalando_Sans({ variable: '--font-zalando', subsets: ['latin'] })
const poppins = Poppins({ variable: '--font-poppins', subsets: ['latin'], weight: ['300', '400', '600', '700'] })
const plexThai = IBM_Plex_Sans_Thai({
  variable: '--font-plex-thai',
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
})
const splineMono = Spline_Sans_Mono({ variable: '--font-spline-mono', subsets: ['latin'] })

const CLASSES = [zalando.variable, poppins.variable, plexThai.variable, splineMono.variable]

export function AdminFonts({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add(...CLASSES)
    return () => root.classList.remove(...CLASSES)
  }, [])
  return <>{children}</>
}
