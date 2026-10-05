import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import type { Payload, PayloadRequest } from 'payload'

/**
 * Which media files something on the Hub points at.
 *
 * ONE ANSWER FOR TWO QUESTIONS. The media library's "Unused" view asks which
 * files nothing uses; an article that changes its cover asks whether the old
 * one is still used anywhere before it lets it go. Both read this, so a place
 * that can hold a file is added here once and both stay right.
 *
 * Every place a media row can be referenced from, as of October 2026:
 *   - an article's cover (`coverImage`);
 *   - a resource's download files (`files[].file`);
 *   - the share image in either's SEO group (`seo.ogImage`) — hidden in the
 *     admin and no longer read, but the column is still there and may hold one;
 *   - a picture embedded in an article's body, in either language (a Lexical
 *     `upload` node).
 *
 * Read with `overrideAccess`, so drafts count as much as published work: a
 * draft's cover is in use, it is just not public yet.
 *
 * NOT COUNTED, BECAUSE IT CANNOT BE: a newsletter that has already gone out
 * holds its cover's address in an email nobody can edit. The cover-release
 * hook keeps an announced article's cover for that reason (see Articles).
 */

export type Ref = number | string | { id?: number | string } | null | undefined

export const mediaIdOf = (value: Ref): number | null => {
  const raw = typeof value === 'object' && value !== null ? value.id : value
  const id = typeof raw === 'string' ? Number(raw) : raw
  return typeof id === 'number' && Number.isFinite(id) ? id : null
}

/** Media ids held by Lexical `upload` nodes anywhere in a rich-text value. */
function collectUploads(node: unknown, into: Set<number>): void {
  if (Array.isArray(node)) {
    for (const child of node) collectUploads(child, into)
    return
  }
  if (!node || typeof node !== 'object') return
  const record = node as Record<string, unknown>
  if (record.type === 'upload' && record.relationTo === 'media') {
    const id = mediaIdOf(record.value as Ref)
    if (id !== null) into.add(id)
  }
  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') collectUploads(value, into)
  }
}

/** Every media id in use, as committed. Pass `req` to read inside a request's
 *  own transaction instead. */
export async function mediaInUse(payload: Payload, req?: PayloadRequest): Promise<Set<number>> {
  const used = new Set<number>()
  const add = (value: Ref) => {
    const id = mediaIdOf(value)
    if (id !== null) used.add(id)
  }

  const articles = await payload.find({
    collection: 'articles',
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
    /* Every language at once, so a picture placed only in the Thai body still
       counts. Localized fields come back as `{ en, th }`. */
    locale: 'all',
    req,
    select: { coverImage: true, seo: { ogImage: true }, body: true },
  })
  for (const article of articles.docs) {
    add(article.coverImage as Ref)
    add(article.seo?.ogImage as Ref)
    collectUploads(article.body, used)
  }

  const resources = await payload.find({
    collection: 'resources',
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
    req,
    select: { files: true, seo: { ogImage: true } },
  })
  for (const resource of resources.docs) {
    for (const entry of resource.files ?? []) add(entry?.file as Ref)
    add(resource.seo?.ogImage as Ref)
  }

  return used
}

/**
 * Let a media file go once nothing uses it — a cover an article has just
 * replaced, or one a deleted article has left behind.
 *
 * LATER, AND OUTSIDE THE ARTICLE'S TRANSACTION. The hook that calls this runs
 * inside the save, and a delete there that hit a database error would abort
 * the transaction and take the save down with it — a spare file is a far
 * smaller problem than an article that will not save. So the release waits a
 * few seconds, reads what is COMMITTED, and only then deletes. If the article's
 * change was rolled back, the old cover is still referenced and stays.
 *
 * On the NAS the server outlives the request, so this always runs. A
 * serverless host may freeze before it does; the cost is one spare file.
 */
export function releaseMediaIfUnused(payload: Payload, value: Ref): void {
  const id = mediaIdOf(value)
  if (id === null) return
  const timer = setTimeout(async () => {
    try {
      if ((await mediaInUse(payload)).has(id)) return
      await payload.delete({ collection: 'media', id, overrideAccess: true })
      payload.logger.info({ media: id }, 'Released a cover nothing uses any more.')
    } catch (error) {
      payload.logger.warn({ err: error, media: id }, 'Could not release an unused cover.')
    }
  }, RELEASE_DELAY_MS)
  /* A script that replaces a cover is not kept alive just for this. */
  timer.unref?.()
}

/** Long enough for the save that called this to have committed. */
const RELEASE_DELAY_MS = 5000

/**
 * A file's fingerprint: SHA-256 of its bytes, as hex. Two uploads with the same
 * fingerprint are the same picture, whatever they were called — which is how
 * `/api/media/from-url` knows a re-published cover is one it already has.
 */
export function contentHashOf(file: { data?: Buffer; tempFilePath?: string } | undefined): string | null {
  const bytes =
    file?.data && file.data.length > 0
      ? file.data
      : file?.tempFilePath
        ? readFileSync(file.tempFilePath)
        : null
  return bytes ? createHash('sha256').update(bytes).digest('hex') : null
}
