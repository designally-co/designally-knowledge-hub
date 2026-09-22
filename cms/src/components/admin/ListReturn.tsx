'use client'

import React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/**
 * Going back to the list you were actually looking at.
 *
 * PAYLOAD REMEMBERS ALMOST EVERYTHING ABOUT A LIST EXCEPT WHERE YOU WERE.
 * `CollectionPreferences` persists `columns`, `sort`, `limit`, `groupBy` and
 * `preset` per user — but not `page`, and there is no setting that adds it. So
 * the breadcrumb goes to a bare `/admin/collections/articles`, and returning
 * from the ninth article on page three lands on page one with the filter gone.
 * On a library meant to grow, that is the whole cost of checking one article.
 *
 * SESSION STORAGE, NOT THE URL. The alternative is threading the list's query
 * onto every row link, which means overriding the cell that renders them and
 * owning Payload's row-link behaviour forever. Recording the query when the
 * list renders and reading it back on the document is smaller, and it survives
 * the routes that do not come from a row click at all — the breadcrumb, a
 * pasted URL, the redirect after a duplicate.
 *
 * PER COLLECTION, because Articles and Resources are different queues and
 * returning from one should never land you in the other's filter.
 *
 * IT IS THE BREADCRUMB THAT CARRIES THIS, NOT A CONTROL OF ITS OWN. There was a
 * back chevron in the document header doing it, which put two ways back on the
 * same screen — "Articles" at the top left and a chevron at the top right, the
 * less obvious one being the one that worked properly. The crumb was already
 * the obvious way back, so it is the crumb that got fixed.
 *
 * IT IS A CONVENIENCE, AND IT FAILS QUIETLY. Session storage is unavailable in
 * some privacy modes and empty on a fresh tab; every read and write is guarded,
 * and with nothing recorded the crumb does exactly what it always did.
 */

const key = (slug: string) => `da:list:${slug}`

/** What the writing surface's Cancel asked, now asked by every way out. */
const LEAVING = 'Leave without saving? This edit will be lost.'

/** `/admin/collections/<slug>` and `/admin/collections/<slug>/<id>` both. */
function collectionFrom(pathname: null | string): null | string {
  const match = /^\/admin\/collections\/([^/]+)/.exec(pathname || '')
  return match ? match[1] : null
}

/**
 * Renders nothing. Sits above the list table and records the query string —
 * page, filters, sort — every time it changes.
 */
export function RememberList() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /* Depends on the SERIALISED params, not the object: Next hands back a new
     instance on every render, so depending on it directly would write on every
     render rather than on every change. */
  const query = searchParams.toString()

  React.useEffect(() => {
    const slug = collectionFrom(pathname)
    if (!slug) return
    try {
      sessionStorage.setItem(key(slug), query ? `?${query}` : '')
    } catch {
      // Private modes refuse this. The back control falls back to the plain
      // list, which is no worse than the breadcrumb it sits beside.
    }
  }, [pathname, query])

  return null
}

/**
 * Sends the breadcrumb's collection crumb back to the page you left.
 *
 * Renders nothing. Mounted on the document view, it intercepts a click on the
 * crumb that points at this collection and routes to the recorded query
 * instead of the bare list.
 *
 * WHY AN INTERCEPTOR AND NOT A REWRITTEN `href`. The crumb is Payload's markup
 * and it is a Next `Link`, which navigates with the `href` it was given as a
 * PROP — rewriting the DOM attribute would change what the link looks like and
 * nothing about where it goes.
 *
 * The listener is on `document` in the CAPTURE phase, which is the one place
 * that runs before React: React attaches its own handlers at the app root and
 * sees the event on the way back up, so stopping it here means the Link's
 * handler never fires. `preventDefault` then covers the anchor's own
 * navigation, and the router does the rest — a client-side transition, the same
 * as clicking the crumb normally.
 */
