'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'

import './CoverPreview.css'

/**
 * The cover, shown where the cover is edited.
 *
 * THE FIELD THAT LIED. A cover lives in either of two places: `coverImage`, an
 * upload, or `coverUrl`, a string — and the string is what Content Studio sets,
 * which is most of them. Payload's upload field only knows about the first, so
 * an article with a perfectly good cover rendered a large empty dashed dropzone
 * reading "Create New / Choose from existing", with the URL sitting below it as
 * raw text in a clipped input. The one thing that could not be seen was the
 * picture.
 *
 * It was not even a hard problem: the RelatedPicker two fields down rendered
 * that same URL as a thumbnail. The cover — by the collection's own comment
 * "the largest thing on the published page" — was the only image in the editor
 * nobody could look at.
 *
 * WHICH ONE WINS is stated, not left to be inferred. The public page prefers the
 * uploaded image and falls back to the URL, so this says which is in play rather
 * than making someone deduce it from a 12px note reading "Used only when no
 * image is set."
 *
 * ALWAYS RENDERS, including when there is no cover at all. Partly because "no
 * cover" is worth saying out loud — the article still publishes, with a colour
 * block where the picture goes — and partly so the panel above the upload does
 * not appear and disappear, which would make the whole block jump as soon as
 * anyone picked an image.
 *
 * IT ALSO CARRIES THE SECTION'S HEADING, which is why Payload's own "Cover
 * image" label is hidden in custom.scss. The label belongs above the thing it
 * names; because the upload field sits UNDER the preview, its label was landing
 * in the middle of the section, naming a picture already on screen above it.
 * One heading, at the top, and the machinery beneath.
 */

/** Matches the public card's ratio, so the crop shown here is the crop shipped. */
const RATIO = '4 / 3'

type MediaDoc = { url?: string | null; alt?: string | null }

export function CoverPreview() {
  const coverImage = useFormFields(([fields]) => fields?.coverImage?.value)
  const coverUrl = useFormFields(([fields]) => fields?.coverUrl?.value)

  const [uploaded, setUploaded] = React.useState<MediaDoc | null>(null)
  const [broken, setBroken] = React.useState(false)

  const mediaId =
    typeof coverImage === 'string' || typeof coverImage === 'number' ? coverImage : null
  const url = typeof coverUrl === 'string' ? coverUrl.trim() : ''

  /* The form holds the media's id, not its URL, so the picture needs one fetch.
     Depth 0 keeps it to the one document. */
  React.useEffect(() => {
    let cancelled = false
    if (mediaId === null) {
      setUploaded(null)
      return
    }
    void (async () => {
      try {
        const res = await fetch(`/api/media/${mediaId}?depth=0`, { credentials: 'include' })
        if (!res.ok) return
        const doc = (await res.json()) as MediaDoc
        if (!cancelled) setUploaded(doc)
      } catch {
        // Leave the preview empty rather than claim a state that was not read.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mediaId])

  React.useEffect(() => setBroken(false), [uploaded?.url, url])

  const src = uploaded?.url || url || ''
  const source = uploaded?.url ? 'From the media library' : url ? 'From the URL below' : null

  if (!src) {
    return (
      <div className="da-coverprev da-coverprev--empty">
        <span className="field-label">Cover image</span>
        <p className="da-coverprev__note">
          <strong>No cover yet.</strong> The article publishes without one — its page and card
          show a plain colour block where the picture goes.
        </p>
      </div>
    )
  }

  return (
    <div className="da-coverprev">
      <span className="field-label">Cover image</span>
      <div className="da-coverprev__frame" style={{ aspectRatio: RATIO }}>
        {broken ? (
          <p className="da-coverprev__broken">
            This image did not load. The address may be wrong, or the file may have moved.
          </p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="da-coverprev__img"
            src={src}
            alt={uploaded?.alt || 'Cover image preview'}
            onError={() => setBroken(true)}
          />
        )}
      </div>
      <p className="da-coverprev__source">
        {source}
        {uploaded?.url && url ? ' — the uploaded image wins over the URL.' : ''}
      </p>
    </div>
  )
}
