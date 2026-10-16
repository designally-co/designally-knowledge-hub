/** Real Payload check; synthetic data/media and either SQLite or CI-only Postgres. */
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const scratch = await mkdtemp(path.join(os.tmpdir(), 'hub-public-reads-'))
const ciDatabase = process.env.HUB_READ_TEST_DATABASE_URI
if (ciDatabase) {
  const target = new URL(ciDatabase)
  assert.ok(['localhost', '127.0.0.1'].includes(target.hostname), 'scratch database only')
  assert.equal(target.password, 'ci-throwaway', 'scratch credentials only')
}
process.env.DATABASE_URI = ciDatabase || `file:${path.join(scratch, 'test.db')}`
process.env.PAYLOAD_SECRET = 'isolated-public-read-regression-only'
process.env.MEDIA_STORAGE = 'local'
for (const key of ['DB_SCHEMA', 'VERCEL', 'RESEND_API_KEY', 'ANTHROPIC_API_KEY']) delete process.env[key]
const { getPayload } = await import('payload')
const { default: configPromise } = await import('../src/payload.config')
const config = await configPromise
const mediaConfig = config.collections.find((c) => c.slug === 'media')
if (mediaConfig?.upload) mediaConfig.upload.staticDir = path.join(scratch, 'media')
const payload = await getPayload({ config })
try {
  const { default: sharp } = await import('sharp')
  const image = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#597c59' } }).png().toBuffer()
  const media = await payload.create({ collection: 'media', data: { alt: 'Synthetic test cover' }, file: { data: image, mimetype: 'image/png', name: 'synthetic.png', size: image.length }, overrideAccess: true })
  const body = { root: { type: 'root', version: 1, direction: null, format: '' as const, indent: 0, children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'A complete synthetic article body.', format: 0, mode: 'normal', detail: 0, style: '' }], direction: null, format: '', indent: 0 }] } }
  const articles = []
  for (const [i, tag] of ['Branding Systems', 'Typography', 'Branding Systems', 'Industry Report'].entries()) {
    const doc = await payload.create({ collection: 'articles', locale: 'en', overrideAccess: true, context: { skipNewsletter: true }, data: { title: `Synthetic article ${i}`, slug: `synthetic-${i}`, tag: tag as 'Branding Systems', status: i === 3 ? 'draft' : 'published', publishedDate: `2030-01-0${4-i}T12:00:00.000Z`, coverImage: media.id, summary: 'Synthetic summary', bodyMarkdown: 'SYNTHETIC_MARKDOWN'.repeat(1000), body, references: [{ label: 'Synthetic reference', url: 'https://example.com/reference' }] } })
    await payload.update({ collection: 'articles', id: doc.id, locale: 'th', overrideAccess: true, context: { skipNewsletter: true }, data: { title: `บทความทดสอบ ${i}`, summary: 'สรุปทดสอบ', body } })
    articles.push(doc)
  }
  await payload.update({ collection: 'articles', id: articles[0].id, overrideAccess: true, context: { skipNewsletter: true }, data: { related: [articles[2].id, articles[1].id] } })
  // Check actual database-adapter results, not only the final small card object.
  const reads: Record<string, unknown>[][] = []
  const originalFind = payload.find.bind(payload)
  payload.find = (async (options: Parameters<typeof originalFind>[0]) => {
    const result = await originalFind(options)
    if (options.collection === 'articles' && options.select) reads.push(result.docs as unknown as Record<string, unknown>[])
    return result
  }) as typeof payload.find
  const r = await import('../src/lib/resources')
  const recent = await r.getRecentArticles(2)
  assert.equal(recent.length, 2)
  assert.equal(recent[0].title, 'Synthetic article 0')
  assert.equal(recent[0].ratio, '1200 / 800')
  assert.ok(recent[0].image && recent[0].imageSrcSet)
  assert.deepEqual(recent[0].tags, ['Branding Systems'])
  const thai = await r.getRecentArticles(2, 'th')
  assert.equal(thai[0].title, 'บทความทดสอบ 0')
  assert.equal(thai[0].href, '/th/articles/synthetic-0')
  assert.deepEqual(await r.getLatestTags(12), ['Branding Systems', 'Typography'])
  assert.deepEqual(await r.getPopularTags(6), ['Branding Systems', 'Typography'])
  assert.equal((await r.getArticlesByTag('Branding Systems')).length, 2)
  assert.equal((await r.getArticlesByCategory('Design')).length, 3)
  assert.equal((await r.getArticlesByCategory('Insights')).length, 0)
  const page = await r.getArticleListing({ page: 2, perPage: 2 })
  assert.equal(page.total, 3)
  assert.equal(page.totalPages, 2)
  assert.equal(page.items[0].title, 'Synthetic article 2')
  assert.equal((await r.getArticleListing({ q: 'Typography' })).total, 1)
  assert.deepEqual((await r.getRelatedArticles('synthetic-0', 'en', 2)).map((a) => a.id), [String(articles[2].id), String(articles[1].id)])
  assert.equal((await r.getRelatedArticles('synthetic-0', 'th', 2))[0].title, 'บทความทดสอบ 2')
  assert.ok(reads.length >= 10)
  for (const docs of reads) for (const doc of docs) for (const key of ['bodyMarkdown', 'body', 'references']) assert.equal(key in doc, false)
  const detail = await r.getArticleBySlug('synthetic-0')
  assert.ok(detail?.body)
  assert.equal(detail.references[0].label, 'Synthetic reference')
  assert.equal(detail.image, recent[0].image)
  assert.equal((await r.getArticleBySlug('synthetic-0', 'th'))?.title, 'บทความทดสอบ 0')
  assert.equal(await r.getArticleBySlug('synthetic-3'), null)
  console.log('PASS: real Payload reads preserve cards, covers, Thai, tags, related order, filters, pagination and full article detail; card/tag reads return no bodies or references.')
} finally {
  await payload.destroy()
  await rm(scratch, { recursive: true, force: true })
}
