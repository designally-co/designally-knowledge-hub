import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticleCard } from '@/components/ds'
import { getArticlesByTag } from '@/lib/resources'
import { TAG_OPTIONS, categoryForTag, tagFromSlug, tagSlug } from '@/lib/tags'

/**
 * Tag listing page — every published article carrying one tag.
 * SSG: one page per tag in the fixed taxonomy; ISR keeps them fresh.
 */
export const revalidate = 300
export const dynamicParams = true

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return TAG_OPTIONS.map((t) => ({ slug: tagSlug(t) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const tag = tagFromSlug(slug)
  if (!tag) return { title: 'Tag not found' }
  return { title: `${tag} — Designally Knowledge Hub`, description: `Articles tagged ${tag}.` }
}

export default async function TagPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const tag = tagFromSlug(slug)
  if (!tag) notFound()

  const items = await getArticlesByTag(tag)
  const category = categoryForTag(tag)

  return (
    <div className="shell listing">
      <a className="listing__back" href="/">
        ← Home
      </a>

      {category && <p className="listing__eyebrow">{category}</p>}
      <h1 className="listing__title">{tag}</h1>
      <p className="listing__count">
        {items.length} {items.length === 1 ? 'article' : 'articles'}
      </p>

      {items.length > 0 ? (
        <div className="card-grid">
          {items.map((it) => (
            <ArticleCard
              key={it.href}
              title={it.title}
              date={it.date}
              tags={it.tags}
              image={it.image}
              ratio="4 / 3"
              href={it.href}
            />
          ))}
        </div>
      ) : (
        <p className="listing__empty">No articles tagged “{tag}” yet.</p>
      )}
    </div>
  )
}
