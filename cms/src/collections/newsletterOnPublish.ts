import type { CollectionAfterChangeHook, Field } from 'payload'

import { announce, type Announcement } from '../lib/newsletter'

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

export function newsletterOnPublish(
  kind: Announcement['kind'],
  toAnnouncement: (doc: Record<string, unknown>) => Announcement,
): CollectionAfterChangeHook {
  return async ({ context, doc, previousDoc, req, operation }) => {
    try {
      /* The stamp write below re-enters this hook. The transition test would
         catch it anyway — published to published is not a crossing — but
         relying on that is relying on an accident. */
      if (context?.skipNewsletter) return doc

      const wasPublished = previousDoc?.status === 'published'
      const isPublished = doc?.status === 'published'

      /* Only the crossing, and only if it has not been announced before. */
      if (!isPublished || wasPublished) return doc
      if (doc.newsletterSentAt) return doc
      /* A create that arrives already published counts; an update that merely
         touches a live document does not, which the transition test above has
         already settled. `operation` is read only to keep the log honest. */

      const result = await announce(req.payload, toAnnouncement(doc))

      if (result.sent > 0) {
        /*
         * `req` IS THE WHOLE POINT OF THIS CALL, and leaving it out cost a
         * real send.
         *
         * This runs inside the publish's own transaction, which holds a lock on
         * the row it is about to stamp. Without `req`, Payload opens a SECOND
         * transaction for the update — and that one waits for a lock the first
         * one will not release until this hook returns. It blocks until the
         * database's statement timeout, throws, and the catch below swallows
         * it: the email goes out, the stamp does not, and the article is left
         * armed to announce itself again.
         *
         * Which is exactly what happened on the first real send. It did not
         * show up in testing because a `payload.update` run from a script has
         * no outer transaction to deadlock against — the bug only exists on the
         * path that matters.
         *
         * Passing `req` joins the existing transaction instead of fighting it,
         * so the stamp commits with the publish or not at all.
         */
        await req.payload.update({
          collection: kind === 'article' ? 'articles' : 'resources',
          id: doc.id,
          data: { newsletterSentAt: new Date().toISOString() },
          overrideAccess: true,
          context: { skipNewsletter: true },
          req,
        })
      }

      console.info(
        `[newsletter] ${operation} of ${kind} "${doc.slug}" → sent ${result.sent}` +
          (result.testMode ? ' (test mode)' : '') +
          (result.skipped ? ` (${result.skipped})` : ''),
      )
    } catch (error) {
      /* Never the writer's problem. */
      console.error('[newsletter] announcement failed; the document is saved regardless', error)
    }

    return doc
  }
}
