/**
 * Where this site lives.
 *
 * A share card's image has to be an absolute URL — a crawler has no page to
 * resolve `/api/media/cover.png` against. `metadataBase` in the layout is what
 * lets Next do that resolution, so without it an uploaded cover would be
 * advertised as a path and every platform would fail to fetch it. The sitemap
 * and robots.txt need the same origin for the same reason, which is why it
 * lives here rather than inside the layout that used to own it.
 *
 * Vercel exposes the deploy's own hostname at runtime, so this needs no manual
 * configuration; SITE_URL wins when a custom domain is in use.
 *
 * NOT `FRONTEND_URL`. In this repo that variable names the origin allowed to
 * call the API and trusted for CSRF, and locally it is still the old Vite SPA
 * on :5173 — a different app. Using it here resolved an uploaded cover to
 * `http://localhost:5173/api/media/...`, which is a URL nothing serves. This
 * site's own origin is what is wanted, so: an explicit SITE_URL, else the
 * server URL Payload is already told about, else the deploy's own hostname.
 */
export const siteURL =
  process.env.SITE_URL ||
  process.env.PAYLOAD_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')
