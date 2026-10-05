import type { PayloadHandler } from 'payload'

import { mediaInUse } from '../lib/mediaUsage'

/**
 * GET /api/media/unused — the files nothing on the Hub uses.
 *
 * Behind the media library's "Unused" view: the ids it filters the list to, so
 * what you see there is exactly what nothing points at — no article (draft or
 * published), no resource, no picture in a body (lib/mediaUsage says where it
 * looks). Signed-in only: which files are orphans is a question about the
 * whole library, drafts included, and the public has no business with it.
 *
 * It only answers. Deleting stays a person's decision, made in the list with
 * Payload's own delete and its confirmation.
 */
export const mediaUnusedHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ error: 'Sign in to see unused files.' }, { status: 401 })
  }

  const [used, all] = await Promise.all([
    mediaInUse(req.payload, req),
    req.payload.find({
      collection: 'media',
      depth: 0,
      limit: 0,
      pagination: false,
      overrideAccess: true,
      req,
      select: {},
    }),
  ])

  const ids = all.docs.map((doc) => doc.id).filter((id) => !used.has(id))
  return Response.json({ ids, total: all.docs.length }, { headers: { 'Cache-Control': 'no-store' } })
}
