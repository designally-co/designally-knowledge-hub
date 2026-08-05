import type { PayloadHandler } from 'payload'

import { translateItemToThai, translationConfigured } from '../lib/translate'

/**
 * POST /api/articles/:id/translate-to-thai
 * POST /api/resources/:id/translate-to-thai
 *
 * Manually (re)generate the Thai version of an item from its English source.
 * Registered on both collections and works out which one it was called on from
 * the request, so the button behaves the same in either place. Auth required.
 */
export const translateToThaiHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  if (!translationConfigured()) {
    return Response.json(
      { error: 'Translation is not configured — set ANTHROPIC_API_KEY.' },
      { status: 501 },
    )
  }

  const id = req.routeParams?.id as string | undefined
  if (!id) {
    return Response.json({ error: 'Missing id.' }, { status: 400 })
  }

  // Which collection the button was pressed on. routeParams carries it for
  // collection endpoints; the URL is a fallback so a Payload change here cannot
  // silently translate the wrong collection.
  const fromParams = req.routeParams?.collection
  const fromPath = /\/api\/(articles|resources)\//.exec(req.url ?? '')?.[1]
  const collection: 'articles' | 'resources' =
    fromParams === 'articles' || fromPath === 'articles' ? 'articles' : 'resources'

  try {
    await translateItemToThai({ payload: req.payload, collection, id })
    return Response.json({ ok: true, id }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    req.payload.logger.error(`Manual Thai translation failed for ${collection} ${id}: ${message}`)
    return Response.json({ error: message }, { status: 500 })
  }
}