export function ReturnToPlace() {
  const router = useRouter()
  const pathname = usePathname()
  const slug = collectionFrom(pathname)

  React.useEffect(() => {
    if (!slug) return

    const listPath = `/admin/collections/${slug}`

    const onClick = (event: MouseEvent) => {
      /* Modified clicks are the user asking for a new tab or window; those must
         keep the plain URL rather than being turned into a router push. */
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as HTMLElement | null
      const anchor = target?.closest?.('.step-nav a') as HTMLAnchorElement | null
      if (!anchor || anchor.pathname !== listPath) return

      let saved = ''
      try {
        saved = sessionStorage.getItem(key(slug)) || ''
      } catch {
        saved = ''
      }
      /* Nothing recorded means nothing to restore — let the crumb be a crumb. */
      if (!saved) return

      event.preventDefault()
      event.stopPropagation()
      router.push(`${listPath}${saved}`)
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [router, slug])

  return null
}

/**
 * The corner of a document goes back, not to the menu.
 *
 * A PHONE'S TOP-LEFT IS ONE BUTTON, AND ON A DOCUMENT IT IS THE WRONG ONE.
 * Payload puts its hamburger there on every screen, and on a document that is
 * the whole app's navigation offered to someone who is in the middle of one
 * article — while the only thing they actually want from that corner, the way
 * out, is a breadcrumb in 13px type beside it. Content Studio answers this the
 * same way: inside an article the corner's disc becomes a back chevron, because
 * a place you came into from somewhere is a place you leave the way you came.
 *
 * TO THE LIST, NOT THROUGH HISTORY. Studio's goes back through the stack; this
 * one cannot, because a Hub document has TABS — Overview and Edit are two
 * routes — so `history.back()` from the writing surface lands on the other tab
 * and the button that means "leave" would sometimes not leave. It goes to the
 * collection, restoring the page and filter `RememberList` recorded above, so
 * it does exactly what the crumb beside it does and always ends up outside the
 * document.
 *
 * A PROVIDER, SO EVERY COLLECTION HAS IT. It renders nothing anywhere else: the
 * pathname decides, which means a collection added later gets this without
 * anyone remembering to mount it. `da-doc` on the body is how SideNav.css takes
 * the hamburger off this screen — one owner for the corner at a time.
 *
 * IT ASKS WHEN THERE IS SOMETHING TO LOSE, which is the writing surface's
 * Cancel, inherited. That button stood beside Save saying how to leave without
 * saving, and it is gone now that the corner says it — but its guard is the
 * part that mattered: a way out that silently discards a paragraph is worse
 * than no way out. With a clean form there is nothing to confirm and it just
 * goes.
 *
 * THE FORM'S STATE IS READ OFF THE BAR rather than through a hook, because this
 * is mounted at the root of the admin, outside any form. `DocBar` renders the
 * "Unsaved changes" line exactly when the form is modified (DocActions), so its
 * presence in the page is the same fact, already published. `window.confirm` as
 * Cancel used: one line, impossible to miss, and nothing here owns a panel to
 * put a nicer one in.
 *
 * THE BUTTON ASKS; THE CRUMB BESIDE IT DOES NOT. The crumb briefly did — it is
 * the desk's way out, and Payload's own `LeaveWithoutSaving` never reaches this
 * admin because that guard is rendered by Payload's Edit view and every
 * document here replaces that view. It was taken out again: a confirmation on
 * the crumb is a dialog in the way of the most-used control in the header, and
 * the writing surface's Cancel already asks on the desk, which is the screen
 * with something to lose. So the question is on the one control that exists to
 * leave a document, and the crumb stays a link.
 */
export function BackToList({ children }: { children?: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  /* `/admin/collections/<slug>/<id>` and anything under it — the document's
     tabs, its versions. The bare list is not a document and keeps its menu. */
  const match = /^\/admin\/collections\/([^/]+)\/.+/.exec(pathname || '')
  const slug = match ? match[1] : null

  React.useEffect(() => {
    if (!slug) return
    document.body.classList.add('da-doc')
    return () => document.body.classList.remove('da-doc')
  }, [slug])

  if (!slug) return <>{children}</>

  const back = () => {
    if (document.querySelector('.da-bar__unsaved') && !window.confirm(LEAVING)) return

    let saved = ''
    try {
      saved = sessionStorage.getItem(key(slug)) || ''
    } catch {
      saved = ''
    }
    router.push(`/admin/collections/${slug}${saved}`)
  }

  return (
    <>
      <button aria-label="Back" className="da-back" onClick={back} type="button">
        <svg
          aria-hidden
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      {children}
    </>
  )
}
