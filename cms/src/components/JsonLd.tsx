import { siteURL } from '@/lib/siteURL'

/**
 * What a crawler reads instead of guessing.
 *
 * WHY THIS EXISTS AT ALL. Search engines will infer a headline and a date from
 * a page's markup, badly. Structured data states them, which is what earns an
 * article the byline, the date and the thumbnail in a result rather than a blue
 * link and two lines of body text. On a product whose north-star metric is
 * organic sessions, that difference IS the metric.
 *
 * IT DESCRIBES WHAT IS ON THE PAGE AND NOTHING ELSE. Every field below is
 * rendered somewhere in the document a reader can see. Claiming a rating, an
 * author or an organisation the page does not show is the thing that gets
 * structured data ignored — and, done knowingly, is lying to a crawler.
 *
 * THE PUBLISHER IS DESIGNALLY, THE AUTHOR IS NOT ASSERTED. The Hub has no
 * bylines: articles carry a tag and a date, not a person. An `author` here
 * would be invented, so `Organization` is both the honest answer and the one
 * the page can support.
 */

/** One block, serialised. Next renders this in place; it never hydrates. */
function Block({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      /* The payload is ours, built from typed fields, and JSON.stringify escapes
         the quotes a title might contain. The one character it does not escape
         is `<`, which could close this tag early — so it is replaced. */
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}

const PUBLISHER = {
  '@type': 'Organization',
  name: 'Designally',
  url: siteURL,
} as const

/** Absolute, because a crawler has no page to resolve a path against. */
const absolute = (path: string) => (path.startsWith('http') ? path : `${siteURL}${path}`)

export function ArticleJsonLd({
  title,
  description,
  image,
  datePublished,
  path,
  section,
}: {
  title: string
  description?: string
  image?: string
  datePublished?: string
  path: string
  section?: string
}) {
  return (
    <Block
      data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        ...(description ? { description } : {}),
        ...(image ? { image: [absolute(image)] } : {}),
        ...(datePublished ? { datePublished } : {}),
        ...(section ? { articleSection: section } : {}),
        mainEntityOfPage: { '@type': 'WebPage', '@id': absolute(path) },
        publisher: PUBLISHER,
        inLanguage: 'en',
      }}
    />
  )
}

/**
 * A downloadable template or worksheet. `CreativeWork` rather than `Article`:
 * the page is not something to read, it is something to take away, and the
 * formats are the point.
 */
export function ResourceJsonLd({
  title,
  description,
  datePublished,
  path,
  formats,
  category,
}: {
  title: string
  description?: string
  datePublished?: string
  path: string
  formats?: string[]
  category?: string
}) {
  return (
    <Block
      data={{
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: title,
        ...(description ? { description } : {}),
        ...(datePublished ? { datePublished } : {}),
        ...(formats?.length ? { encodingFormat: formats } : {}),
        ...(category ? { genre: category } : {}),
        url: absolute(path),
        publisher: PUBLISHER,
        /* The Hub's promise, stated where a machine can read it: everything
           here is free to take. */
        isAccessibleForFree: true,
        inLanguage: 'en',
      }}
    />
  )
}

/** The site itself, once, on the homepage. */
export function SiteJsonLd() {
  return (
    <Block
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Designally Knowledge Hub',
        url: siteURL,
        publisher: PUBLISHER,
        inLanguage: 'en',
      }}
    />
  )
}
