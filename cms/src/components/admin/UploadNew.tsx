'use client'

import React from 'react'

/**
 * "Upload new" in the picker, and the file chooser it should have opened.
 *
 * THE BUTTON SAID "CREATE NEW" AND OPENED A FORM. Payload's list drawer offers
 * one way past the library: a toggler that opens a blank document with an empty
 * dropzone in it, so choosing a file off your machine took a click to open a
 * form, a click to open the chooser, and then the form again. The button's own
 * words were the collection's — "create a new Media" — for something a person
 * would call uploading a picture.
 *
 * So the words become "Upload new" and the click opens the chooser first. What
 * comes back is handed to the same drawer Payload would have opened, with the
 * file already in it: the sheet arrives showing the picture, asking only for the
 * one thing it cannot know, which is what the picture is of.
 *
 * WHY IT IS DONE OUT HERE, ON THE DOCUMENT. The list drawer, its header and that
 * toggler are all Payload's, rendered into a portal at the root of the admin
 * from a tree this project has no component inside. A capture-phase listener on
 * the document reaches it wherever it opens — the cover well, a resource's file,
 * any upload field added later — and one observer keeps the label right through
 * the re-renders that searching and paging cause.
 *
 * THE HAND-OFF IS A REAL `change` EVENT on Payload's own hidden input, not a
 * call into its state: `DataTransfer` is the one way to put a File onto an
 * input, and React reads `event.target.files` off the event like any other
 * change. Nothing here reimplements the upload — the drawer still does all of
 * it, one step earlier than it used to.
 */

const TOGGLER = '.list-drawer .list-header__create-new-button'
const DROP_INPUT = '.doc-drawer input.file-field__hidden-input'

/** Wait for an element that a React render is about to put on the page. */
function when(selector: string, tries = 60): Promise<Element | null> {
  return new Promise((resolve) => {
    let left = tries
    const look = () => {
      const el = document.querySelector(selector)
      if (el) return resolve(el)
      if (left-- > 0) return requestAnimationFrame(look)
      resolve(null)
    }
    look()
  })
}

export function UploadNew({ children }: { children?: React.ReactNode }) {
  React.useEffect(() => {
    /* Set while we drive the toggler ourselves, so our own click passes through
       the listener below instead of opening a second chooser. */
    let passing = false

    const input = document.createElement('input')
    input.type = 'file'
    input.hidden = true
    /* The chooser filters to what this collection accepts. Read off Payload's
       own input when there is one, so it stays true if the collection's
       mimeTypes change. */
    input.accept = 'image/*,application/pdf,image/svg+xml'
    document.body.appendChild(input)

    const hand = async (file: File) => {
      passing = true
      document.querySelector<HTMLButtonElement>(TOGGLER)?.click()
      passing = false

      const target = (await when(DROP_INPUT)) as HTMLInputElement | null
      if (!target) return

      const carrier = new DataTransfer()
      carrier.items.add(file)
      target.files = carrier.files
      target.dispatchEvent(new Event('change', { bubbles: true }))
    }

    const onPick = () => {
      const file = input.files?.[0]
      // The value is cleared so that choosing the SAME file twice still fires a
      // change the second time.
      input.value = ''
      if (file) void hand(file)
    }

    const onClick = (event: MouseEvent) => {
      if (passing) return
      const el = event.target as Element | null
      if (!el?.closest?.(TOGGLER)) return
      event.preventDefault()
      event.stopPropagation()
      input.click()
    }

    /* The words — the ones you read, and the ones a screen reader does. Payload
       builds both from the collection's labels ("Create New", "Add new Media")
       and rebuilds them whenever the list re-renders. */
    const label = () => {
      const el = document.querySelector<HTMLElement>(`${TOGGLER} .pill__label, ${TOGGLER} .btn__label`)
      if (el && el.textContent !== 'Upload new') el.textContent = 'Upload new'
      const btn = document.querySelector<HTMLElement>(TOGGLER)
      if (btn && btn.getAttribute('aria-label') !== 'Upload a new file') {
        btn.setAttribute('aria-label', 'Upload a new file')
      }
    }

    input.addEventListener('change', onPick)
    document.addEventListener('click', onClick, true)
    const watch = new MutationObserver(label)
    watch.observe(document.body, { childList: true, subtree: true })
    label()

    return () => {
      input.removeEventListener('change', onPick)
      document.removeEventListener('click', onClick, true)
      watch.disconnect()
      input.remove()
    }
  }, [])

  return <>{children}</>
}
