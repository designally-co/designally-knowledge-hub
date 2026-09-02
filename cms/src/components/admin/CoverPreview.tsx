'use client'

import React from 'react'
import { ImagePlus, Images, Upload } from 'lucide-react'
import { useForm, useFormFields } from '@payloadcms/ui'

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
  /* SEE `commit` BELOW — dispatching a value does not make the form dirty, and
     an undirty form does not save. */
  const { setModified } = useForm()

  const [uploaded, setUploaded] = React.useState<MediaDoc | null>(null)
  /* Bumped after the description is written, so the picture's own record is
     re-read rather than trusted from memory. */
  const [round, setRound] = React.useState(0)

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
  }, [mediaId, round])

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
  const remove = () => {
    dispatchFields({
      type: 'UPDATE',
      path: fromLibrary ? 'coverImage' : 'coverUrl',
      value: fromLibrary ? null : '',
    })
    setModified(true)
  }

  /* Putting a picture in is one dispatch and one flag, in one place, so every
     door — the device, the library, a pasted link — writes the cover the same
     way. See the note in `CoverUrlEntry` on why the flag is not optional. */
  const setLibraryCover = (id: number | string) => {
    dispatchFields({ type: 'UPDATE', path: 'coverImage', value: id })
    setModified(true)
  }

  return {
    src: uploaded?.url || url || '',
    loading,
    fromLibrary,
    mediaId,
    setLibraryCover,
    refresh: () => setRound((n) => n + 1),
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
 * Choosing a file, and the upload that starts the moment you do.
 *
 * THIS IS THE WHOLE FIX. Putting a picture on an article used to mean opening
 * the library, then opening a media DOCUMENT inside it, filling that document
 * in, saving it, and coming back — a document inside a document, two Saves, and
 * three layers to get one picture onto a page. Five differently-named controls
 * led into that same room: Create New, Upload new, Select a file, Choose from
 * existing, Paste URL.
 *
 * A field never opens a document now. The file uploads where you dropped it, the
 * picture is there, and the one thing an upload cannot know — what the picture
 * shows — is asked underneath it. The library keeps the file; the article keeps
 * its picture; nobody visits a form.
 */
function useUpload({
  onDone,
}: {
  onDone: (doc: { id: number | string; alt?: string | null }) => void
}) {
  const input = React.useRef<HTMLInputElement | null>(null)
  const abort = React.useRef<AbortController | null>(null)
  const [staged, setStaged] = React.useState<string | null>(null)
  const [error, setError] = React.useState<null | string>(null)

  /* TWO CLEANUPS, BECAUSE THEY RUN AT DIFFERENT TIMES — and putting them in one
     effect keyed on `staged` made the upload cancel itself. Staging the local
     preview IS a change to `staged`, so the effect tore down the moment the file
     started going up and took the request with it: measured, as a POST that
     reached the server and was aborted before the client could read what came
     back. The file arrived in the library and the cover was never set.

     The preview URL is released when it is replaced or the box goes away. The
     request is abandoned only if the box itself goes away. */
  React.useEffect(() => {
    if (!staged) return
    return () => URL.revokeObjectURL(staged)
  }, [staged])

  React.useEffect(() => () => abort.current?.abort(), [])

  const send = async (file: File) => {
    setError(null)
    setStaged(URL.createObjectURL(file))

    const controller = new AbortController()
    abort.current = controller

    const body = new FormData()
    body.append('file', file)
    /* Payload's REST create for an upload collection: the file, and the rest of
       the document as JSON beside it. Empty, deliberately — the description is
       asked afterwards, in the well, and `alt` is optional for exactly this. */
    body.append('_payload', JSON.stringify({}))

    try {
      const res = await fetch('/api/media', {
        body,
        credentials: 'include',
        method: 'POST',
        signal: controller.signal,
      })
      const json = (await res.json()) as {
        doc?: { id: number | string; alt?: string | null }
        errors?: { message?: string }[]
      }
      if (!res.ok || !json.doc) {
        setStaged(null)
        setError(json.errors?.[0]?.message || 'The file could not be uploaded.')
        return
      }
      onDone(json.doc)
      setStaged(null)
    } catch (err) {
      setStaged(null)
      // An abort is a choice, not a failure, and says nothing.
      if ((err as Error)?.name !== 'AbortError') {
        setError('The file could not be uploaded. Check your connection and try again.')
      }
    } finally {
      abort.current = null
    }
  }

  const choose = () => input.current?.click()

  const field = (
    <input
      accept="image/*"
      className="da-coverprev__file"
      onChange={(e) => {
        const file = e.target.files?.[0]
        // Cleared so that choosing the same file twice still fires a change.
        e.target.value = ''
        if (file) void send(file)
      }}
      ref={input}
      tabIndex={-1}
      type="file"
    />
  )

  return {
    cancel: () => abort.current?.abort(),
    choose,
    clearError: () => setError(null),
    error,
    field,
    staged,
  }
}

/** The library, as a place you look — Payload's own drawer, opened by its own
 *  control. The button is in the DOM already; it is simply not drawn. */
const openLibrary = () => {
  document.querySelector<HTMLButtonElement>('.da-cover__ways .upload__listToggler')?.click()
}

/**
 * The empty box: two doors, and a third way in that stays quiet.
 *
 * IT OFFERED THREE THINGS AND ONE OF THEM LIED. "Upload a file" opened the
 * library; the library's own button opened a document; and a URL sat as a peer
 * of both, though it is the rarest of the three by a distance — most pasted
 * covers arrive through Content Studio, not through anybody typing here.
 *
 * Now: the picture comes off your machine, or out of the library. The link is a
 * line under them, in the smaller type of a thing you would go looking for.
 *
 * DRAG AND DROP IS STILL THE BOX ITSELF — Payload's drop target is the layer
 * underneath this one, which is why this layer takes pointer events only on the
 * controls and never across the middle of the well.
 */
function CoverEmpty({
  error,
  onAdd,
  onPasteUrl,
  onRetry,
}: {
  error: null | string
  onAdd: () => void
  onPasteUrl: () => void
  onRetry: () => void
}) {
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

      {error ? (
        <>
          {/* The problem, then the way out of it — not a red line telling you
              something went wrong and leaving you to find the button again. */}
          <p className="da-coverprev__headline">{error}</p>
          <p className="da-coverprev__ways-text">
            <button className="da-coverprev__link" onClick={onRetry} type="button">
              Choose another picture
            </button>
          </p>
        </>
      ) : (
        <>
          <p className="da-coverprev__headline">Add a cover image</p>
          <div className="da-coverprev__doors">
            <button className="da-coverprev__door da-coverprev__door--primary" onClick={onAdd} type="button">
              <ImagePlus aria-hidden="true" size={16} strokeWidth={1.75} />
              Add a picture
            </button>
            <button className="da-coverprev__door" onClick={openLibrary} type="button">
              <Images aria-hidden="true" size={16} strokeWidth={1.75} />
              Choose from library
            </button>
          </div>
          <p className="da-coverprev__ways-text">
            Drop one here, or{' '}
            <button className="da-coverprev__link" onClick={onPasteUrl} type="button">
              paste a link
            </button>
          </p>
        </>
      )}
    </div>
  )
}

