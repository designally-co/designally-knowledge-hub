/**
 * The container's entry point: start the Next server, then refresh every page
 * the build pre-rendered.
 *
 * WHY THE PAGES NEED IT. The image is built in CI, which has no database (and
 * must not: the build would need production's credentials). So every page the
 * build pre-renders — the homepage, the resource library, the category pages,
 * the sitemap, in both languages — is rendered from empty lists. Left alone,
 * ISR would serve those once and refresh behind them, which means the first
 * reader of each page after a deploy, very likely a crawler, gets a Hub with
 * nothing in it. Pages that refresh hourly would stay empty for up to an hour.
 *
 * So once the server answers, each pre-rendered route is asked for once with
 * Next's on-demand revalidation header, which renders it again from the live
 * database whatever its revalidate time. Should a Next upgrade stop honouring
 * the header, the request is still an ordinary visit, which refreshes any page
 * already past its window — slower, but never worse than doing nothing.
 *
 * NOTHING HERE CAN STOP THE SERVER. Every failure is logged and skipped: a page
 * that could not be refreshed is the state the build left it in, not an outage.
 */
import { readFileSync } from 'node:fs'

await import('./server.js')

const port = process.env.PORT || '3000'
const base = `http://127.0.0.1:${port}`

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await fetch(`${base}/robots.txt`, { signal: AbortSignal.timeout(2000) })
      return true
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  return false
}

async function refreshPrerendered() {
  let manifest
  try {
    manifest = JSON.parse(readFileSync(new URL('./.next/prerender-manifest.json', import.meta.url), 'utf8'))
  } catch (error) {
    console.warn(`[warm] no prerender manifest, skipped: ${error.message}`)
    return
  }
  const secret = manifest.preview?.previewModeId
  const routes = Object.keys(manifest.routes ?? {}).filter(
    // Next's own error pages and the favicon are not content.
    (route) => !route.startsWith('/_') && !route.startsWith('/admin') && route !== '/icon.png',
  )

  if (!(await waitForServer())) {
    console.warn('[warm] the server never answered; pages left as built')
    return
  }

  let refreshed = 0
  const failed = []
  /* Asked for by the route's own name — `/en/about`, not `/about`. A
     revalidation request does not pass through the middleware, so the
     English rewrite that maps one to the other never runs for it. */
  for (const path of routes) {
    try {
      const res = await fetch(`${base}${path}`, {
        headers: secret ? { 'x-prerender-revalidate': secret } : {},
        signal: AbortSignal.timeout(30_000),
      })
      await res.arrayBuffer()
      if (res.ok) refreshed++
      else failed.push(`${path} ${res.status}`)
    } catch (error) {
      failed.push(`${path} ${error.name}`)
    }
  }
  console.log(
    `[warm] refreshed ${refreshed} of ${routes.length} pre-rendered pages from the database` +
      (failed.length ? `; not refreshed: ${failed.join(', ')}` : ''),
  )
}

refreshPrerendered().catch((error) => console.warn(`[warm] stopped: ${error.message}`))
