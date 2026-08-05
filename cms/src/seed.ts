/**
 * Seed the Hub CMS from the placeholder content in ./seed-data.js, the single
 * source of truth for the sample library. Idempotent: it clears the seeded
 * collections first, so it can be re-run safely.
 *
 * Run with:  npm run seed   (from the cms/ directory)
 */
import { getPayload } from 'payload'

import config from './payload.config'
import type { Article } from './payload-types'
import { RESOURCE_CATEGORIES } from './lib/resourceCategories'
// The sample content. Pure-JS ESM module, untyped by design.
import { BE_DATA } from './seed-data.js'

type RawCard = {
  title: string
  date?: string
  tags?: string[]
  tint?: string
  ratio?: string
  image?: string
}

const parseDate = (value?: string): string | undefined => {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

const seed = async () => {
  const payload = await getPayload({ config })

  payload.logger.info('Clearing previously seeded collections…')
  await payload.delete({ collection: 'articles', where: {} })
  await payload.delete({ collection: 'resources', where: {} })

  // ---- Articles ----------------------------------------------------------
  // Editorial placeholder cards become articles. An article carries exactly one
  // tag, so the first valid placeholder tag wins; the rest are dropped.
  const toArticle = (card: RawCard) => ({
    title: card.title,
    status: 'published' as const,
    publishedDate: parseDate(card.date),
    // data.js tags are plain strings; the values are all valid taxonomy tags.
    tag: (card.tags ?? [])[0] as Article['tag'],
    coverUrl: card.image,
    summary: undefined,
  })

  const articleCards: RawCard[] = [
    ...(BE_DATA.topInspiration ?? []),
    ...(BE_DATA.hero ? [BE_DATA.hero] : []),
    ...(BE_DATA.caseStudies ?? []),
    ...(BE_DATA.insight ?? []),
    ...(BE_DATA.workflow ? [BE_DATA.workflow] : []),
  ].filter((card) => (card.tags ?? []).length > 0)

  // ---- Resources ---------------------------------------------------------
  // The placeholder resources kit has no category of its own, so one is dealt
  // round-robin from the real taxonomy. That gives the grid at least one of
  // every preset to look at, which is the point of seeding it at all.
  const resourceCards: RawCard[] = BE_DATA.resources ?? []

  payload.logger.info(
    `Seeding ${articleCards.length} articles and ${resourceCards.length} resources…`,
  )

  let created = 0
  for (const card of articleCards) {
    await payload.create({ collection: 'articles', data: toArticle(card) })
    created++
  }
  for (const [i, card] of resourceCards.entries()) {
    const category = RESOURCE_CATEGORIES[i % RESOURCE_CATEGORIES.length]
    await payload.create({
      collection: 'resources',
      data: {
        title: card.title,
        status: 'published' as const,
        publishedDate: parseDate(card.date),
        category,
        summary: `A free ${category.toLowerCase()} download from the Designally kit.`,
        description:
          'Placeholder copy for the seeded kit.\n\nReplace this with a real description of what is in the download and what it is for.',
      },
    })
    created++
  }

  payload.logger.info(`✅ Seed complete: ${created} items.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
