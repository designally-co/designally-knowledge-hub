'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

/**
 * One verb for getting a file in, wherever you are standing.
 *
 * THE FIVE DOORS. Payload offered Create New, Upload new, Select a file, Choose
 * from existing and Paste URL, and four of those are the same act — put a file
 * in from this machine — wearing four names, each opening a different room. On
 * the library's own list, "Create New" opened a blank media DOCUMENT with an
 * empty dropzone in it: three clicks to do the thing the button is named after.
 *
 * There are two verbs in this admin now, and they are the same two everywhere:
 *
 *   Upload / Add a file   the chooser opens, the files land
 *   Choose from library   the picker, which is a place you look
 *
 * This owns the first one on the surfaces Payload draws itself.
 *
 *   In the picker      one file. It is handed to the drawer Payload would have
 *                      opened anyway, with the file already in it, so the sheet
 *                      arrives asking only what it cannot know.
 *   On the library     many. They land undescribed and the list says which ones
 *                      are still waiting — because twenty files is twenty
 *                      descriptions, and a form per file is not an import.
 *
 * WHY IT IS DONE OUT HERE, ON THE DOCUMENT. That toggler, the list header and
 * the drawer are all Payload's, rendered into a portal at the root of the admin
 * from a tree this project has no component inside. A capture-phase listener
 * reaches it wherever it opens, and one observer keeps the label right through
 * the re-renders that searching and paging cause.
 *
 * THE HAND-OFF IS A REAL `change` EVENT on Payload's own hidden input, not a
 * call into its state: `DataTransfer` is the one way to put a File onto an
 * input, and React reads `event.target.files` off the event like any other
 * change. Nothing here reimplements the upload — the drawer still does all of
 * it, one step earlier than it used to.
 */

/** The picker's own toggler — one file, handed to the drawer. */
const IN_PICKER = '.list-drawer .list-header__create-new-button'
const TOGGLER = '.list-header__create-new-button'
const DROP_INPUT = '.doc-drawer input.file-field__hidden-input'

/**
 * MEDIA ONLY, AND SAID ONCE PER BUTTON.
 *
 * Articles and Resources have a "Create New" too, and theirs means what it says
 * — a blank document, which is the right thing for a document. Only a collection
 * of FILES has a create button that should have been a chooser all along. Get
 * this wrong and "New article" opens a file dialog.
 *
 * Read from the button's untouched accessible name ("Add new Media") before this
 * file rewrites it, with the list's own class as corroboration, and stamped so
 * the answer survives the rewrite. `many` is the second half: the library's list
 * takes a batch, the picker inside a drawer is choosing one picture.
 */
type Kind = 'many' | 'no' | 'one'

