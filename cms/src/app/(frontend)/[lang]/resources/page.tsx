import { ResourceCard } from '@/components/ds'
import { getDownloadableFiles } from '@/lib/resources'
import { getDictionary, isLocale, type Locale } from '@/lib/i18n'

/**
 * Resources — the downloadable files: templates, fonts, ebooks, wallpapers,
 * icons. Articles are a different collection entirely and live on the homepage
 * and the tag pages.
 *
 * One grid, no filtering. Colour and glyph come from each resource's category
 * preset rather than from its position here, so the grid reads as a taxonomy
 * instead of a rotation of brand colours.
 */
export const revalidate = 60

export default async function ResourcesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)

  const items = await getDownloadableFiles(60, locale)

  return (
    <div className="shell listing">
      <h1 className="listing__title">{dict.resources.title}</h1>
      <p className="listing__count">{dict.resources.lede}</p>

      {items.length > 0 ? (
        <div className="card-grid">
          {items.map((it) => (
            <ResourceCard
              key={it.id}
              title={it.title}
              date={it.date}
              category={it.category}
              color={it.color}
              glyph={it.glyph}
              formats={it.formats}
              href={it.href}
            />
          ))}
        </div>
      ) : (
        <p className="listing__empty">{dict.resources.lede}</p>
      )}
    </div>
  )
}
