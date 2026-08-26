'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'

import './CoverPreview.css'

/**
 * The cover, as one box.
 *
 * THE BOX IS THE CONSTANT AND THE CONTENT SWAPS. Empty, it is as small as its
 * own contents and offers the three ways in — drop, upload, or a URL. Filled,
 * the picture takes it over at the picture's real shape and full width, and the
 * controls wait underneath until Remove.
 *
 * THE FIELD THAT LIED, which is why any of this exists. A cover lives in either
 * of two places: `coverImage`, an upload, or `coverUrl`, a string — and the
 * string is what Content Studio sets, which is most of them. Payload's upload
 * field only knows about the first, so an article with a perfectly good cover
 * drew a large empty dropzone asking for one, and the single thing that could
 * not be seen anywhere in the editor was the picture.
 *
 * ONE FIELD NOW, NOT THREE. This began as a heading above the box, a picture
 * inside it and a caption below — three `ui` fields sharing `useCover` so they
 * could never disagree about whether a cover exists. The heading named a box
 * that names itself and the caption described a picture you are looking at, so
 * both are gone; what is left is the layer inside the box, which is the only one
 * that was ever doing work.
 *
 * REMOVE SITS ON THE PICTURE, and lives here rather than on the upload field.
 * That is not a nicety: Payload's own remove button belongs to the upload field,
 * so it exists only when the cover came from the library. A cover set by URL had
 * no remove control anywhere, and hiding the URL input under the picture without
 * providing one would leave no way to clear it.
 */

type MediaDoc = {
  url?: string | null
  alt?: string | null
  filename?: string | null
  /* Carried so the box can open to the picture's real shape, and reserve that
     shape before the image itself downloads. */
  width?: number | null
  height?: number | null
}

/** Which cover is in play, resolved once and shared by all three pieces — and
 *  by the read-only article on the overview, which has to resolve exactly the
 *  same cover from exactly the same two fields. Exported so there is one answer
 *  to "which picture is this article's?" rather than two that can drift. */
export function useCover() {
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
    /* Known only for library images — Payload stores the dimensions. A pasted
       URL is a stranger's file and its shape is not knowable until it loads. */
    width: uploaded?.width ?? null,
    height: uploaded?.height ?? null,
    hasUrl: Boolean(url),
    remove,
  }
}

/**
 * The empty box: one sentence offering the three ways in.
 *
 * DRAG AND DROP IS THE BOX ITSELF, so it is named but has no control of its own
 * — the whole well is Payload's drop target, on the layer underneath this one.
 * That is also why this layer takes pointer events only on the two things you
 * can actually click: anything else would swallow a file dropped on the middle
 * of the box.
 *
 * "UPLOAD A FILE" DRIVES PAYLOAD'S OWN CONTROL rather than reimplementing it.
 * The real button is still in the DOM, just not drawn — clicking it opens the
 * media drawer, which is where uploading a new file and picking an existing one
 * both live. Rebuilding that here would mean rebuilding the library, the upload
 * endpoint and the drawer's own state.
 */
function CoverEmpty({ onPasteUrl }: { onPasteUrl: () => void }) {
  const openLibrary = () => {
    document.querySelector<HTMLButtonElement>('.da-cover__ways .upload__listToggler')?.click()
  }

  return (
    <div className="da-coverprev__empty">
      <span aria-hidden="true" className="da-coverprev__glyph">
        <svg fill="none" height="26" viewBox="0 0 32 26" width="32" xmlns="http://www.w3.org/2000/svg">
          <rect height="21" rx="3" stroke="currentColor" strokeWidth="1.5" width="27" x="2.5" y="2.5" />
          <circle cx="11" cy="10" fill="currentColor" r="2" />
          <path
            d="M4 19l6-5 4 3 5-6 7 8"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </span>
      <p className="da-coverprev__headline">Add a cover image</p>
      <p className="da-coverprev__ways-text">
        Drag &amp; drop,{' '}
        <button className="da-coverprev__link" onClick={openLibrary} type="button">
          upload a file
        </button>
        , or{' '}
        <button className="da-coverprev__link" onClick={onPasteUrl} type="button">
          paste a URL
        </button>
      </p>
    </div>
  )
}

