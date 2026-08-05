'use client'

import React from 'react'

import { TopicPill } from '@/components/ds'
import { localeHref, type Locale } from '@/lib/i18n'
import { tagSlug } from '@/lib/tags'

/**
 * "Topics" — a centred index: the serif title, a row of five category icons,
 * and a cloud of white sticker pills (one per tag).
 *
 * The first time the section scrolls into view the pills rain in one by one and
 * pile up under gravity. Nothing floats: every settled pill is resting on the
 * floor of the stage or on the pills beneath it. The heap is not laid out — it
 * is whatever the simulation ends up with, so it comes out irregular and
 * hand-strewn rather than a tidy triangle. Pills rain into a band across the
 * middle of the stage, so the pile spreads and slumps instead of stacking into
 * a column.
 *
 * The pills stay draggable: pick one out of the heap and the rest sag into the
 * gap it left, then drop or throw it and it falls back down and settles. A
 * press that never really moves is still a plain link click through to the tag
 * page.
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

const GRAVITY = 2600 // px/s², tuned for a lively but natural drop
const PAD = 8 // clear space kept between two pills
const SPREAD = 0.82 // fraction of the stage width the pills rain into
const RELEASE_GAP = 0.055 // seconds between one pill dropping and the next
const SOLVER_PASSES = 36 // contact passes per frame; fewer visibly squashes the heap
const DRAG_SLOP = 4 // px of movement before a press counts as a drag, not a click
const FLOOR_REST = 0.16 // energy kept bouncing off the floor
const WALL_REST = 0.34 // energy kept bouncing off the side walls
const PAIR_REST = 0.05 // energy kept when two pills knock together
const Y_AXIS_BIAS = 2.2 // how strongly contacts prefer to resolve vertically
const CONTACT_FRICTION = 0.3 // how much two touching pills drag on each other
const AIR_DRAG = 1.1 // per-second damping, so drift bleeds off instead of coasting
const GROUND_FRICTION = 7 // per-second horizontal damping for a pill on the floor
const MAX_THROW = 2600 // px/s, keeps a violent flick from launching a pill off-stage
const STILL_PX = 0.35 // px a pill can drift in a frame and still count as at rest
const SLEEP_FRAMES = 8 // consecutive still frames before the loop lets itself stop

type Size = { w: number; h: number }

/** A pill in the simulation. `tilt` is its resting sticker angle. */
type Body = {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  tilt: number
  releaseAt: number
  live: boolean
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
  // look; the simulation gives each pill its own resting tilt.
  const pills = React.useMemo(
    () => topics.map((label, i) => ({ label, rotate: ((i * 37) % 11) - 5 })),
    [topics],
  )

  React.useEffect(() => {
    const bin = binRef.current
    if (!bin) return

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const els = pillRefs.current.filter((el): el is HTMLSpanElement => el != null)
    if (els.length === 0 || typeof IntersectionObserver === 'undefined') return

    // Measure the pills in flow, reserve a stage tall enough for the heap so
    // nothing jumps, then hide them ready to drop.
    const sizes: Size[] = els.map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }))
    bin.classList.add('topics__cloud--stage', 'topics__cloud--pending')

    const seed = hashLabels(topics)
    let W = bin.clientWidth
    let H = stageHeight(sizes, W)
    bin.style.minHeight = `${H}px`

    const bodies = spawn(sizes, W, seed)

    const draw = () => {
      for (let i = 0; i < els.length; i++) {
        const b = bodies[i]
        const { w, h } = sizes[i]
        els[i].style.transform = `translate(${b.x - w / 2}px, ${b.y - h / 2}px) rotate(${b.angle}rad)`
      }
    }

    // --- simulation ---

    let raf = 0
    let last = 0
    let t0 = 0
    let dragIndex = -1
    let stillFrames = 0
    let started = false
    const prevX = new Float64Array(bodies.length)
    const prevY = new Float64Array(bodies.length)

    const step = (now: number) => {
      // Clamping dt keeps a backgrounded tab from resuming with one enormous
      // step that tunnels pills straight through the floor.
      const dt = Math.min(0.024, Math.max(0.001, (now - last) / 1000))
      last = now
      const t = (now - t0) / 1000

      let pending = false
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i]
        if (b.live) continue
        if (t >= b.releaseAt) {
          b.live = true
          els[i].style.opacity = '1'
          els[i].style.pointerEvents = ''
        } else {
          pending = true
        }
      }

      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i]
        if (!b.live || i === dragIndex) continue
        prevX[i] = b.x
        prevY[i] = b.y
        b.vy += GRAVITY * dt
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.vx *= Math.exp(-AIR_DRAG * dt)
      }

      // Several passes: one is not enough to keep a stack of pills from sinking
      // into each other under their own weight.
      const restingV = GRAVITY * dt * 2
      for (let p = 0; p < SOLVER_PASSES; p++) {
        solve(bodies, sizes, W, H, dragIndex, dt, restingV)
      }

      // Stillness is measured as how far anything actually travelled over the
      // whole frame — gravity in, contacts out — and not from velocity.
      // Velocity lies here: a contact only passes the floor's zero up one body
      // per pass, so pills near the top of a stack keep a stale reading long
      // after the heap has visibly stopped, and the loop would never sleep.
      let drift = 0
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i]
        if (!b.live || i === dragIndex) continue
        drift = Math.max(drift, Math.abs(b.x - prevX[i]), Math.abs(b.y - prevY[i]))
      }

      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i]
        if (!b.live) continue
        // A moving pill leans into its travel and rights itself as it settles.
        const lean = clamp(b.vx * 0.0004, -0.22, 0.22)
        b.angle += (b.tilt + lean - b.angle) * Math.min(1, dt * 9)
      }

      draw()

      const busy = pending || dragIndex >= 0 || drift > STILL_PX
      stillFrames = busy ? 0 : stillFrames + 1
      if (stillFrames < SLEEP_FRAMES) {
        raf = requestAnimationFrame(step)
      } else {
        // Park the heap: the stale velocities described above would otherwise
        // be waiting to fire the moment someone grabs a pill and wakes it.
        for (const b of bodies) {
          b.vx = 0
          b.vy = 0
        }
        raf = 0
      }
    }

    const wake = () => {
      if (raf || !started) return
      last = performance.now()
      stillFrames = 0
      raf = requestAnimationFrame(step)
    }

    const start = () => {
      started = true
      bin.classList.remove('topics__cloud--pending')
      bin.classList.add('topics__cloud--physics', 'topics__cloud--live')
      els.forEach((el) => {
        el.style.opacity = '0'
        el.style.pointerEvents = 'none'
      })
      draw()
      t0 = performance.now()
      last = t0
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

    const onPointerDown = (index: number) => (ev: PointerEvent) => {
      if (!started || pointerId !== -1 || !bodies[index].live) return
      if (ev.button != null && ev.button !== 0) return
      const rect = bin.getBoundingClientRect()
      const px = ev.clientX - rect.left
      const py = ev.clientY - rect.top

      pointerId = ev.pointerId
      dragIndex = index
      grabDX = bodies[index].x - px
      grabDY = bodies[index].y - py
      moved = 0
      dragged = false
      lastX = px
      lastY = py
      lastT = performance.now()
      velX = 0
      velY = 0

      bodies[index].vx = 0
      bodies[index].vy = 0
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

      const b = bodies[dragIndex]
      b.x = clamp(px + grabDX, sizes[dragIndex].w / 2, W - sizes[dragIndex].w / 2)
      // A held pill may be lifted above the stage, but never dragged through
      // the floor.
      b.y = Math.min(py + grabDY, H - sizes[dragIndex].h / 2)
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
        if (dragged && !cancelled) {
          bodies[i].vx = clamp(velX, -MAX_THROW, MAX_THROW)
          bodies[i].vy = clamp(velY, -MAX_THROW, MAX_THROW)
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

    const downHandlers = els.map((el, i) => {
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
      { threshold: 0.25 },
    )
    io.observe(bin)

    // --- resize: restate the walls and floor and let the heap re-settle into
    // them. Width only, so mobile URL-bar height churn is ignored. ---

    let resizeTimer = 0
    const onResize = () => {
      if (Math.abs(bin.clientWidth - W) < 40) return
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        const prevW = W
        W = bin.clientWidth
        H = stageHeight(sizes, W)
        bin.style.minHeight = `${H}px`
        const scale = prevW > 0 ? W / prevW : 1
        for (let i = 0; i < bodies.length; i++) {
          const b = bodies[i]
          b.x = clamp(b.x * scale, sizes[i].w / 2, W - sizes[i].w / 2)
          b.y = Math.min(b.y, H - sizes[i].h / 2)
          b.vx = 0
          b.vy = 0
        }
        if (started) wake()
        else draw()
      }, 160)
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
      els.forEach((el, i) => {
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
      </div>
    </section>
  )
}

/** Small deterministic PRNG, so one seed always produces the same drop. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashLabels(labels: string[]): number {
  const s = labels.join('|')
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function clamp(v: number, lo: number, hi: number): number {
  return hi < lo ? (lo + hi) / 2 : v < lo ? lo : v > hi ? hi : v
}

/**
 * How tall the stage has to be for the finished heap. The pills land in a band
 * SPREAD wide and settle at roughly 70% packing, which gives the pile height;
 * the extra headroom is what stops a slumping heap from being squashed against
 * the ceiling, and leaves the top edge of the pile visibly ragged.
 */
function stageHeight(sizes: Size[], W: number): number {
  const area = sizes.reduce((a, s) => a + (s.w + PAD) * (s.h + PAD), 0)
  const tallest = Math.max(...sizes.map((s) => s.h))
  const band = Math.max(1, W * SPREAD)
  // 0.6, not the ~0.75 that row-packing arithmetic suggests: pills land where
  // they land and the settled heap keeps the gaps that leaves. Estimate tighter
  // than this and the top of the pile pokes out through the ceiling — and
  // nothing here clips, by design. Estimate looser and the section carries a
  // band of dead space above the heap.
  const pile = area / (band * 0.6)
  return Math.round(Math.max(200, pile + tallest * 0.8))
}

/**
 * Starting state: every pill waits just above the stage and is let go on a
 * stagger, so they rain in one at a time and pile up rather than landing as one
 * slab.
 *
 * Drop positions are dealt out across the width rather than drawn independently
 * at random. Independent draws cluster, and a cluster of falling boxes does not
 * spread out the way sand would — boxes land squarely on each other and stack,
 * so the pile grows into a tower straight up out of the stage. Walking the
 * width and wrapping keeps the pills apart on the way down; the heap they
 * settle into is still whatever the collisions make of it.
 */
function spawn(sizes: Size[], W: number, seed: number): Body[] {
  const rand = mulberry32(seed)
  const band = Math.max(1, W * SPREAD)
  const left = (W - band) / 2

  // One evenly spaced drop column per pill, handed out in shuffled order.
  // Walking the width and wrapping instead would restart every row at the left
  // edge, so the left column collects a pill from each row while the right edge
  // gets one, and the heap settles badly lopsided. Even columns give the pile a
  // consistent depth; the pills are far wider than the spacing, so they still
  // collide on the way down and the result is nothing like a grid.
  const n = sizes.length
  const columns = sizes.map((_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[columns[i], columns[j]] = [columns[j], columns[i]]
  }

  // Release order is shuffled independently, so the cloud rains in at random
  // rather than sweeping across.
  const slots = sizes.map((_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[slots[i], slots[j]] = [slots[j], slots[i]]
  }

  return sizes.map((s, i) => ({
    x: clamp(
      left + ((columns[i] + 0.5) * band) / n + (rand() - 0.5) * 20,
      s.w / 2,
      W - s.w / 2,
    ),
    y: -s.h / 2 - 20 - rand() * 40,
    vx: (rand() - 0.5) * 30,
    vy: 0,
    tilt: (rand() - 0.5) * 0.14,
    angle: (rand() - 0.5) * 0.14,
    releaseAt: slots[i] * RELEASE_GAP + rand() * 0.02,
    live: false,
  }))
}

/**
 * One contact pass. Overlapping pills are pushed apart along their shallower
 * axis and the part of their motion that drove them together is cancelled, so
 * a stack holds instead of sinking. Pills also collide with the side walls and
 * the floor — nothing is left hanging in mid-air. `locked` is the pill under
 * the pointer: it shoves the heap around but is never shoved itself.
 *
 * This is a position solver, so one pass only nudges each pair apart and the
 * correction has to propagate down the heap a contact at a time. Under constant
 * gravity too few passes per frame leave the pile visibly squashed, pills
 * sunk into one another — hence the pass count at the top of the file.
 */
function solve(
  bodies: Body[],
  sizes: Size[],
  W: number,
  H: number,
  locked: number,
  dt: number,
  restingV: number,
): void {
  const n = bodies.length

  for (let i = 0; i < n; i++) {
    if (!bodies[i].live) continue
    for (let j = i + 1; j < n; j++) {
      if (!bodies[j].live) continue
      const a = bodies[i]
      const b = bodies[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const minX = (sizes[i].w + sizes[j].w) / 2 + PAD
      const minY = (sizes[i].h + sizes[j].h) / 2 + PAD
      const ox = minX - Math.abs(dx)
      const oy = minY - Math.abs(dy)
      if (ox <= 0 || oy <= 0) continue

      const iLocked = i === locked
      const jLocked = j === locked
      if (iLocked && jLocked) continue
      // A locked pill carries none of the correction; the other body takes it all.
      const wa = iLocked ? 0 : jLocked ? 1 : 0.5
      const wb = 1 - wa

      // Resolve along the shallower axis, but lean towards the vertical one.
      // These pills are wide and flat, so a stacked pair often overlaps less
      // horizontally than vertically; taking that literally squirts them out
      // sideways and the heap never stops shuffling. Gravity's axis wins ties
      // and near-ties, which is what makes a stack hold.
      if (ox * Y_AXIS_BIAS < oy) {
        const sign = dx < 0 ? -1 : 1
        const push = sign * ox
        a.x -= push * wa
        b.x += push * wb
        const rel = (b.vx - a.vx) * sign
        if (rel < 0) {
          const j2 = -rel * (1 + PAIR_REST)
          a.vx -= j2 * sign * wa
          b.vx += j2 * sign * wb
        }
        // Friction across the contact, so pills in contact stop sliding past
        // one another instead of drifting for ever.
        const tan = b.vy - a.vy
        a.vy += tan * CONTACT_FRICTION * wa
        b.vy -= tan * CONTACT_FRICTION * wb
      } else {
        const sign = dy < 0 ? -1 : 1
        const push = sign * oy
        a.y -= push * wa
        b.y += push * wb
        const rel = (b.vy - a.vy) * sign
        if (rel < 0) {
          const j2 = -rel * (1 + PAIR_REST)
          a.vy -= j2 * sign * wa
          b.vy += j2 * sign * wb
        }
        const tan = b.vx - a.vx
        a.vx += tan * CONTACT_FRICTION * wa
        b.vx -= tan * CONTACT_FRICTION * wb
      }
    }
  }

  for (let i = 0; i < n; i++) {
    const b = bodies[i]
    if (!b.live || i === locked) continue
    const hw = sizes[i].w / 2
    const hh = sizes[i].h / 2

    if (b.x < hw) {
      b.x = hw
      if (b.vx < 0) b.vx = -b.vx * WALL_REST
    } else if (b.x > W - hw) {
      b.x = W - hw
      if (b.vx > 0) b.vx = -b.vx * WALL_REST
    }

    // The floor. A pill arriving slower than a single frame of gravity has no
    // bounce left worth showing, so it is simply parked — without that test it
    // would buzz against the floor forever and never let the loop sleep.
    if (b.y > H - hh) {
      b.y = H - hh
      if (b.vy > restingV) b.vy = -b.vy * FLOOR_REST
      else if (b.vy > 0) b.vy = 0
      b.vx *= Math.exp(-GROUND_FRICTION * dt)
    }
  }
}
