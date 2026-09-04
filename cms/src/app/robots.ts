import type { MetadataRoute } from 'next'

import { siteURL } from '@/lib/siteURL'

/**
 * What a crawler is allowed to read, and where the map is.
 *
 * THE HUB IS A SEARCH-LED PRODUCT. Most people arrive on a deep resource page
 * from Google rather than on the homepage, which makes this file and the
 * sitemap beside it part of the product rather than housekeeping. Without them
 * a crawler still finds the site, but it finds it the slow way — by following
 * links inward from whatever it stumbles on — and it has no idea which pages
 * changed yesterday.
 *
 * THE ADMIN AND THE API ARE DISALLOWED, not because they are secret — both are
 * behind auth — but because a crawl budget spent on `/admin/login` is a crawl
 * budget not spent on an article. `/auth/` is the Google sign-in round trip and
 * belongs to nobody but the person signing in.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/auth/'],
    },
    sitemap: `${siteURL}/sitemap.xml`,
    host: siteURL,
  }
}
