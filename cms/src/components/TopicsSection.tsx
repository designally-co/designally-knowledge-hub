'use client'

import React from 'react'

import { TopicPill } from '@/components/ds'
import { localeHref, type Locale } from '@/lib/i18n'
import {
  createWorld,
  hashLabels,
  MAX_THROW,
  park,
  SLEEP_FRAMES,
  stepWorld,
  STILL_PX,
  wakeBody,
  type Size,
  type World,
} from '@/lib/pillPhysics'
import { tagSlug } from '@/lib/tags'

/**
 * "Topics" — a centred index: the serif title, a row of five category icons,
 * and a cloud of white sticker pills (one per tag).
 *
 * The first time the section scrolls into view the pills rain in and pile up
 * under gravity, edge to edge across the viewport — the stage is deliberately
 * a sibling of the centred column rather than a child of it, so there is no
 * invisible wall part-way across the screen for pills to stack against.
 *
 * The pile is simulated, not laid out. Pills are rigid bodies with orientation
 * (see `@/lib/pillPhysics`), so one that lands across the end of another rotates
 * about that contact and topples until it finds a second one, rather than
 * balancing on the point it happened to touch. Every settled pill is resting on
 * the floor or on the pills beneath it.
 *
 * They stay draggable: pick one out and the heap sags into the gap, throw it and
 * it carries its momentum, tumbles and re-settles. A press that never really
 * moves is still a plain link click through to the tag page.
 *
 * Progressive enhancement: no-JS / reduced-motion get the static sticker cloud.
 */
const TOPIC_ICONS = [
  '/topic-icons/blocks.png',
  '/topic-icons/pen.png',
  '/topic-icons/cd.png',
  '/topic-icons/camera.png',
  '/topic-icons/megaphone.png',
]

const DRAG_SLOP = 4 // px of movement before a press counts as a drag, not a click
const MAX_AWAKE_MS = 14000 // hard cap on one continuous run of the simulation

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

