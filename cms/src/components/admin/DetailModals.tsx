'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ConfirmationModal, useDocumentDrawer, useDocumentDrawerContext, useFormModified, useModal } from '@payloadcms/ui'

type Detail = {
  collectionSlug: 'media'
  id: number
  opener: HTMLAnchorElement
  request: number
}

/**
 * The half of a dialog that Payload does not draw.
 *
 * THE CHROME WAS REWRITTEN AND THE CONTRACT WAS NOT. The sheet looks like this
 * product's; everything it DOES was still the vendor's default, and measured on
 * a keyboard that default is not a dialog at all:
 *
 *   - Opening it left focus on the row link BEHIND the sheet, so Tab walked the
 *     list underneath and Escape went nowhere. Payload's focus trap works — it
 *     just never engages, because it only holds focus that is already inside.
 *   - `aria-modal="true"` was set on a `<dialog>` opened by its `open`
 *     attribute rather than `showModal()`. That is not a modal: the page behind
 *     stays in the accessibility tree, and the attribute is a claim the DOM
 *     does not honour. `inert` is what actually makes it true.
 *   - The dialog's accessible name was `doc-drawer_media_0_6__r_0_`. The real
 *     heading was right there, clipped for screen readers, unreferenced.
 *   - The sentence under a field — "Needed to publish." — was never announced,
 *     because nothing pointed at it.
 *   - `action-save` existed twice in the document: the page's Save and the
 *     drawer's.
 *
 * All of it is one effect, because all of it is one idea: the sheet in front of
 * you is the only thing there is until you leave it.
 */
function useDialogContract(open: boolean, closeDrawer: () => void) {
  React.useEffect(() => {
    if (!open) return

    const undo: (() => void)[] = []
    let frame = 0
    let tries = 0

    /* THE SHEET IS NOT FURNISHED ON THE FRAME IT APPEARS. Payload mounts the
       dialog first and renders the document into it a tick or two later, so
       everything below — the heading to name it by, the field to land in —
       has to be waited for. Same rAF retry the bar's host uses. */
    const apply = () => {
      const dialog = document.querySelector<HTMLElement>('.payload__modal-item.doc-drawer')
      const ready = dialog?.querySelector('.doc-drawer__header-text')
      if (!dialog || !ready) {
        if (tries++ < 60) frame = requestAnimationFrame(apply)
        return
      }
      furnish(dialog)
    }

    const furnish = (dialog: HTMLElement) => {
      /* NAMED BY ITS OWN HEADING. `aria-label` outranks `aria-labelledby`, so the
         slug has to go rather than be supplemented. */
      const heading = dialog.querySelector<HTMLElement>('.doc-drawer__header-text')
      if (heading) {
        const slug = dialog.getAttribute('aria-label')
        if (!heading.id) heading.id = 'da-drawer-title'
        dialog.setAttribute('aria-labelledby', heading.id)
        dialog.removeAttribute('aria-label')
        undo.push(() => {
          dialog.removeAttribute('aria-labelledby')
          if (slug) dialog.setAttribute('aria-label', slug)
        })
      }

      /* The page behind, taken out of the tree for as long as the sheet is up. */
      const page = document.querySelector<HTMLElement>('.template-default__wrap')
      if (page) {
        page.inert = true
        undo.push(() => {
          page.inert = false
        })
      }

      /* A 1630×1299 invisible button announced as "Close" was the first stop in
         the tab cycle. It stays clickable — that is the backdrop — and stops
         being something to tab through. */
      const backdrop = dialog.querySelector<HTMLElement>('.drawer__close')
      if (backdrop) {
        backdrop.setAttribute('tabindex', '-1')
        undo.push(() => backdrop.removeAttribute('tabindex'))
      }

      /* One id, two buttons: whichever Payload wrote second was unreachable by
         the label pointing at it. */
      const save = dialog.querySelector<HTMLElement>('#action-save')
      if (save) {
        save.id = 'da-action-save'
        undo.push(() => {
          save.id = 'action-save'
        })
      }

      /* The help under a field is the one place this admin explains itself.
         `aria-describedby` is what makes it audible. */
      for (const field of dialog.querySelectorAll<HTMLElement>('.field-type')) {
        const control = field.querySelector<HTMLElement>('input, textarea')
        const note = field.querySelector<HTMLElement>('.field-description')
        if (!control || !note || control.getAttribute('aria-describedby')) continue
        if (!note.id) note.id = `da-note-${control.id || Math.random().toString(36).slice(2)}`
        control.setAttribute('aria-describedby', note.id)
        undo.push(() => control.removeAttribute('aria-describedby'))
      }

      /* INTO THE FIELD THE SHEET EXISTS FOR. Not the close button: nine times in
         ten this drawer is open because a description is missing, and the caret
         belongs where the answer goes. */
      const target =
        dialog.querySelector<HTMLElement>('#field-alt') ??
        dialog.querySelector<HTMLElement>('input, textarea, button')
      target?.focus({ preventScroll: true })
    }

    /* ESCAPE, WHICH IS WHAT PEOPLE PRESS. A `<dialog open>` is not modal, so
       the browser's own cancel never fires. Bubble phase on purpose: when the
       form is dirty, DetailCloseGuard's capture listener stops propagation and
       asks first, and this never runs. Registered straight away rather than
       inside `furnish`, so the sheet answers Escape from the frame it opens. */
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      if (document.querySelector('.payload__modal-item[class*="--slug-confirm"]')) return
      closeDrawer()
    }
    document.addEventListener('keydown', onKey)
    undo.push(() => document.removeEventListener('keydown', onKey))

    apply()

    return () => {
      cancelAnimationFrame(frame)
      for (const step of undo) step()
    }
  }, [closeDrawer, open])
}

