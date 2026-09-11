'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { Link } from '@payloadcms/ui'
import { LogOut, UserRound } from 'lucide-react'

import './AccountMenu.css'

/**
 * Who you are, and everything that is about you rather than about the work —
 * Content Studio's account menu, with the Hub's contents.
 *
 * THE IDENTITY IS THE TRIGGER, so the address is on screen without a section to
 * hold it, and Sign out is one press from it rather than a page away. It sits
 * at the bottom because that is where an account belongs in a rail — far from
 * the destinations, last in the tab order, out of the way of the work.
 *
 * HAND-BUILT, NOT RADIX. The studio's is Radix's dropdown; this admin has no
 * Radix and one menu does not justify adding it. What Radix gives the studio's
 * is kept: it opens above the trigger and flips below when there is no room,
 * stays 12px off the viewport's edges, moves with the arrow keys, closes on
 * Escape, Tab or a press outside, and hands focus back to the trigger.
 *
 * Sign out only ASKS here — the confirmation lives in SideNav, outside the
 * menu, which closes on select and would unmount a dialog mounted inside it.
 */
export function AccountMenu({
  email,
  onNavigate,
  onSignOut,
}: {
  email: string
  /** Called when an item leaves for another page — the drawer closes on it. */
  onNavigate?: () => void
  onSignOut: () => void
}) {
  const menuId = React.useId()

  /* PRESENCE, SEPARATE FROM INTENT. `open` is what the reader asked for;
     `mounted` is whether the menu is still in the tree, which it has to be
     until it has finished leaving. Adjusted during render — React's answer for
     state derived from other state. */
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  if (open && !mounted) setMounted(true)

  const [position, setPosition] = React.useState<{ left: number; top: number } | null>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const close = React.useCallback((returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  /* Upwards, because the trigger is at the bottom of the screen; below when
     there is no room above. Measured before paint, so it never draws at the
     origin for a frame. */
  React.useLayoutEffect(() => {
    if (!mounted) return
    const place = () => {
      const trigger = triggerRef.current?.getBoundingClientRect()
      const menu = menuRef.current
      if (!trigger || !menu) return
      const edge = 12
      const gap = 8
      const left = Math.max(edge, Math.min(trigger.left, window.innerWidth - edge - menu.offsetWidth))
      let top = trigger.top - gap - menu.offsetHeight
      if (top < edge) top = Math.min(trigger.bottom + gap, window.innerHeight - edge - menu.offsetHeight)
      setPosition({ left, top })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [mounted])

  React.useEffect(() => {
    if (!open || !position) return
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [open, position])

  /* THE EXIT ANIMATION USUALLY UNMOUNTS IT, AND THIS MAKES SURE. `animationend`
     does not fire in a tab the browser has stopped painting, so a menu closed
     as the window lost focus stayed in the tree — invisible, but still holding
     its items. A little longer than the 260ms exit, so it never cuts one short. */
  React.useEffect(() => {
    if (open || !mounted) return
    const timer = window.setTimeout(() => {
      setMounted(false)
      setPosition(null)
    }, 320)
    return () => window.clearTimeout(timer)
  }, [open, mounted])

  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      close(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, close])

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
    const index = items.indexOf(document.activeElement as HTMLElement)

    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault()
      close(true)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      items[(index + 1) % items.length]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      items[(index - 1 + items.length) % items.length]?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      items[0]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      items[items.length - 1]?.focus()
    }
  }

  const menu = mounted ? (
    <div
      aria-label="Account"
      className="da-account__menu"
      data-state={open ? 'open' : 'closed'}
      id={menuId}
      onAnimationEnd={() => {
        if (!open) {
          setMounted(false)
          setPosition(null)
        }
      }}
      onKeyDown={onMenuKeyDown}
      ref={menuRef}
      role="menu"
      style={position ? { left: position.left, top: position.top } : { visibility: 'hidden' }}
    >
      <div className="da-account__label">
        <Initial email={email} />
        <span className="da-account__who">
          <span className="da-account__email">{email}</span>
          {/* Everyone who can sign in to this admin has all of it — there is no
              second role to tell apart. */}
          <span className="da-account__role">Administrator</span>
        </span>
      </div>

      <Rule />

      <Link
        className="da-account__item"
        href="/admin/account"
        onClick={() => {
          close(false)
          onNavigate?.()
        }}
        role="menuitem"
        tabIndex={-1}
      >
        <UserRound aria-hidden="true" size={18} />
        Account
      </Link>

      <Rule />

      {/* IT ASKS FIRST. It is the only item that ends something, and the last
          row of a menu is where the pointer lands on the way past. */}
      <button
        className="da-account__item da-account__item--danger"
        onClick={() => {
          close(false)
          onSignOut()
        }}
        role="menuitem"
        tabIndex={-1}
        type="button"
      >
        <LogOut aria-hidden="true" size={18} />
        Sign out
      </button>
    </div>
  ) : null

  return (
    <>
      <button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account and sign out"
        className="da-account__trigger"
        data-state={open ? 'open' : 'closed'}
        onClick={() => setOpen((was) => !was)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault()
            setOpen(true)
          }
        }}
        ref={triggerRef}
        title={email}
        type="button"
      >
        <Initial email={email} />
        {/* No chevron: the row says it opens something by lighting up under the
            pointer, and the address already has to truncate. */}
        <span className="da-account__trigger-email">{email}</span>
      </button>

      {/* On `<body>`: the rail is a clipped scroll container and the drawer a
          layer of its own, and a menu inside either would be cut off by it. */}
      {menu ? createPortal(menu, document.body) : null}
    </>
  )
}

function Rule() {
  return <div className="da-account__rule" role="separator" />
}

/**
 * The first letter of the address. Not a photo: there is no avatar to load, so
 * a coloured disc with a letter is the whole truth rather than a placeholder
 * standing in for something missing.
 */
function Initial({ email }: { email: string }) {
  return (
    <span aria-hidden="true" className="da-account__initial">
      {email.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
