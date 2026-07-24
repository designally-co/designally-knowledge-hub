import React from "react";

/* useCarousel — index and wrap logic for a clone-based infinite carousel.

   The illusion: the rendered slide list is [tail clones][real slides][head
   clones]. Advancing past the last real slide lands on a head clone, which is
   visually identical to the first real slide. Once that slide finishes, the
   transition is disabled and the position jumps back to the real index. The
   user never sees the seam.

   Two decisions worth naming, because both are places the obvious version is
   wrong:

   - The reset fires on `transitionend`, not on a timer. A timer has to restate
     the CSS duration in JS, and the two drift apart the moment either changes.
   - `clones` is a caller-supplied budget, not a constant. How many slides sit
     either side of the active one depends on the viewport, so cloning a fixed
     number either wastes nodes on a phone or leaves a visible gap on a wide
     display.

   Geometry stays with the caller. This hook never measures anything, so it
   works for a uniform slide rail and for an asymmetric emphasis layout alike.

   Usage:
     const car = useCarousel({ count: items.length, clones, autoAdvanceMs: 5200 });
     <div onTransitionEnd={car.onTransitionEnd} style={{ transition: car.animated ? ... : "none" }}>
*/

/** Fold any position back onto the real band [clones, clones + count). */
const wrapPos = (pos, clones, count) =>
  clones + ((((pos - clones) % count) + count) % count);

function useMediaFlag(query) {
  // Starts false so server rendering and first paint agree; the effect syncs
  // the real value before anything can animate.
  const [flag, setFlag] = React.useState(false);
  React.useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const sync = () => setFlag(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);
  return flag;
}

function usePageVisible() {
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return visible;
}

export function useCarousel({ count, clones, autoAdvanceMs = 0 }) {
  const [pos, setPos] = React.useState(clones);
  const [animated, setAnimated] = React.useState(true);
  const [userPaused, setUserPaused] = React.useState(false);
  // A generic "hold" the caller raises for whatever should suspend advancing
  // on its surface. The hook stays out of deciding what that is; this one is
  // driven by focus landing inside the rail.
  const [held, setHeld] = React.useState(false);
  const clonesRef = React.useRef(clones);

  const reducedMotion = useMediaFlag("(prefers-reduced-motion: reduce)");
  const pageVisible = usePageVisible();

  // A resize changes how many slides fit either side, which changes the clone
  // budget, which shifts every index. Move `pos` by the same delta so the same
  // real slide stays under the viewport, and do it without animating.
  React.useEffect(() => {
    const delta = clones - clonesRef.current;
    if (delta === 0) return;
    clonesRef.current = clones;
    setAnimated(false);
    setPos((p) => p + delta);
  }, [clones]);

  /* Auto-advance. Suspended by an explicit pause, a caller-raised hold, a
     backgrounded tab, and reduced-motion preferences. The two pause sources
     stay separate so releasing a transient hold cannot silently resume
     something the user chose to stop. */
  const autoplay =
    autoAdvanceMs > 0 && !userPaused && !held && pageVisible && !reducedMotion;

  React.useEffect(() => {
    if (!autoplay) return undefined;
    const id = setInterval(() => setPos((p) => p + 1), autoAdvanceMs);
    return () => clearInterval(id);
  }, [autoplay, autoAdvanceMs]);

  // Re-arm the transition one frame after a silent jump. Two frames, because a
  // single one can be batched into the same style flush and animate the jump.
  React.useEffect(() => {
    if (animated) return undefined;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
    return () => cancelAnimationFrame(r);
  }, [animated]);

  // With no transition there is no transitionend, so fold back immediately.
  React.useEffect(() => {
    if (!reducedMotion) return;
    const c = clonesRef.current;
    if (pos < c || pos >= c + count) setPos(wrapPos(pos, c, count));
  }, [reducedMotion, pos, count]);

  /* The invisible reset. Only the track's own transform counts: bubbled
     transitionend events from card opacity would fire this mid-slide. */
  const onTransitionEnd = (e) => {
    if (e.propertyName !== "transform" || e.target !== e.currentTarget) return;
    const c = clonesRef.current;
    if (pos < c || pos >= c + count) {
      setAnimated(false);
      setPos(wrapPos(pos, c, count));
    }
  };

  const next = React.useCallback(() => setPos((p) => p + 1), []);
  const prev = React.useCallback(() => setPos((p) => p - 1), []);
  const advance = React.useCallback((steps) => setPos((p) => p + steps), []);

  return {
    pos,
    // 0-based index of the real slide currently in the emphasis position.
    real: count > 0 ? (((pos - clonesRef.current) % count) + count) % count : 0,
    animated,
    onTransitionEnd,
    next,
    prev,
    advance,
    userPaused,
    togglePaused: () => setUserPaused((p) => !p),
    setHeld,
    reducedMotion,
  };
}
