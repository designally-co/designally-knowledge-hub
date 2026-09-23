'use client'

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { X } from 'lucide-react'

import { MOTION, duration } from './motion'
import './ConfirmDialog.css'

/**
 * The admin's dialog — Content Studio's ConfirmDialog, and the shell under it.
 *
 * It takes the screen: focus moves into it, Escape and the overlay close it,
 * and in a confirmation the destructive button is somewhere the pointer has to
 * travel to. A confirmation that appears where the pointer already is confirms
 * nothing.
 *
 * THE STUDIO'S MOTION: a centred 28rem box with no edge to have come from, so
 * it resolves in place — a fade and a small scale over a fading overlay — and
 * stays mounted until it has finished leaving. The studio's is Radix's dialog
 * driven by its motion hook; this admin has no Radix, so the dialog's duties
 * are done here: focus in and held, Escape, the overlay, the page held still.
 */

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

const focusables = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]

/**
 * The shell: a dialog that takes the screen, and whatever is put inside it.
 *
 * EXTRACTED, NOT WRITTEN TWICE. Everything below the markup — the portal, the
 * overlay, focus in and held, Escape, the page held still, the motion that the
 * unmount rides — is what makes a dialog a dialog rather than a box with a
 * shadow, and it was all inside `ConfirmDialog` because a confirmation was the
 * only thing that needed it. The user list's API sheet is the second, so the
 * duties move out and the confirmation becomes the first caller of them.
 */