export function TopicsSection({
  title,
  locale,
  topics,
}: {
  title: string
  locale: Locale
  topics: string[]
}) {
  const binRef = React.useRef<HTMLDivElement>(null)
  const pillRefs = React.useRef<Array<HTMLSpanElement | null>>([])

  // Each tag becomes a pill linking to its own tag page. The small deterministic
  // tilt gives the static (no-JS / reduced-motion) cloud its scattered-sticker
  // look; in the simulation the angle is real state.
  const pills = React.useMemo(
    () => topics.map((label, i) => ({ label, rotate: ((i * 37) % 11) - 5 })),
    [topics],
  )

  React.useEffect(() => {
    const bin = binRef.current
    if (!bin) return

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const allEls = pillRefs.current.filter((el): el is HTMLSpanElement => el != null)
    if (allEls.length === 0 || typeof IntersectionObserver === 'undefined') return

    const seed = hashLabels(topics)
    // Pills the stylesheet is currently showing. Phones are capped at eight, so
    // this is a subset of the markup, and `bodyOf` maps an element back to its
    // body — or -1 for one that is not in the heap at this width.
    let els: HTMLSpanElement[] = []
    let sizes: Size[] = []
    const bodyOf = new Int16Array(allEls.length)

    /**
     * Measures the pills laid out in normal flow. The stage classes have to come
     * off first: once the simulation owns them they are absolutely positioned,
     * and a width read then is not the width they wrap at. Hidden pills measure
     * zero and are simply left out.
     */
    const measure = () => {
      // Restore exactly the classes that were set, not both: this runs before
      // the drop as well as after it, and the two states differ.
      const wasStage = bin.classList.contains('topics__cloud--stage')
      const wasPhysics = bin.classList.contains('topics__cloud--physics')
      bin.classList.remove('topics__cloud--stage', 'topics__cloud--physics')
      els = []
      sizes = []
      bodyOf.fill(-1)
      allEls.forEach((el, i) => {
        const prev = el.style.transform
        el.style.transform = ''
        const w = el.offsetWidth
        const h = el.offsetHeight
        el.style.transform = prev
        if (w === 0 || h === 0) return
        bodyOf[i] = els.length
        els.push(el)
        sizes.push({ w, h })
      })
      if (wasStage) bin.classList.add('topics__cloud--stage')
      if (wasPhysics) bin.classList.add('topics__cloud--physics')
    }

    measure()
    if (els.length === 0) return
    bin.classList.add('topics__cloud--stage', 'topics__cloud--pending')

    let world: World = createWorld(sizes, bin.clientWidth, seed)
    bin.style.minHeight = `${world.H}px`

    const HALF_PI = Math.PI / 2
    const draw = () => {
      for (let i = 0; i < els.length; i++) {
        const b = world.bodies[i]
        const { w, h } = sizes[i]
        // A capsule maps exactly onto itself every half turn, so folding the
        // drawn angle into (-90°, 90°] leaves the shape identical to what the
        // simulation is solving while keeping the label the right way up. In a
        // tight pile a pill can genuinely come to rest past vertical, and an
        // upside-down topic name is no use to anyone.
        const a = (((b.angle + HALF_PI) % Math.PI) + Math.PI) % Math.PI - HALF_PI
        els[i].style.transform = `translate(${b.x - w / 2}px, ${b.y - h / 2}px) rotate(${a}rad)`
      }
    }

    let raf = 0
    let last = 0
    let dragIndex = -1
    let stillFrames = 0
    let started = false
    let awokeAt = 0

    const step = (now: number) => {
      // Clamping dt keeps a backgrounded tab from resuming with one enormous
      // step that throws pills straight through the floor.
      const dt = Math.min(0.022, Math.max(0.001, (now - last) / 1000))
      last = now

      const drift = stepWorld(world, dt, dragIndex)

      for (let i = 0; i < els.length; i++) {
        if (world.bodies[i].live && els[i].style.opacity !== '1') {
          els[i].style.opacity = '1'
          els[i].style.pointerEvents = ''
        }
      }
      draw()

      const busy = dragIndex >= 0 || drift > STILL_PX
      stillFrames = busy ? 0 : stillFrames + 1
      // Backstop. A heap that is both very crowded and very narrow can keep
      // finding somewhere to go for longer than anyone will watch, and a loop
      // that never sleeps is a phone battery draining behind a section nobody
      // is looking at any more. Past this it is called finished regardless.
      const runaway = dragIndex < 0 && now - awokeAt > MAX_AWAKE_MS
      if (stillFrames < SLEEP_FRAMES && !runaway) {
        raf = requestAnimationFrame(step)
      } else {
        park(world)
        raf = 0
      }
    }

    const wake = () => {
      if (raf || !started) return
      last = performance.now()
      awokeAt = last
      stillFrames = 0
      raf = requestAnimationFrame(step)
    }

    const start = () => {
      started = true
      bin.classList.remove('topics__cloud--pending')
      bin.classList.add('topics__cloud--physics', 'topics__cloud--live')
      allEls.forEach((el) => {
        el.style.opacity = '0'
        el.style.pointerEvents = 'none'
      })
      draw()
      last = performance.now()
      awokeAt = last
      stillFrames = 0
      raf = requestAnimationFrame(step)
    }

    // --- dragging ---

    // Tracked per gesture so a press can still resolve as a link click.
    let pointerId = -1
    let grabDX = 0
    let grabDY = 0
    let moved = 0
    let lastX = 0
    let lastY = 0
    let lastT = 0
    let velX = 0
    let velY = 0
    let dragged = false
    let suppressClickUntil = 0

    const onPointerDown = (elIndex: number) => (ev: PointerEvent) => {
      // Handlers are bound to every pill in the markup, but only the ones the
      // current width actually shows have a body to grab.
      const index = bodyOf[elIndex]
      if (index < 0 || !started || pointerId !== -1 || !world.bodies[index].live) return
      if (ev.button != null && ev.button !== 0) return
      const rect = bin.getBoundingClientRect()
      const px = ev.clientX - rect.left
      const py = ev.clientY - rect.top
      const b = world.bodies[index]

      pointerId = ev.pointerId
      dragIndex = index
      grabDX = b.x - px
      grabDY = b.y - py
      moved = 0
      dragged = false
      lastX = px
      lastY = py
      lastT = performance.now()
      velX = 0
      velY = 0

      b.vx = 0
      b.vy = 0
      b.omega = 0
      wakeBody(b)
      els[index].setPointerCapture(ev.pointerId)
      wake()
    }

    const onPointerMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId || dragIndex < 0) return
      const rect = bin.getBoundingClientRect()
      const px = ev.clientX - rect.left
      const py = ev.clientY - rect.top

      moved += Math.hypot(px - lastX, py - lastY)
      if (!dragged && moved > DRAG_SLOP) {
        dragged = true
        els[dragIndex].classList.add('is-dragging')
      }

      const now = performance.now()
      const dt = Math.max(0.001, (now - lastT) / 1000)
      // Smoothed so a single jittery sample can't dominate the throw.
      velX = velX * 0.6 + ((px - lastX) / dt) * 0.4
      velY = velY * 0.6 + ((py - lastY) / dt) * 0.4
      lastX = px
      lastY = py
      lastT = now

      const b = world.bodies[dragIndex]
      b.x = px + grabDX
      b.y = Math.min(py + grabDY, world.H - b.r)
      // The held pill carries the pointer's velocity, so it shoulders the heap
      // aside with the weight the gesture actually has.
      b.vx = velX
      b.vy = velY
      wake()
    }

    const endDrag = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      const i = dragIndex
      // pointercancel means the browser claimed the gesture (a page scroll on
      // touch). That is not a throw, so the pill is simply let go.
      const cancelled = ev.type === 'pointercancel'
      if (i >= 0) {
        els[i].classList.remove('is-dragging')
        const b = world.bodies[i]
        if (dragged && !cancelled) {
          b.vx = clamp(velX, -MAX_THROW, MAX_THROW)
          b.vy = clamp(velY, -MAX_THROW, MAX_THROW)
          // A pill flicked sideways should leave the hand spinning.
          b.omega = clamp(velX / 900, -7, 7)
        } else {
          b.vx = 0
          b.vy = 0
        }
      }
      // The click lands right after this, so the suppression window is time
      // boxed rather than a flag left standing. A stale flag would otherwise
      // swallow the next click — including a keyboard Enter on a focused pill,
      // which never goes through pointerdown to clear it.
      if (dragged && !cancelled) suppressClickUntil = performance.now() + 350
      dragged = false
      pointerId = -1
      dragIndex = -1
      wake()
    }

    // A real drag must not follow the pill's link. Capture phase so this wins
    // before the anchor sees the click.
    const onClickCapture = (ev: MouseEvent) => {
      if (performance.now() > suppressClickUntil) return
      suppressClickUntil = 0
      ev.preventDefault()
      ev.stopPropagation()
    }

    const downHandlers = allEls.map((el, i) => {
      const h = onPointerDown(i)
      el.addEventListener('pointerdown', h)
      el.addEventListener('click', onClickCapture, true)
      return h
    })
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        io.disconnect()
        start()
      },
      { threshold: 0.2 },
    )
    io.observe(bin)

    // --- resize: rebuild the stage at the new width and drop the heap again.
    // Width only, so mobile URL-bar height churn is ignored. ---

    let resizeTimer = 0
    const onResize = () => {
      if (Math.abs(bin.clientWidth - world.W) < 40) return
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        const settled = started
        // Crossing the phone breakpoint changes the pill sizes and how many of
        // them are in the heap at all, so this re-measures rather than reusing.
        for (const el of allEls) {
          el.style.transform = ''
          el.style.opacity = ''
          el.style.pointerEvents = ''
        }
        measure()
        if (els.length === 0) return
        world = createWorld(sizes, bin.clientWidth, seed)
        bin.style.minHeight = `${world.H}px`
        if (settled) {
          // Already on screen, so skip the rain-in and let it fall as one.
          for (const b of world.bodies) b.live = true
          for (const el of els) el.style.opacity = '1'
          wake()
        }
      }, 180)
    }
    window.addEventListener('resize', onResize)

    return () => {
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
      allEls.forEach((el, i) => {
        el.removeEventListener('pointerdown', downHandlers[i])
        el.removeEventListener('click', onClickCapture, true)
        el.classList.remove('is-dragging')
        el.style.transform = ''
        el.style.opacity = ''
        el.style.pointerEvents = ''
      })
      // Hand the pills back to normal flow, so if this effect runs again it
      // measures them laid out rather than absolutely positioned.
      bin.classList.remove(
        'topics__cloud--stage',
        'topics__cloud--pending',
        'topics__cloud--physics',
        'topics__cloud--live',
      )
      bin.style.minHeight = ''
    }
  }, [topics])

  return (
    <section className="topics" aria-labelledby="topics-heading">
      <div className="topics__inner">
        <h2 id="topics-heading" className="topics__heading">
          {title}
        </h2>

        <div className="topics__icons" aria-hidden="true">
          {TOPIC_ICONS.map((src) => (
            <img className="topics__icon" key={src} src={src} alt="" loading="lazy" decoding="async" />
          ))}
        </div>
      </div>

      {/* Outside the centred column on purpose: the heap needs the full width of
          the screen, with its walls at the screen edges and nowhere inside. */}
      <div ref={binRef} className="topics__cloud">
        {pills.map((t, i) => (
          <span
            className="topics__pill-drop"
            key={t.label}
            ref={(el) => {
              pillRefs.current[i] = el
            }}
            style={{ '--pill-rotate': `${t.rotate}deg` } as React.CSSProperties}
          >
            <TopicPill
              className="topics__pill"
              size="lg"
              rotate={t.rotate}
              href={localeHref(locale, `/tag/${tagSlug(t.label)}`)}
              draggable={false}
            >
              {t.label}
            </TopicPill>
          </span>
        ))}
      </div>
    </section>
  )
}