function DetailEditor({ detail }: { detail: Detail }) {
  const router = useRouter()
  const [DocumentDrawer, , { openDrawer, closeDrawer, isDrawerOpen }] = useDocumentDrawer(detail)
  const wasOpen = React.useRef(false)

  React.useEffect(() => {
    openDrawer()
    return closeDrawer
  }, [detail.request, openDrawer, closeDrawer])

  useDialogContract(isDrawerOpen, closeDrawer)

  React.useEffect(() => {
    if (wasOpen.current && !isDrawerOpen && detail.opener.isConnected) {
      detail.opener.focus({ preventScroll: true })
    }
    wasOpen.current = isDrawerOpen
  }, [isDrawerOpen, detail.opener])

  return (
    <DocumentDrawer
      onDelete={() => router.refresh()}
      onSave={() => router.refresh()}
      redirectAfterDelete={false}
    />
  )
}

/** Keep Payload's actual document form and the list's current query in place.
 * Delegation also covers first-column links after editors reorder columns.
 * Relationship pickers retain their own select/edit behavior.
 */
export function DetailModals({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const [detail, setDetail] = React.useState<Detail | null>(null)

  React.useEffect(() => {
    setDetail(null)
  }, [pathname])

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target instanceof Element ? event.target : null
      const link = target?.closest<HTMLAnchorElement>('a[href]')
      if (!link || link.download || (link.target && link.target !== '_self')) return
      if (!link.closest('.template-default__wrap .collection-list') || link.closest('.payload__modal-item')) return

      const url = new URL(link.href, window.location.origin)
      if (url.origin !== window.location.origin) return
      const match = url.pathname.match(/^\/admin\/collections\/(media)\/([^/]+)\/?$/)
      if (!match || match[2] === 'create') return
      const id = Number(match[2])
      if (!Number.isSafeInteger(id) || id <= 0) return

      event.preventDefault()
      event.stopPropagation()
      setDetail((previous) => ({
        collectionSlug: 'media',
        id,
        opener: link,
        request: (previous?.request ?? 0) + 1,
      }))
    }

    // Delegate from document because Payload replaces the list wrapper during
    // client-side navigation. The list-scope guard above still limits this to
    // collection rows, while capture runs before Next's delegated link handler.
    document.addEventListener('click', onClick as EventListener, true)
    return () => document.removeEventListener('click', onClick as EventListener, true)
  }, [pathname])

  return (
    <>
      {children}
      {detail ? <DetailEditor detail={detail} key={`${detail.collectionSlug}/${detail.id}`} /> : null}
    </>
  )
}

/**
 * One question, however you leave.
 *
 * Payload guards page navigation, but a drawer's own exits bypass it — and this
 * guard matched only `close-drawer__<slug>`, which is the BACKDROP. The visible
 * ✕ carries no id, so it fell through to Payload's own dialog: "Leave without
 * saving / Stay on this page / Leave anyway" for the ✕, "Discard unsaved
 * changes? / Keep editing / Discard changes" for Escape and the backdrop. Two
 * vocabularies for one decision, one keystroke apart — and in a sheet, "stay on
 * this page" describes something that was never happening.
 */
export function DetailCloseGuard() {
  const modified = useFormModified()
  const { drawerSlug } = useDocumentDrawerContext()
  const { closeModal, modalState, openModal } = useModal()
  const confirmationSlug = `${drawerSlug}-discard`

  React.useEffect(() => {
    if (!drawerSlug || !modified) return
    const latest = Object.values(modalState)
      .filter((modal) => modal.isOpen)
      .sort((a, b) => (b.openedOn ?? 0) - (a.openedOn ?? 0))[0]?.slug
    if (latest !== drawerSlug) return

    const ask = (event: Event) => {
      event.preventDefault()
      event.stopImmediatePropagation()
      openModal(confirmationSlug)
    }
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const button = target?.closest('button')
      if (!button) return
      /* Both ways out by pointer: the backdrop, which Payload gives an id, and
         the ✕ in the corner, which it does not. */
      if (button.id === `close-drawer__${drawerSlug}` || button.closest('.doc-drawer__header-close')) {
        ask(event)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') ask(event)
    }
    document.addEventListener('click', onClick, true)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [confirmationSlug, drawerSlug, modalState, modified, openModal])

  if (!drawerSlug) return null
  return (
    <ConfirmationModal
      body="Your changes haven’t been saved. Close without saving them?"
      cancelLabel="Keep editing"
      confirmLabel="Discard changes"
      heading="Discard unsaved changes?"
      modalSlug={confirmationSlug}
      onConfirm={() => {
        closeModal(confirmationSlug)
        closeModal(drawerSlug)
      }}
    />
  )
}
