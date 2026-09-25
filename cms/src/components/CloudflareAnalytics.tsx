import Script from 'next/script'

/**
 * Cloudflare Web Analytics: the page-view counter on the public site.
 *
 * WHY CLOUDFLARE AND NOT VERCEL'S. The Hub shipped `@vercel/analytics` on
 * 4 Sep, but Web Analytics was never switched on for the Vercel project, so its
 * script answered 404 and nothing was ever counted. Cloudflare's is free with
 * no monthly event cap and does not depend on which Vercel plan the Hub is on.
 * Like Vercel's, it sets no cookies and keeps no personal data, so the site
 * still needs no consent banner.
 *
 * THE TOKEN IS PUBLIC. It travels in the page's HTML, so it is a
 * NEXT_PUBLIC_ variable rather than a secret. Unset (local dev, previews), the
 * component renders nothing, so localhost never counts as a visit.
 *
 * Client-side navigations count too: the beacon follows `history.pushState`,
 * which is how Next moves between pages.
 */
export function CloudflareAnalytics() {
  const token = process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN
  if (!token) return null

  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token })}
    />
  )
}
