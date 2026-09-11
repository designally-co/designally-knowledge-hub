/**
 * The admin's motion, in one place — Content Studio's module, unchanged, so the
 * rail and its drawer move at the studio's speeds.
 *
 * A surface that arrives takes longer than one that leaves: arriving is
 * information — you are watching where a thing came from, which is what tells
 * you where it will go back to — and leaving is an acknowledgement, where every
 * extra frame is the interface making you wait to be finished with it.
 *
 * The eases are asymmetric for the same reason. Entering decelerates into place
 * (`power3.out`); leaving accelerates away (`power2.in`), because a panel that
 * eases gently out of existence looks dragged off rather than dismissed.
 */
export const MOTION = {
  /** A surface arriving: the drawer opening. */
  ENTER: 0.42,
  /** The same surface leaving. */
  EXIT: 0.26,
  /** Content settling inside a surface that has already arrived. */
  CONTENT: 0.3,
  /** Between items in a list that arrives together. */
  STAGGER: 0.035,
  EASE_ENTER: 'power3.out',
  EASE_EXIT: 'power2.in',
} as const

/**
 * Whether this reader has asked the system for less movement — read at the
 * moment of animating, because it is a system toggle that can change while the
 * admin is open.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * A duration, or none at all. Reduced motion means no travel, not a faster
 * travel — and zero keeps every tween's `onComplete`, so the drawer still
 * unmounts through the same code path.
 */
export function duration(seconds: number): number {
  return prefersReducedMotion() ? 0 : seconds
}
