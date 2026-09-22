import type { CollectionAfterChangeHook, Field, Payload, PayloadRequest } from 'payload'

import { announce, type Announcement, type Localized } from '../lib/newsletter'

/**
 * Tell the list, once, when something goes live.
 *
 * THE HARD PART IS "ONCE". `afterChange` runs on every save, and a published
 * article is saved plenty of times afterwards — a typo, a better cover, a
 * translation. Two guards, because either alone is not enough:
 *
 *   1. THE TRANSITION. `previousDoc.status !== 'published' && doc.status ===
 *      'published'`. This is what makes an edit to a live article silent.
 *   2. THE TIMESTAMP. `newsletterSentAt`, written the moment a send succeeds.
 *      Unpublishing and republishing is a legitimate thing to do — a mistake
 *      spotted a minute after going live — and without this it would mail the
 *      list again. With it, a second publish is quiet.
 *
 * The field is visible and clearable in the sidebar, so "actually, send that
 * again" is a thing an editor can decide to do rather than a thing they have
 * to ask an engineer for.
 *
 * IT NEVER FAILS THE SAVE. The article is the point; the email is a
 * consequence. A refused API key, a network blip or a hard down at Resend
 * must not turn "publish" into an error the writer cannot get past, so
 * everything here is caught and logged. A send that did not happen is
 * recoverable — clear the timestamp and save again. A publish that did not
 * happen is somebody's afternoon.
 *
 * IT DOES NOT AWAIT ANY LONGER THAN IT MUST. The send runs before the response
 * returns, which on a small list is a second or two. Vercel gives a function
 * 60s; the batching in lib/newsletter is what keeps a real list inside that.
 */

/** The stamp that makes a second publish quiet. */
export const newsletterSentField: Field = {
  name: 'newsletterSentAt',
  type: 'date',
  admin: {
    position: 'sidebar',
    /* NOT read-only, because the description asks you to clear it. It used to
       be both, which made the instruction impossible to follow. */
    description:
      'When subscribers were told. To announce it again: set the article back to Draft, clear this, then publish.',
    date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy, HH:mm' },
  },
}

/**
 * The article in both languages, as far as it exists.
 *
 * `fallbackLocale: 'none'` is the load-bearing part. Payload's localization
 * falls back to English by default, so a plain read in `th` answers with the
 * English text and every document looks translated — the sentinel is the only
 * way to tell "written in Thai" from "standing in for Thai". It is the same
 * probe the Translate to Thai panel makes. A missing title means no Thai
 * version, and `announce` sends those readers the English one.
 */
async function localized(
  payload: Payload,
  kind: Announcement['kind'],
  doc: Record<string, unknown>,
  toAnnouncement: (doc: Record<string, unknown>) => Announcement,
): Promise<Localized> {
  const en = toAnnouncement(doc)

  try {
    const thai = (await payload.findByID({
      collection: kind === 'article' ? 'articles' : 'resources',
      id: doc.id as number,
      locale: 'th',
      fallbackLocale: 'none',
      depth: 1,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>

    /* The title is the test, because it is the one field that is always
       written and always translated. Its absence is the absence of a Thai
       version; a Thai title with an untranslated summary is still a Thai
       article, and `toAnnouncement` will simply find no summary. */
    return { en, th: thai?.title ? toAnnouncement(thai) : null }
  } catch (error) {
    /* A read that failed is not a translation that is missing, but it has to
       be treated as one — and English is the safe half of that guess. */
    console.error('[newsletter] could not read the Thai version; sending English', error)
    return { en, th: null }
  }
}

/**
 * Tell the list about this document, if it has just crossed into published and
 * has not been announced before. Both entry points come through here.
 *
 * `req` IS PASSED WHEN THIS RUNS INSIDE THE PUBLISH, and leaving it out cost a
 * real send. The hook runs inside the publish's own transaction, which holds a
 * lock on the row the stamp is about to write. Without `req`, Payload opens a
 * SECOND transaction for that update — and it waits for a lock the first one
 * will not release until the hook returns. It blocks until the database's
 * statement timeout, throws, and the catch swallows it: the email goes out, the
 * stamp does not, and the article is left armed to announce itself again. That
 * is exactly what happened on the first real send, and it never showed up in
 * testing because a `payload.update` run from a script has no outer transaction
 * to deadlock against.
 *
 * Called from `after()` there is no such transaction — the response has already
 * gone — so `req` is absent and the stamp is a write of its own.
 */
export async function announceOnce({
  doc,
  kind,
  payload,
  req,
  toAnnouncement,
  wasPublished,
}: {
  doc: Record<string, unknown>
  kind: Announcement['kind']
  payload: Payload
  req?: PayloadRequest
  toAnnouncement: (doc: Record<string, unknown>) => Announcement
  wasPublished: boolean
}): Promise<void> {
  try {
    /* Only the crossing, and only if it has not been announced before. A
       create that arrives already published counts; an update that merely
       touches a live document does not. */
    if (doc.status !== 'published' || wasPublished) return
    if (doc.newsletterSentAt) return

    const result = await announce(payload, await localized(payload, kind, doc, toAnnouncement))

    if (result.sent > 0) {
      await payload.update({
        collection: kind === 'article' ? 'articles' : 'resources',
        id: doc.id as number,
        data: { newsletterSentAt: new Date().toISOString() },
        overrideAccess: true,
        context: { skipNewsletter: true },
        ...(req ? { req } : {}),
      })
    }

    console.info(
      `[newsletter] ${kind} "${doc.slug}" → sent ${result.sent}` +
        (result.byLanguage ? ` (${result.byLanguage.en} en, ${result.byLanguage.th} th)` : '') +
        (result.testMode ? ' (test mode)' : '') +
        (result.skipped ? ` (${result.skipped})` : ''),
    )
  } catch (error) {
    /* Never the writer's problem. */
    console.error('[newsletter] announcement failed; the document is saved regardless', error)
  }
}

export function newsletterOnPublish(
  kind: Announcement['kind'],
  toAnnouncement: (doc: Record<string, unknown>) => Announcement,
): CollectionAfterChangeHook {
  return async ({ context, doc, previousDoc, req }) => {
    /* The stamp write re-enters this hook. The transition test would catch it
       anyway — published to published is not a crossing — but relying on that
       is relying on an accident.

       Content Studio sets the same flag for a different reason: it publishes
       and translates in one request, and the announcement waits for the
       translation. See endpoints/fromMarkdown. */
    if (context?.skipNewsletter) return doc

    await announceOnce({
      doc,
      kind,
      payload: req.payload,
      req,
      toAnnouncement,
      wasPublished: previousDoc?.status === 'published',
    })

    return doc
  }
}
