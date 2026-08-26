'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'

import './CoverPreview.css'

/**
 * The cover, as one box.
 *
 * THE BOX IS THE CONSTANT AND THE CONTENT SWAPS. Empty, it holds the two ways to
 * fill it — choose from the library, or paste a URL. Filled, the picture takes
 * the box over at exactly the same size, and the controls wait underneath until
 * Remove. Adding a cover moves nothing on the page, because the well's height
 * comes from its 4/3 ratio and never from what is inside it.
 *
 * THE FIELD THAT LIED, which is why any of this exists. A cover lives in either
 * of two places: `coverImage`, an upload, or `coverUrl`, a string — and the
 * string is what Content Studio sets, which is most of them. Payload's upload
 * field only knows about the first, so an article with a perfectly good cover
 * drew a large empty dropzone asking for one, and the single thing that could
 * not be seen anywhere in the editor was the picture.
 *
 * THREE PIECES, ONE STATE. The heading sits above the box and the caption below
 * it, while the picture is a layer inside it — so they cannot be one component
 * without rendering the heading on top of the controls it is meant to introduce.
 * They are three `ui` fields reading one hook, so they can never disagree about
 * whether a cover exists.
 *
 * REMOVE SITS ON THE PICTURE, and lives here rather than on the upload field.
 * That is not a nicety. Payload's own remove
 * button belongs to the upload field, so it exists only when the cover came from
 * the library. A cover set by URL had no remove control anywhere; hiding the URL
 * input under the picture without providing one would leave no way to clear it.
 */

/** Matches the public card's crop, so the box shows the crop that ships. */
const RATIO = '4 / 3'

type MediaDoc = { url?: string | null; alt?: string | null; filename?: string | null }

/** Which cover is in play, resolved once and shared by all three pieces. */
function useCover() {
  const coverImage = useFormFields(([fields]) => fields?.coverImage?.value)
  const coverUrl = useFormFields(([fields]) => fields?.coverUrl?.value)
  const dispatchFields = useFormFields(([, dispatch]) => dispatch)

  const [uploaded, setUploaded] = React.useState<MediaDoc | null>(null)

  const mediaId =
    typeof coverImage === 'string' || typeof coverImage === 'number' ? coverImage : null
  const url = typeof coverUrl === 'string' ? coverUrl.trim() : ''

  /* The form holds the media's id, not its URL, so the picture needs one fetch. */
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
        // Say nothing rather than claim a state that was never read.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mediaId])

  const fromLibrary = Boolean(uploaded?.url)

  /* A library cover holds an id, not a URL, so the picture is one fetch away.
     Without this the box rendered its EMPTY state for that round trip — a dashed
     well offering to set a cover the article already had, then the picture
     snapping in over it. `loading` keeps the frame up, so the box is filled from
     the first paint and nothing flashes. */
  const loading = mediaId !== null && !uploaded

  /* Clears whatever is currently WINNING, not both. With a library image over a
     URL, the first Remove drops the library image and the URL cover comes back
     into view; the second clears that. You remove what you can see. */
  const remove = () =>
    dispatchFields({
      type: 'UPDATE',
      path: fromLibrary ? 'coverImage' : 'coverUrl',
      value: fromLibrary ? null : '',
    })

  return {
    src: uploaded?.url || url || '',
    loading,
    fromLibrary,
    filename: uploaded?.filename ?? null,
    alt: uploaded?.alt ?? null,
    hasUrl: Boolean(url),
    remove,
  }
}

/** The section's heading, above the box. */
export function CoverHeading() {
  return <span className="field-label da-cover__heading">Cover image</span>
}

/** The picture layer. Renders nothing when there is no cover, so the controls
 *  underneath ARE the empty state rather than being covered by one. */
export function CoverPreview() {
  const { src, alt, loading, remove } = useCover()
  const [broken, setBroken] = React.useState(false)

  React.useEffect(() => setBroken(false), [src])

  if (!src && !loading) return null

  if (!src) {
    // Holding the frame while the media document resolves — see `loading`.
    return <div className="da-coverprev__frame da-coverprev__frame--loading" style={{ aspectRatio: RATIO }} />
  }

  return (
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
          alt={alt || 'Cover image preview'}
          onError={() => setBroken(true)}
        />
      )}
      {/* On the picture, because it acts on the picture — and because the box is
          now the full width of the panel, a button underneath it would sit a
          long way from the thing it removes. */}
      <button className="da-coverprev__remove" onClick={remove} type="button">
        Remove
      </button>
    </div>
  )
}

/** What the cover is, and the one thing you can do to it. Below the box. */
export function CoverCaption() {
  const { src, loading, fromLibrary, filename, hasUrl } = useCover()

  // Says nothing rather than "No cover yet" about a cover that is still loading.
  if (loading) return <p className="da-coverprev__source">&nbsp;</p>

  if (!src) {
    return (
      <p className="da-coverprev__note">
        No cover yet — the article still publishes, with a plain colour block where the picture
        goes.
      </p>
    )
  }

  return (
    <p className="da-coverprev__source">
      {fromLibrary ? (
        <>
          From the media library
          {filename ? <> · {filename}</> : null}
          {hasUrl ? <> — chosen over the URL below.</> : null}
        </>
      ) : (
        'From a pasted URL'
      )}
    </p>
  )
}