export function Dialog({
  aside,
  children,
  describedBy,
  onClose,
  open,
  title,
}: {
  /**
   * What stands opposite the title in place of the close disc. A dialog that
   * ends in its own Cancel does not need a second way to say it in the corner,
   * and the corner is the one spot on the sheet the eye goes to after the
   * title. Escape and the overlay still close it either way. `null` leaves the
   * corner empty, so the title can have the whole line.
   */
  aside?: React.ReactNode
  children: React.ReactNode
  /** The id of the element inside that says what this is about, if any. */
  describedBy?: string
  onClose: () => void
  open: boolean
  title: string
}) {
  const onCancel = onClose
  const [mounted, setMounted] = useState(open)
  // Adjusted during render — React's answer for state derived from other state.
  if (open && !mounted) setMounted(true)

  /* Callback refs into state, as the studio's hook holds them: the portal
     mounts on a later commit than this component's, and an effect keyed on
     mounting would otherwise run while the nodes are still null. */
  const [panel, setPanel] = useState<HTMLDivElement | null>(null)
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    if (open) returnTo.current = document.activeElement as HTMLElement | null
  }, [open])

  useIsomorphicLayoutEffect(() => {
    if (!mounted || !panel) return
    gsap.set(overlay, { autoAlpha: 0 })
    gsap.set(panel, { autoAlpha: 0, scale: 0.96 })
  }, [mounted, panel, overlay])

  useEffect(() => {
    if (!mounted || !panel) return
    const timeline = gsap.timeline()

    if (open) {
      const seconds = duration(MOTION.ENTER)
      timeline.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: seconds, ease: MOTION.EASE_ENTER }, 0)
      timeline.fromTo(
        panel,
        { autoAlpha: 0, scale: 0.96 },
        { autoAlpha: 1, scale: 1, duration: seconds, ease: MOTION.EASE_ENTER },
        0,
      )
      /* Focus on the first frame the panel is visible, not before: at `autoAlpha:
         0` it is `visibility: hidden`, and the browser ignores focus on a
         hidden element. */
      timeline.call(() => focusables(panel)[0]?.focus(), undefined, Math.min(seconds, 0.02))
    } else {
      const seconds = duration(MOTION.EXIT)
      timeline.to(overlay, { autoAlpha: 0, duration: seconds, ease: MOTION.EASE_EXIT }, 0)
      timeline.to(panel, { autoAlpha: 0, scale: 0.96, duration: seconds, ease: MOTION.EASE_EXIT }, 0)
      // The unmount rides the tween, so the markup goes exactly when the panel
      // has finished leaving; a zero duration under reduced motion still fires it.
      timeline.eventCallback('onComplete', () => {
        setMounted(false)
        if (returnTo.current?.isConnected) returnTo.current.focus()
      })
    }

    return () => {
      timeline.kill()
    }
  }, [open, mounted, panel, overlay])

  /*
   * THE PAGE HELD STILL — ON ITS OWN EFFECT, and that is the point of it.
   *
   * This was one effect with the key handler, which lists `onCancel` among its
   * dependencies because it calls it; `onCancel` is a new closure on every
   * render of the caller, so the effect tore down and set up again on each one.
   * Every setup read `document.body.style.overflow` afresh to remember what to
   * put back — and by the second render that reading was `hidden`, its own
   * doing. Closing then restored `hidden`, and the page behind could not be
   * scrolled again until it was reloaded. Found with two of these open at once,
   * where the re-renders are frequent enough to be certain of hitting it.
   *
   * Keyed on `open` alone, it locks once and restores what was actually there.
   */
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  /*
   * ESCAPE, AND THE LISTENER THAT HEARS IT, REGISTERED ONCE PER OPENING.
   *
   * It was keyed on `onCancel` too, and callers pass a fresh closure on every
   * render — so every render tore the listener down and put a new one up. That
   * is harmless until a render happens DURING the keypress: the nav has its own
   * Escape listener (it closes the drawer), and the state it sets re-rendered
   * the account sheet's owner synchronously, mid-dispatch. The DOM's rule is
   * that a listener removed during dispatch is not called and one added during
   * dispatch waits for the next event — so Escape removed the handler that was
   * about to close the sheet, added its replacement too late, and the sheet
   * stayed open. Logged: `-onKey`, `+onKey`, and no close.
   *
   * The latest `onCancel` is read through a ref instead, so re-renders change
   * what it calls and never whether it is listening.
   */
  const cancelRef = useRef(onCancel)
  cancelRef.current = onCancel

  useEffect(() => {
    if (!open || !panel) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables(panel)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const inside = panel.contains(document.activeElement)
      if (event.shiftKey && (document.activeElement === first || !inside)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, panel])

  if (!mounted) return null

  return createPortal(
    <>
      <div aria-hidden="true" className="da-confirm__overlay" onClick={onCancel} ref={setOverlay} />
      {/* Centred by a grid frame, not a translate: GSAP animates the panel's
          transform, and would fold a CSS translate into it. */}
      <div className="da-confirm__frame">
        <div
          aria-describedby={describedBy}
          aria-labelledby={titleId}
          aria-modal="true"
          className="da-confirm"
          ref={setPanel}
          role="dialog"
        >
          <div className="da-confirm__head">
            <h2 className="da-confirm__title" id={titleId}>
              {title}
            </h2>
            {/* The sheet's close, the same disc as every close in the studio —
                unless the caller has something that belongs there instead. */}
            {aside === undefined ? (
              <button aria-label="Close" className="da-confirm__close" onClick={onCancel} type="button">
                <X aria-hidden="true" size={20} />
              </button>
            ) : (
              aside
            )}
          </div>

          {children}
        </div>
      </div>
    </>,
    document.body,
  )
}

/**
 * An irreversible thing, asked properly — the shell above with the one shape
 * that question takes.
 *
 * THE BODY NAMES THE CONSEQUENCE, not the action. "Are you sure" asks the
 * reader to supply the stakes themselves, so each caller passes the one thing
 * worth knowing — what survives this and what does not.
 */
export function ConfirmDialog({
  confirmLabel = 'Delete',
  description,
  onCancel,
  onConfirm,
  open,
  title,
}: {
  /* Named for the act, not for the dialog. "Confirm" makes the reader look back
     up at the title to find out what they are confirming. */
  confirmLabel?: string
  description: React.ReactNode
  onCancel: () => void
  onConfirm: () => void
  open: boolean
  title: string
}) {
  const descriptionId = useId()

  return (
    <Dialog describedBy={descriptionId} onClose={onCancel} open={open} title={title}>
      <p className="da-confirm__description" id={descriptionId}>
        {description}
      </p>

      <div className="da-confirm__actions">
        <button className="da-confirm__button da-confirm__button--outline" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="da-confirm__button da-confirm__button--destructive" onClick={onConfirm} type="button">
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}
