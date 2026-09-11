'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Link, useAuth, useNav } from '@payloadcms/ui'
import gsap from 'gsap'
import {
  Download,
  FileText,
  Image as ImageIcon,
  Mail,
  PanelLeftClose,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'

import { AccountMenu } from './AccountMenu'
import { ConfirmDialog } from './ConfirmDialog'
import { MOTION, duration } from './motion'
import './SideNav.css'

/**
 * The admin's navigation — Content Studio's side nav, ported whole: the rail,
 * its fold, the drawer and its motion, with the Hub's destinations in it.
 *
 * IT REPLACES PAYLOAD'S NAV rather than restyling it (`admin.components.Nav`).
 * Payload's is a set of groups under headings with the rows it chooses; the
 * studio's is one list of places you work, a brand row that folds the rail, and
 * the account on the floor. Drawing one to look like the other was a stylesheet
 * at war with markup it did not own.
 *
 * ONE STATE IS PAYLOAD'S: whether the drawer is open. The band's hamburger is
 * Payload's own toggler and it sets `navOpen`, so the drawer reads that rather
 * than keeping a second copy — two owners of one fact is how a menu ends up
 * open on a screen that has no button to close it.
 */

/* Five destinations, in the order payload.config lists the collections. */
const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin/collections/articles', label: 'Articles', icon: FileText },
  // What a resource is, is the download.
  { href: '/admin/collections/resources', label: 'Resources', icon: Download },
  { href: '/admin/collections/media', label: 'Media', icon: ImageIcon },
  { href: '/admin/collections/subscribers', label: 'Subscribers', icon: Mail },
  { href: '/admin/collections/users', label: 'Users', icon: Users },
]

/** Remembered per browser: a folded rail is a preference about this screen. */
const COLLAPSED_KEY = 'da:nav-collapsed'
/** Below this the rail is gone and the drawer is the nav. */
const DRAWER_QUERY = '(max-width: 1024px)'

