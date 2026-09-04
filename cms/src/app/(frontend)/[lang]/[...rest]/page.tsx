import { notFound } from 'next/navigation'

/**
 * Every address that matches nothing else.
 *
 * WITHOUT THIS, A DEAD LINK GETS NEXT'S OWN 404 — an unstyled white page
 * reading "404: This page could not be found." A nested `not-found.tsx` does
 * not cover it: that file answers a `notFound()` CALLED inside its segment,
 * and a URL matching no route never reaches the segment to call anything. The
 * root 404 answers instead, and the root here has no layout — no fonts, no
 * header, no footer — because this site's chrome lives under `[lang]`.
 *
 * So the unmatched path is caught INSIDE the locale segment and told to be
 * not-found there. Same 404 status, but now it renders inside the layout, with
 * the site around it. Measured before: `/this-page-does-not-exist` returned
 * Next's default page and none of our markup.
 *
 * IT SHADOWS NOTHING. Next matches specific segments before a catch-all, so
 * `/articles/[slug]` and the rest are unaffected — this only sees what they
 * have already declined.
 */
export default function CatchAll() {
  notFound()
}
