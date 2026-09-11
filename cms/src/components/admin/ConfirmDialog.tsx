'use client'

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { X } from 'lucide-react'

import { MOTION, duration } from './motion'
import './ConfirmDialog.css'

/**
 * An irreversible thing, asked properly — Content Studio's ConfirmDialog.
 *
 * It takes the screen: focus moves into it, Escape and the overlay cancel,
 * and the destructive button is somewhere the pointer has to travel to. A
 * confirmation that appears where the pointer already is confirms nothing.
 *
 * THE BODY NAMES THE CONSEQUENCE, not the action. "Are you sure" asks the
 * reader to supply the stakes themselves, so each caller passes the one thing
 * worth knowing — what survives this and what does not.
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
  const descriptionId = useId()

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

  useEffect(() => {
    if (!open || !panel) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
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
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open, panel, onCancel])

  if (!mounted) return null

  return createPortal(
    <>
      <div aria-hidden="true" className="da-confirm__overlay" onClick={onCancel} ref={setOverlay} />
      {/* Centred by a grid frame, not a translate: GSAP animates the panel's
          transform, and would fold a CSS translate into it. */}
      <div className="da-confirm__frame">
        <div
          aria-describedby={descriptionId}
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
            {/* The sheet's close, the same disc as every close in the studio. */}
            <button aria-label="Close" className="da-confirm__close" onClick={onCancel} type="button">
              <X aria-hidden="true" size={20} />
            </button>
          </div>

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
        </div>
      </div>
    </>,
    document.body,
  )
}