/* `useLayoutEffect` on the client, `useEffect` on the server — React warns
   about the former during SSR, and the drawer's opening position has to be set
   BEFORE the browser paints or the panel flashes at x=0 for a frame on its way
   to sliding in from off-screen. */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function SideNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { navOpen, setNavOpen } = useNav()
  const email = (user?.email as string | undefined) || ''

  /* Payload keeps `navOpen` on a desk too, where it means its own sidebar is
     out. There is no drawer at that width, so it only counts below it. */
  const [drawerWidth, setDrawerWidth] = useState(false)
  useEffect(() => {
    const query = window.matchMedia(DRAWER_QUERY)
    const sync = () => setDrawerWidth(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  const open = navOpen && drawerWidth
  const setOpen = (next: boolean) => setNavOpen(next)

  /* PRESENCE, SEPARATE FROM INTENT. `open` is what the reader asked for;
     `mounted` is whether the panel is still in the tree. Closing has to keep
     the markup alive until the panel has finished leaving, or there is nothing
     left to watch leave. */
  const [mounted, setMounted] = useState(false)
  if (open && !mounted) setMounted(true)
  const panelRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  /* Off-screen before the first paint, so the slide starts from outside the
     display rather than appearing in place and then jumping left. */
  useIsomorphicLayoutEffect(() => {
    if (!mounted || !panelRef.current) return
    gsap.set(panelRef.current, { xPercent: -100 })
  }, [mounted])

  /* IN FROM THE LEFT, OUT THE WAY IT CAME. The rows follow the panel rather
     than arriving with it, and overlap it by just over half, so the eye reads
     one movement with a grain to it. Only on the way in: leaving, the panel
     takes its contents with it as one object. */
  useEffect(() => {
    if (!mounted || !panelRef.current) return
    const panel = panelRef.current
    const rows = panel.querySelectorAll('[data-stagger]')
    const timeline = gsap.timeline()

    if (open) {
      timeline.to(panel, {
        xPercent: 0,
        duration: duration(MOTION.ENTER),
        ease: MOTION.EASE_ENTER,
      })
      timeline.fromTo(
        rows,
        { x: -14, autoAlpha: 0 },
        {
          x: 0,
          autoAlpha: 1,
          duration: duration(MOTION.CONTENT),
          ease: MOTION.EASE_ENTER,
          stagger: duration(MOTION.STAGGER),
        },
        `-=${duration(MOTION.ENTER) * 0.55}`,
      )
      /* FOCUS WHEN THE ROWS ARE THERE TO TAKE IT. The close button sits in the
         first staggered row, and `fromTo` hides that row the moment the
         timeline is built — so focusing it from an effect was a call on an
         invisible element, which the browser ignores: measured, focus stayed on
         the hamburger behind the drawer. */
      timeline.eventCallback('onComplete', () => closeButtonRef.current?.focus())
    } else {
      timeline.to(panel, {
        xPercent: -100,
        duration: duration(MOTION.EXIT),
        ease: MOTION.EASE_EXIT,
        // The unmount rides on the tween, so the markup goes exactly when the
        // panel has finished leaving.
        onComplete: () => setMounted(false),
      })
    }

    return () => {
      timeline.kill()
    }
  }, [open, mounted])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false)
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open, setNavOpen])

  /* THE FOLD. A class on `<body>`, not only state here: the grid column the
     rail sits in, and the selection bar centred on the page beside it, are
     outside this component — and the class outlives it. Payload re-mounts the
     nav on every navigation, so what is drawn folded is decided by the class,
     which is already right on the first frame; this state only names the
     buttons. */
  const [collapsed, setCollapsed] = useState(false)
  useIsomorphicLayoutEffect(() => {
    let saved = false
    try {
      saved = window.localStorage.getItem(COLLAPSED_KEY) === '1'
    } catch {
      // Private modes refuse storage; the rail opens expanded.
    }
    setCollapsed(saved)
    document.body.classList.toggle('da-nav-collapsed', saved)
    /* The width transition is switched on only now, so a page that loads
       folded does not animate folding. */
    const frame = requestAnimationFrame(() => document.body.classList.add('da-rail-ready'))
    return () => cancelAnimationFrame(frame)
  }, [])

  const fold = (next: boolean) => {
    setCollapsed(next)
    document.body.classList.toggle('da-nav-collapsed', next)
    try {
      window.localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0')
    } catch {
      // The class still applies for this session.
    }
  }

  /* Held here rather than in the menu, so the dialog outlives the menu that
     opened it — a menu closes on select. */
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const signOut = () => setConfirmingSignOut(true)

  return (
    <>
      {mounted && (
        <div className="da-drawer">
          <aside
            aria-label="Mobile navigation"
            aria-modal="true"
            className="da-drawer__panel"
            id="mobile-navigation"
            ref={panelRef}
            role="dialog"
          >
            <div className="da-drawer__head" data-stagger>
              <Lockup />
              <button
                aria-label="Close navigation"
                className="da-drawer__close"
                onClick={() => setOpen(false)}
                ref={closeButtonRef}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} pathname={pathname} />
            <div className="da-drawer__foot" data-stagger>
              <AccountMenu email={email} onNavigate={() => setOpen(false)} onSignOut={signOut} />
            </div>
          </aside>
        </div>
      )}

      <aside className="da-rail">
        <div className="da-rail__inner">
          {/* The brandmark holds one position across both states — only the
              words beside it come and go, so folding reads as the panel
              narrowing rather than as the logo jumping. */}
          <div className="da-rail__brand">
            {/* THE LOGO IS THE WAY BACK. Folded, the mark is the only thing in
                the rail that does nothing, and pressing it is what people try
                first. Drawn only while folded — see SideNav.css. */}
            <button
              aria-expanded={false}
              aria-label="Expand sidebar"
              className="da-rail__expand"
              onClick={() => fold(false)}
              title="Expand sidebar"
              type="button"
            >
              <FlatMark decorative />
            </button>
            <Lockup />
            {/* INSIDE THE RAIL, ON THE BRAND'S OWN LINE — a control in a panel,
                like every other control in the panel. Transparent at rest; it
                fills on hover. */}
            <button
              aria-expanded
              aria-label="Collapse sidebar"
              className="da-rail__collapse"
              onClick={() => fold(true)}
              title="Collapse sidebar"
              type="button"
            >
              <PanelLeftClose aria-hidden="true" size={16} />
            </button>
          </div>
          <div aria-hidden="true" className="da-rail__rule" />

          <NavLinks collapsed={collapsed} pathname={pathname} />

          {/* NavLinks takes the slack, so this sits on the floor of the rail
              whatever the list above it holds. */}
          <div className="da-rail__foot">
            <AccountMenu email={email} onSignOut={signOut} />
          </div>
        </div>
      </aside>

      {/* Mounted outside both panels: the dialog belongs to the admin, not to
          the rail or the drawer that happened to open it. */}
      {/* Sign out asks first, as the studio's does. The studio's says "Your work
          is saved" because there it is; here a document can hold edits nobody
          has saved yet, and signing out drops them — so that is what it says.
          It goes through `/admin/logout`, Payload's own route. */}
      <ConfirmDialog
        confirmLabel="Sign out"
        description="Anything you haven't saved will be lost."
        onCancel={() => setConfirmingSignOut(false)}
        onConfirm={() => {
          setConfirmingSignOut(false)
          router.push('/admin/logout')
        }}
        open={confirmingSignOut}
        title="Sign out?"
      />
    </>
  )
}

/** The mark, "Designally" over the product's name — the rail's and the drawer's. */
function Lockup() {
  return (
    <div className="da-lockup">
      <FlatMark />
      <div className="da-lockup__text">
        <p className="da-lockup__eyebrow">Designally</p>
        <p className="da-lockup__name">Knowledge Hub</p>
      </div>
    </div>
  )
}

/**
 * The mark with no disc under it — the D in ink, the full stop in the accent.
 * `designally-mark.png` is a white D. on transparency, so it cannot simply be
 * recoloured — but it splits: the D runs to 73.79% of the width and the stop
 * begins there. Two layers masked by the same file and clipped either side of
 * that seam give each its own colour, and the drawing stays the drawing.
 */
function FlatMark({ decorative = false }: { decorative?: boolean }) {
  return (
    <span
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : 'Designally'}
      className="da-mark"
      role={decorative ? undefined : 'img'}
    >
      <i className="da-mark__d" />
      <i className="da-mark__dot" />
    </span>
  )
}

function NavLinks({
  collapsed = false,
  onNavigate,
  pathname,
}: {
  collapsed?: boolean
  onNavigate?: () => void
  pathname: string
}) {
  return (
    <nav aria-label="Primary navigation" className="da-navlinks">
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className="da-navlink"
            /* Part of the drawer's opening stagger. Inert on the rail, which
               never animates — the attribute is only queried from inside the
               drawer's own panel. */
            data-stagger
            href={href}
            key={href}
            onClick={onNavigate}
            prefetch={false}
            title={collapsed ? label : undefined}
          >
            {/* 1.75 on the 24 grid lands at ~1.46px at 20, level with a 500
                label — the studio's rail weight. */}
            <Icon aria-hidden="true" size={20} strokeWidth={1.75} />
            <span className="da-navlink__label">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
