import { ResourceCard } from '@/components/ds'
import { getDownloadableFiles } from '@/lib/resources'
import { getDictionary, isLocale, type Locale } from '@/lib/i18n'

/**
 * Resources — the downloadable files (fonts, Figma files, templates), i.e.
 * published resources of type `template`. Articles live on the homepage and the
 * tag pages instead.
 */
export const revalidate = 60

// Spot colours cycle so a grid of documents reads as a set, not a repetition.
const DOC_COLORS = [
  'var(--be-gold)',
  'var(--be-cobalt)',
  'var(--be-brick)',
  'var(--be-green)',
  'var(--be-purple)',
  'var(--be-rust)',
]

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
          {items.map((it, i) => (
            <ResourceCard
              key={it.id}
              title={it.title}
              date={it.date}
              category={it.tags?.[0]}
              color={DOC_COLORS[i % DOC_COLORS.length]}
            />
          ))}
        </div>
      ) : (
        <p className="listing__empty">{dict.resources.lede}</p>
      )}
    </div>
  )
}
