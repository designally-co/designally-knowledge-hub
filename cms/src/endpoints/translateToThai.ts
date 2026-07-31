import type { PayloadHandler } from 'payload'

import { translateResourceToThai, translationConfigured } from '../lib/translate'

/**
 * POST /api/resources/:id/translate-to-thai
 *
 * Manually (re)generate the Thai version of a resource from its English source.
 * Backs the "Translate to Thai" button in the admin. Auth required.
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
    return Response.json({ error: 'Missing resource id.' }, { status: 400 })
  }

  try {
    await translateResourceToThai({ payload: req.payload, id })
    return Response.json({ ok: true, id }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    req.payload.logger.error(`Manual Thai translation failed for resource ${id}: ${message}`)
    return Response.json({ error: message }, { status: 500 })
  }
}