/**
 * The box while a URL is being typed into it.
 *
 * TAKES THE BOX OVER RATHER THAN SITTING BESIDE IT. A URL field parked
 * permanently under the well was a second way in competing with the first,
 * visible whether or not anyone wanted it. Asked for, it is the only thing in
 * the box — which is what makes Enter and Cancel unambiguous.
 *
 * NOTHING IS WRITTEN UNTIL ENTER. Cancel leaves the document exactly as it was,
 * so opening this by mistake costs nothing — and Escape does the same, because
 * a field that opens on a click should close on the key that closes everything
 * else.
 */
function CoverUrlEntry({ onDone }: { onDone: () => void }) {
  const dispatchFields = useFormFields(([, dispatch]) => dispatch)
  const [value, setValue] = React.useState('')
  const ref = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    ref.current?.focus()
  }, [])

  const commit = () => {
    const next = value.trim()
    if (!next) return
    dispatchFields({ type: 'UPDATE', path: 'coverUrl', value: next })
    onDone()
  }

  return (
    <div className="da-coverprev__urlentry">
      <label className="da-coverprev__urllabel" htmlFor="da-cover-url">
        Image URL
      </label>
      <input
        className="da-coverprev__urlinput"
        id="da-cover-url"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            onDone()
          }
        }}
        placeholder="https://…"
        ref={ref}
        type="url"
        value={value}
      />
      {/* A TICK AND A CROSS BESIDE THE FIELD THEY ACT ON. These were the words
          "Enter" and "Cancel"; next to a single text input the glyph pair is the
          older and plainer convention, and it keeps the box to the field and
          nothing else. Enter and Escape still do the same two jobs from the
          keyboard, which is how most of these will actually be committed. */}
      <div className="da-coverprev__urlactions">
        <button
          aria-label="Use this URL"
          className="da-iconbtn da-iconbtn--accent"
          disabled={!value.trim()}
          onClick={commit}
          title="Use this URL"
          type="button"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="18"
            viewBox="0 0 18 18"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 9.5l3.5 3.5L14 5.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
            />
          </svg>
        </button>
        <button
          aria-label="Cancel"
          className="da-iconbtn"
          onClick={onDone}
          title="Cancel"
          type="button"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="18"
            viewBox="0 0 18 18"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.5 4.5l9 9M13.5 4.5l-9 9"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.75"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

/** The layer inside the box: the picture, or the ways of getting one. */
export function CoverPreview() {
  const { src, alt, loading, width, height, remove } = useCover()
  const [broken, setBroken] = React.useState(false)
  const [urlMode, setUrlMode] = React.useState(false)

  React.useEffect(() => setBroken(false), [src])

  /* Removing a picture returns to the empty box, never to a half-open form
     left over from before. */
  React.useEffect(() => {
    if (src) setUrlMode(false)
  }, [src])

  if (!src && !loading) {
    return urlMode ? (
      <CoverUrlEntry onDone={() => setUrlMode(false)} />
    ) : (
      <CoverEmpty onPasteUrl={() => setUrlMode(true)} />
    )
  }

  if (!src) {
    // Holding the frame while the media document resolves — see `loading`. It
    // takes no height of its own; the controls underneath keep the box at its
    // empty size until there is a real picture to open it.
    return <div className="da-coverprev__frame da-coverprev__frame--loading" />
  }

  return (
    <div className="da-coverprev__frame">
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
          /* The intrinsic size, when it is known. With `block-size: auto` this
             is what lets the browser reserve the right height up front instead
             of reflowing the article when the picture arrives. */
          width={width ?? undefined}
          height={height ?? undefined}
          onError={() => setBroken(true)}
        />
      )}
      {/* On the picture, because it acts on the picture — and because the box is
          now the full width of the panel, a button underneath it would sit a
          long way from the thing it removes.

          THE PLATFORM'S ICON DISC. A word had to stay legible over an unknown
          photograph and was carrying a white pill and a shadow to manage it;
          the disc is a control the system already defines, and it solves the
          same problem with its own fill instead of a borrowed one. The label
          moves to `aria-label` and `title` — dropping a visible word means the
          accessible name has to be stated, not implied by the glyph. */}
      <button
        aria-label="Remove cover image"
        className="da-coverprev__remove"
        onClick={remove}
        title="Remove cover image"
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          viewBox="0 0 16 16"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.75"
          />
        </svg>
      </button>
    </div>
  )
}
