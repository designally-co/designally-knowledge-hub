import { NextResponse, type NextRequest } from 'next/server'

import { DEFAULT_LOCALE, LOCALES } from './lib/i18n'

/*
 * Hidden default-locale routing. English (the default) is served at unprefixed
 * URLs (`/`, `/articles/x`) but internally lives under the `[lang]` segment as
 * `/en/...`; this middleware rewrites those requests so the segment resolves.
 * Thai requests (`/th/...`) already carry their prefix and pass straight through.
 *
 * The matcher below excludes the Payload admin + API, Next internals, and any
 * file with an extension (public assets), so only front-end page routes are
 * rewritten.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const nonDefault = LOCALES.filter((l) => l !== DEFAULT_LOCALE)
  const alreadyPrefixed = nonDefault.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  )
  if (alreadyPrefixed) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!admin|api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
