import type { Metadata } from 'next'

import { ResourceCard } from '@/components/ds'
import { getDownloadableFiles } from '@/lib/resources'

/**
 * Resources — the downloadable files (fonts, Figma files, templates), i.e.
 * published resources of type `template`. Articles live on the homepage and the
 * tag pages instead.
 *
 * Files have no detail page yet, so cards are non-navigating placeholders until
 * the download/detail route exists.
 */
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Resources — Designally Knowledge Hub',
  description: 'Free downloadable design resources: templates, fonts and Figma files.',
}

// Spot colours cycle so a grid of documents reads as a set, not a repetition.
const DOC_COLORS = [
  'var(--be-gold)',
  'var(--be-cobalt)',
  'var(--be-brick)',
  'var(--be-green)',
  'var(--be-purple)',
  'var(--be-rust)',
]

export default async function ResourcesPage() {
  const items = await getDownloadableFiles()

  return (
    <div className="shell listing">
      <h1 className="listing__title">Resources</h1>
      <p className="listing__count">
        {items.length > 0
          ? `${items.length} ${items.length === 1 ? 'file' : 'files'} to download`
          : 'Templates, fonts and Figma files — free to use.'}
      </p>

      {items.length > 0 ? (
        <div className="card-grid">
          {items.map((it, i) => (
            <ResourceCard
              key={it.title}
              title={it.title}
              date={it.date}
              tags={it.tags}
              color={DOC_COLORS[i % DOC_COLORS.length]}
            />
          ))}
        </div>
      ) : (
        <p className="listing__empty">
          No downloadable files yet — they’ll appear here as soon as the first one is published.
        </p>
      )}
    </div>
  )
}