/**
 * The description, asked where the picture is.
 *
 * IT WAS ASKED IN ANOTHER DOCUMENT, which is the whole reason a cover took three
 * layers to set. It belongs here: you are looking at the picture, so you can
 * describe it, and the description is the one fact about a file that no upload
 * can supply.
 *
 * IT SAYS WHY. "For screen readers" is what it is for; "the article will not
 * save without it" is what happens if you skip it — which is true, enforced on
 * `coverImage` in the Articles config, and better read here than met as a
 * rejection after pressing Save.
 *
 * WRITTEN TO THE FILE, NOT TO THE ARTICLE. The description belongs to the
 * picture and follows it into every other article that uses it, so this saves on
 * its own — blur or Enter — rather than waiting for the document's Save.
 */
function CoverDescribe({
  focus,
  mediaId,
  onActive,
  onSaved,
}: {
  /* True only for a file that arrived a second ago. Taking the caret is right
     when you just chose a picture and wrong when you came back to an article and
     it grabbed you out of the title. */
  focus: boolean
  mediaId: number | string
  /* Tells the box to keep this open while it is being used — see below. */
  onActive: (active: boolean) => void
  onSaved: () => void
}) {
  const [value, setValue] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const written = React.useRef('')
  const input = React.useRef<HTMLInputElement | null>(null)

  const commit = React.useCallback(async () => {
    const alt = value.trim()
    if (!alt || alt === written.current || saving) return
    setSaving(true)
    setFailed(false)
    try {
      const res = await fetch(`/api/media/${mediaId}`, {
        body: JSON.stringify({ alt }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })
      if (!res.ok) throw new Error('patch failed')
      written.current = alt
      onSaved()
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }, [mediaId, onSaved, saving, value])

  /*
   * IT SAVES AS YOU TYPE, and not only when you leave.
   *
   * Blur was the whole story first, and it puts a race in the one place that
   * cannot afford one: pressing Save moves focus out of here, so the write of
   * the description and the save of the article start together — and the article
   * is refused for a missing description that is sitting on the screen, typed.
   * A second's pause commits instead, which is long before anyone's hand reaches
   * Save, and blur and Enter still commit immediately for anyone faster.
   *
   * `written` is what stops it saying the same thing twice: an unchanged value
   * is not a write.
   */
  React.useEffect(() => {
    const next = value.trim()
    if (!next || next === written.current) return
    const timer = setTimeout(() => void commit(), 700)
    return () => clearTimeout(timer)
  }, [commit, value])

  return (
    <div className="da-coverprev__describe">
      <label className="da-coverprev__describe-label" htmlFor="da-cover-alt">
        Describe this picture
      </label>
      <input
        autoFocus={focus}
        className="da-coverprev__describe-input"
        id="da-cover-alt"
        onBlur={() => {
          void commit()
          onActive(false)
        }}
        onFocus={() => onActive(true)}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            void commit()
          }
        }}
        placeholder="A designer at work in a workshop"
        ref={input}
        type="text"
        value={value}
      />
      <p className="da-coverprev__describe-note">
        {failed
          ? 'That could not be saved. Try again.'
          : 'For readers using a screen reader, and for search. The article will not save without it.'}
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
  /* DISPATCHING A VALUE IS NOT THE SAME AS TYPING ONE. `UPDATE` writes the field
     but leaves the form's `modified` flag alone, and Payload's Save is a no-op
     on an unmodified form — measured, as a pasted cover URL that showed in the
     box, survived until Save, and then never reached the database: no PATCH was
     sent at all. Touching any other field made it save, which is how it stayed
     hidden. The flag is set explicitly. */
  const { setModified } = useForm()
  const [value, setValue] = React.useState('')
  const ref = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    ref.current?.focus()
  }, [])

  const commit = () => {
    const next = value.trim()
    if (!next) return
    dispatchFields({ type: 'UPDATE', path: 'coverUrl', value: next })
    setModified(true)
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
  const { src, alt, loading, width, height, mediaId, fromLibrary, setLibraryCover, refresh, remove } =
    useCover()
  const [broken, setBroken] = React.useState(false)
  const [urlMode, setUrlMode] = React.useState(false)
  /* Set the moment an upload lands, so the description is asked for the picture
     you just chose — and not, on every visit afterwards, for one that came from
     somewhere else and is somebody else's to describe. */
  const [justAdded, setJustAdded] = React.useState<number | string | null>(null)
  /* THE STRIP OUTLIVES THE PROBLEM IT SOLVES, for exactly as long as someone is
     using it. Without this, the description saving mid-sentence would take the
     field away mid-sentence: the moment `alt` lands the picture is no longer
     undescribed, and the reason for the strip is gone. It leaves when you do. */
  const [describing, setDescribing] = React.useState(false)

  const upload = useUpload({
    onDone: (doc) => {
      setLibraryCover(doc.id)
      if (!doc.alt?.trim()) setJustAdded(doc.id)
    },
  })

  React.useEffect(() => setBroken(false), [src])

  /* Removing a picture returns to the empty box, never to a half-open form
     left over from before. */
  React.useEffect(() => {
    if (src) setUrlMode(false)
  }, [src])

  const add = () => {
    upload.clearError()
    upload.choose()
  }

  /* THE PICTURE IS THERE BEFORE THE SERVER HAS IT. The file being uploaded is
     drawn at the size it will be, from the copy already on this machine, so the
     box does not sit empty through a round trip and then jump. */
  /* ONE ELEMENT, WHATEVER STATE THIS IS IN. The cover box is a single grid cell
     with the picture's layer stacked on the drop target's — so everything this
     field renders has to arrive as ONE item, or the second one is placed in the
     same cell and disappears underneath the first. Measured: the description
     strip was there, focused, accepting text, and drawn behind the photograph.
     `.da-coverprev` is the column the two of them stack in. */
  if (upload.staged) {
    return (
      <div className="da-coverprev">
        {upload.field}
          <div className="da-coverprev__frame da-coverprev__frame--staged">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="da-coverprev__img" src={upload.staged} />
          <div className="da-coverprev__uploading">
            <span className="da-coverprev__uploading-text">Uploading…</span>
            <button className="da-coverprev__link" onClick={upload.cancel} type="button">
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!src && !loading) {
    return (
      <div className="da-coverprev">
        {upload.field}
        {urlMode ? (
          <CoverUrlEntry onDone={() => setUrlMode(false)} />
        ) : (
          <CoverEmpty
            error={upload.error}
            onAdd={add}
            onPasteUrl={() => setUrlMode(true)}
            onRetry={add}
          />
        )}
      </div>
    )
  }

  if (!src) {
    // Holding the frame while the media document resolves — see `loading`. It
    // takes no height of its own; the controls underneath keep the box at its
    // empty size until there is a real picture to open it.
    return (
      <div className="da-coverprev">
        <div className="da-coverprev__frame da-coverprev__frame--loading" />
      </div>
    )
  }

  /* ASKED FOR ANY UNDESCRIBED PICTURE ON THIS ARTICLE, not only one that arrived
     just now. It was the narrower rule first, on the reasoning that a picture
     taken from the library is somebody else's to describe — and that left a dead
     end: an article whose cover came from Content Studio without a description
     could not be saved, and had nothing on the screen to fix. If it is on this
     article and it is blocking the save, this is where it gets answered. */
  const undescribed = fromLibrary && mediaId !== null && !alt?.trim()

  return (
    <div className="da-coverprev">
      {upload.field}
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

        {/* CHANGING IT IS THE SAME TWO DOORS, in the same words, in the order
            they are in on the empty box — so replacing a cover is the act you
            already know rather than a third thing to learn. On the picture,
            because the box is the full width of the panel and a control
            underneath would sit a long way from what it acts on. */}
        {broken ? null : (
          <div className="da-coverprev__swap">
            <button
              aria-label="Replace with a picture from this device"
              className="da-coverprev__swap-btn"
              onClick={add}
              title="Replace with a picture from this device"
              type="button"
            >
              <Upload aria-hidden="true" size={15} strokeWidth={1.75} />
              Replace
            </button>
            <button
              aria-label="Replace with a picture from the library"
              className="da-coverprev__swap-btn"
              onClick={openLibrary}
              title="Replace with a picture from the library"
              type="button"
            >
              <Images aria-hidden="true" size={15} strokeWidth={1.75} />
              Library
            </button>
          </div>
        )}

        {/* THE PLATFORM'S ICON DISC. A word had to stay legible over an unknown
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

      {undescribed || describing ? (
        <CoverDescribe
          focus={justAdded === mediaId}
          mediaId={mediaId as number | string}
          onActive={setDescribing}
          onSaved={() => {
            setJustAdded(null)
            refresh()
          }}
        />
      ) : null}
    </div>
  )
}
