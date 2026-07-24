/**
 * One-time cleanup: remove a leading title heading from existing articles'
 * Lexical bodies. Generator-published articles included the title as an H1 at
 * the top of the body, duplicating the page's own H1. Only removes the first
 * block when it's an H1 or its text matches the article title — never a real
 * H2 section (seeded articles open with a paragraph, so they're untouched).
 *
 * Run:  node --env-file=.env --import tsx ./src/scripts/stripTitleHeadings.ts
 */
import { getPayload } from 'payload'

import config from './../payload.config'

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

function headingText(node: { children?: unknown }): string {
  const kids = Array.isArray(node.children) ? node.children : []
  return kids
    .map((c) => (c && typeof (c as { text?: unknown }).text === 'string' ? (c as { text: string }).text : ''))
    .join('')
    .trim()
}

const run = async () => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'resources',
    where: { type: { equals: 'article' } },
    limit: 1000,
    pagination: false,
    depth: 0,
  })

  let fixed = 0
  for (const r of docs) {
    const body = r.body as { root?: { children?: unknown[] } } | null | undefined
    const children = body?.root?.children
    if (!Array.isArray(children) || children.length === 0) continue

    const first = children[0] as { type?: string; tag?: string; children?: unknown }
    if (first?.type !== 'heading') continue

    const isH1 = first.tag === 'h1'
    const matchesTitle = norm(headingText(first)) === norm(r.title)
    if (!isH1 && !matchesTitle) continue

    const newBody = {
      ...body,
      root: { ...body!.root, children: children.slice(1) },
    }
    await payload.update({ collection: 'resources', id: r.id, data: { body: newBody } })
    fixed++
    payload.logger.info(`  stripped "${first.tag}" title from: ${r.title}`)
  }

  payload.logger.info(`✅ Cleaned ${fixed} of ${docs.length} article(s).`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
