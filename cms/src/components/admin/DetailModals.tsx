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

function DetailEditor({ detail }: { detail: Detail }) {
  const router = useRouter()
  const [DocumentDrawer, , { openDrawer, closeDrawer, isDrawerOpen }] = useDocumentDrawer(detail)
  const wasOpen = React.useRef(false)

  React.useEffect(() => {
    openDrawer()
    return closeDrawer
  }, [detail.request, openDrawer, closeDrawer])

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

/** Payload guards page navigation, but its drawer close buttons and Escape
 * bypass that guard. Keep edits until the editor explicitly discards them.
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
      if (button?.id === `close-drawer__${drawerSlug}`) ask(event)
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
