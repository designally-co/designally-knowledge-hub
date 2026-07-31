/**
 * Seed the Hub CMS from the placeholder content in ./seed-data.js, the single
 * source of truth for the sample library. Idempotent: it clears the seeded
 * collections first, so it can be re-run safely.
 *
 * Run with:  npm run seed   (from the cms/ directory)
 */
import { getPayload } from 'payload'

import config from './payload.config'
import type { Resource } from './payload-types'
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
  await payload.delete({ collection: 'resources', where: {} })

  // ---- Resources ---------------------------------------------------------
  // Map a placeholder card into a Resource of the given type. The model carries
  // two types only: 'article' and 'template' (Downloadable file). Tags are
  // limited to two; extra placeholder tags are trimmed to fit.
  const toResource = (card: RawCard, type: 'article' | 'template') => {
    const tags = (card.tags ?? []).slice(0, 2)
    return {
      title: card.title,
      type,
      status: 'published' as const,
      publishedDate: parseDate(card.date),
      // data.js tags are plain strings; the values are all valid taxonomy tags.
      tags: tags as Resource['tags'],
      coverUrl: card.image,
      summary: undefined,
    }
  }

  // Editorial content → articles. Resources kit → templates.
  const articleCards: RawCard[] = [
    ...(BE_DATA.topInspiration ?? []),
    ...(BE_DATA.hero ? [BE_DATA.hero] : []),
    ...(BE_DATA.caseStudies ?? []),
    ...(BE_DATA.insight ?? []),
    ...(BE_DATA.workflow ? [BE_DATA.workflow] : []),
  ]
  const templateCards: RawCard[] = BE_DATA.resources ?? []

  payload.logger.info(
    `Seeding ${articleCards.length} articles and ${templateCards.length} templates…`,
  )

  let created = 0
  for (const card of articleCards) {
    await payload.create({ collection: 'resources', data: toResource(card, 'article') })
    created++
  }
  for (const card of templateCards) {
    // The resources kit stores its own spot colour in `color`, not `tint`.
    const asTemplate = toResource({ ...card, tint: (card as any).color }, 'template')
    await payload.create({
      collection: 'resources',
      data: { ...asTemplate, gated: false },
    })
    created++
  }

  payload.logger.info(`✅ Seed complete: ${created} resources.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
