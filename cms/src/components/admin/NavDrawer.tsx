'use client'

import React from 'react'

/**
 * The behaviour a drawer is supposed to have.
 *
 * The shell slides the nav in from under the band on a phone, and that was the
 * whole of it: tapping the page did nothing, Escape did nothing, focus stayed
 * on the page behind the drawer — so a keyboard tabbed straight into content it
 * could not see — and the list underneath scrolled while you were in the menu.
 * Four things missing, all of them the same thing: a drawer is a layer over the
 * page, and the page has to behave like it is underneath.
 *
 * IT DRIVES PAYLOAD'S TOGGLER RATHER THAN THE CLASS. The open state is
 * `template-default--nav-open`, which Payload's own button sets through its
 * provider; setting the class from here would put two owners on one piece of
 * state. Everything below either reads that class or clicks that button.
 *
 * THE WASH IS A REAL ELEMENT because a `::before` cannot be tapped, and tapping
 * the page to dismiss is the first gesture anyone tries. It is a `button` with a
 * name, so it is also the only thing here that a screen reader can act on.
 */

const OPEN = 'template-default--nav-open'
const PHONE = '(max-width: 48rem)'

const focusables = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(
    (el) => el.offsetParent !== null,
  )

export function NavDrawer({ children }: { children?: React.ReactNode }) {
  React.useEffect(() => {
    const template = () => document.querySelector('.template-default')
    const nav = () => document.querySelector<HTMLElement>('.nav')
    const toggler = () =>
      document.querySelector<HTMLElement>('.app-header__mobile-nav-toggler') ??
      document.querySelector<HTMLElement>('.template-default__nav-toggler')

    const phone = window.matchMedia(PHONE)
    const isOpen = () => Boolean(template()?.classList.contains(OPEN)) && phone.matches

    const scrim = document.createElement('button')
    scrim.type = 'button'
    scrim.className = 'da-navscrim'
    scrim.setAttribute('aria-label', 'Close menu')
    scrim.hidden = true
    scrim.addEventListener('click', () => toggler()?.click())
    /* INSIDE THE SHELL, NOT ON THE BODY — see `ensure` below, which puts it
       there and keeps it there. `.template-default` carries `isolation:
       isolate`, so it is its own stacking context and the nav's z-index only
       means anything within it: a wash appended to `<body>` sat above the whole
       shell however low its z-index was, and the drawer opened underneath its
       own dimming. Measured — `elementFromPoint` over a nav link returned the
       scrim. */

    /* Where focus was before the drawer took it, so it can be handed back to the
       control that opened it rather than dropped on the body. */
    let returnTo: HTMLElement | null = null
    let was = false

    const sync = () => {
      const open = isOpen()
      if (open === was) return
      was = open

      scrim.hidden = !open
      document.body.classList.toggle('da-nav-open', open)

      if (open) {
        returnTo = document.activeElement as HTMLElement | null
        /* The first thing in the drawer, not the drawer itself: landing on a
           container announces nothing and takes a second Tab to get anywhere. */
        focusables(nav() ?? document)[0]?.focus()
      } else {
        returnTo?.focus()
        returnTo = null
      }
    }

    const onKey = (event: KeyboardEvent) => {
      if (!isOpen()) return

      if (event.key === 'Escape') {
        event.preventDefault()
        toggler()?.click()
        return
      }

      if (event.key !== 'Tab') return

      /* THE RING INCLUDES THE TOGGLER. It is in the band, outside the drawer,
         and it is the control that closes it — trapping focus strictly inside
         the panel would leave the keyboard with Escape as its only way out. */
      const ring = [...focusables(nav() ?? document), toggler()].filter(Boolean) as HTMLElement[]
      if (!ring.length) return

      const first = ring[0]
      const last = ring[ring.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !ring.includes(active as HTMLElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    /* A route change closes it: tapping a link in the drawer is a navigation,
       and a menu still standing over the page you asked for is a menu you have
       to dismiss twice. Payload's own toggler does not know about routing. */
    const onNavClick = (event: MouseEvent) => {
      if (!isOpen()) return
      const link = (event.target as Element | null)?.closest?.('.nav a[href]')
      if (link) toggler()?.click()
    }

    /*
     * AND IT SURVIVES A ROUTE CHANGE. Payload replaces the shell on a
     * client-side navigation, which takes the wash with it — appended to the old
     * element — and leaves the class observer watching a node no longer in the
     * document. Measured: open the drawer, tap a link, and the next screen has
     * no wash and no lock.
     *
     * So the shell is re-found rather than remembered. `ensure` is cheap — two
     * identity checks and an early return — and runs on the same body observer
     * the rest of this admin's corrections use.
     */
    const classWatch = new MutationObserver(sync)
    let watching: Element | null = null

    const ensure = () => {
      const root = template()
      if (!root) return
      if (scrim.parentElement !== root) root.appendChild(scrim)
      if (watching !== root) {
        classWatch.disconnect()
        classWatch.observe(root, { attributeFilter: ['class'], attributes: true })
        watching = root
      }
      sync()
    }

    const shellWatch = new MutationObserver(ensure)
    shellWatch.observe(document.body, { childList: true, subtree: true })

    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onNavClick, true)
    phone.addEventListener('change', sync)
    ensure()

    return () => {
      classWatch.disconnect()
      shellWatch.disconnect()
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onNavClick, true)
      phone.removeEventListener('change', sync)
      document.body.classList.remove('da-nav-open')
      scrim.remove()
    }
  }, [])

  return <>{children}</>
}