function kindOf(button: HTMLElement): Kind {
  const known = button.dataset.daUpload as Kind | undefined
  if (known) return known

  const name = button.getAttribute('aria-label') || ''
  const media = /\bmedia\b/i.test(name) || Boolean(button.closest('.collection-list--media'))
  const kind: Kind = !media ? 'no' : button.closest('.list-drawer') ? 'one' : 'many'
  button.dataset.daUpload = kind
  return kind
}

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
  const router = useRouter()
  /* Read by the click handler, which is installed once and must not close over
     a stale render's value. */
  const busy = React.useRef(false)
  const [progress, setProgress] = React.useState<null | { done: number; total: number }>(null)

  React.useEffect(() => {
    /* Set while we drive the toggler ourselves, so our own click passes through
       the listener below instead of opening a second chooser. */
    let passing = false

    const input = document.createElement('input')
    input.type = 'file'
    input.hidden = true
    input.accept = 'image/*,application/pdf,image/svg+xml'
    document.body.appendChild(input)

    /* IN THE PICKER: one file, into the drawer Payload was going to open. */
    const toDrawer = async (file: File) => {
      passing = true
      document.querySelector<HTMLButtonElement>(IN_PICKER)?.click()
      passing = false

      const target = (await when(DROP_INPUT)) as HTMLInputElement | null
      if (!target) return

      const carrier = new DataTransfer()
      carrier.items.add(file)
      target.files = carrier.files
      target.dispatchEvent(new Event('change', { bubbles: true }))
    }

    /* ON THE LIBRARY: all of them, straight to the collection.
     *
     * `_payload` is empty on purpose. A description is the one thing an upload
     * cannot supply, `alt` is optional for exactly this reason, and the list
     * marks every row still waiting for one — see Media and MediaCells. Asking
     * twenty times in a row is what made bulk upload unusable. */
    const toLibrary = async (files: File[]) => {
      busy.current = true
      setProgress({ done: 0, total: files.length })

      for (let i = 0; i < files.length; i++) {
        const body = new FormData()
        body.append('file', files[i])
        body.append('_payload', JSON.stringify({}))
        try {
          await fetch('/api/media', { body, credentials: 'include', method: 'POST' })
        } catch {
          /* One bad file does not take the rest of the batch down with it; the
             list is the report — whatever arrived is in it. */
        }
        setProgress({ done: i + 1, total: files.length })
      }

      busy.current = false
      setProgress(null)
      router.refresh()
    }

    const onPick = () => {
      const files = Array.from(input.files ?? [])
      // Cleared so that choosing the same file twice still fires a change.
      input.value = ''
      if (!files.length) return
      if (input.multiple) void toLibrary(files)
      else void toDrawer(files[0])
    }

    const onClick = (event: MouseEvent) => {
      if (passing || busy.current) return
      const el = event.target as Element | null
      const button = el?.closest?.(TOGGLER) as HTMLElement | null
      if (!button) return
      const kind = kindOf(button)
      // Another collection's Create New. It means a blank document; leave it be.
      if (kind === 'no') return
      event.preventDefault()
      event.stopPropagation()
      input.multiple = kind === 'many'
      input.click()
    }

    /* The words — the ones you read and the ones a screen reader does. Payload
       builds both from the collection's labels ("Create New", "Add new Media")
       and rebuilds them whenever the list re-renders. */
    const label = () => {
      for (const button of document.querySelectorAll<HTMLElement>(TOGGLER)) {
        const kind = kindOf(button)
        if (kind === 'no') continue
        const text = kind === 'many' ? 'Upload' : 'Add a file'
        const name =
          kind === 'many' ? 'Upload files to the library' : 'Add a file from this device'
        const el = button.querySelector<HTMLElement>('.pill__label, .btn__label')
        if (el && el.textContent !== text) el.textContent = text
        if (button.getAttribute('aria-label') !== name) button.setAttribute('aria-label', name)
      }

      /* The rest of the vocabulary, wherever Payload draws it. One act, one name,
         on every surface: the library is somewhere you CHOOSE from, a file comes
         from your machine, and a link is pasted. "Choose from existing",
         "Select a file" and "Paste URL" were three of the five doors, and two of
         them were the same door as the button above. */
      const SAY: [string, string][] = [
        ['Choose from existing', 'Choose from library'],
        ['Select a file', 'Add a file'],
        ['Paste URL', 'Paste a link'],
      ]
      for (const el of document.querySelectorAll<HTMLElement>(
        '.upload__listToggler .btn__label, .upload__listToggler .pill__label, .file-field__dropzoneButtons .btn__label',
      )) {
        for (const [was, now] of SAY) if (el.textContent === was) el.textContent = now
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
  }, [router])

  return (
    <>
      {children}
      {/* WHAT A BATCH LOOKS LIKE WHILE IT RUNS. The files go up one at a time —
          twelve parallel uploads of a photograph is how a dev server falls over
          — so there is a real count to show, and a count is more use than a
          spinner: it says how much is left. */}
      {progress ? (
        <p aria-live="polite" className="da-uploading" role="status">
          Uploading {progress.done + 1 > progress.total ? progress.total : progress.done + 1} of{' '}
          {progress.total}…
        </p>
      ) : null}
    </>
  )
}
