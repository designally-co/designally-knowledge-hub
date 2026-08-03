'use client'

import React from 'react'
import type * as MatterJS from 'matter-js'

import { TopicPill } from '@/components/ds'
import { localeHref, type Locale } from '@/lib/i18n'
import { TAG_OPTIONS, tagSlug } from '@/lib/tags'

/**
 * "Topics" — a centred index: the serif title, a row of five category icons,
 * and a cloud of white sticker pills. Sits on the shared warm gradient it forms
 * with the Workflows section above it. Labels stay English in both locales.
 *
 * The first time the section scrolls into view, the pills fall in under gravity
 * (Matter.js, lazy-loaded) and pile up. Each pill's rotation is LOCKED to a
 * small fixed tilt (infinite inertia), so they never tumble upside-down — the
 * links stay readable — while still colliding and stacking like real objects.
 * Nothing is clipped: the stage has no overflow, so soft shadows and pills near
 * the edges show in full. Sized from the pill count, it scales to ~34 pills.
 * Progressive enhancement: no-JS / reduced-motion get the static sticker cloud.
 *
 * The five icons are emoji placeholders — swap them for the real 3D icon art.
 */
const TOPIC_ICONS = ['🔷', '🖋️', '💿', '📸', '📣']

// Every content-direction tag becomes a pill linking to its own tag page. The
// small deterministic tilt gives the static (no-JS / reduced-motion) cloud its
// scattered-sticker look; the physics run locks each pill to a fresh tilt.
const TOPICS: { label: string; rotate: number }[] = TAG_OPTIONS.map((label, i) => ({
  label,
  rotate: ((i * 37) % 11) - 5,
}))

type Size = { w: number; h: number }

export function TopicsSection({ title, locale }: { title: string; locale: Locale }) {
  const binRef = React.useRef<HTMLDivElement>(null)
  const pillRefs = React.useRef<Array<HTMLSpanElement | null>>([])

  React.useEffect(() => {
    const bin = binRef.current
    if (!bin) return

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') return

    const els = pillRefs.current.filter((el): el is HTMLSpanElement => el != null)
    if (els.length === 0) return

    // Measure the pills in flow, reserve the stage height now (so nothing jumps
    // when the sim starts), and hide the pills ready to drop.
    const sizes: Size[] = els.map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }))
    bin.classList.add('topics__cloud--stage', 'topics__cloud--pending')
    const stageH = stageHeight(sizes, bin.clientWidth)
    bin.style.minHeight = `${stageH}px`

    let cancelled = false
    let cleanup: (() => void) | undefined

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        io.disconnect()
        import('matter-js').then((Matter) => {
          if (cancelled || !binRef.current) return
          cleanup = dropAndStack(Matter, binRef.current, els, sizes, stageH)
        })
      },
      { threshold: 0.25 },
    )
    io.observe(bin)

    return () => {
      cancelled = true
      io.disconnect()
      cleanup?.()
    }
  }, [])

  return (
    <section className="topics" aria-labelledby="topics-heading">
      <div className="topics__inner">
        <h2 id="topics-heading" className="topics__heading">
          {title}
        </h2>

        <div className="topics__icons" aria-hidden="true">
          {TOPIC_ICONS.map((icon, i) => (
            <span className="topics__icon" key={i}>
              {icon}
            </span>
          ))}
        </div>

        <div ref={binRef} className="topics__cloud">
          {TOPICS.map((t, i) => (
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

/** Estimate the stage height: room for the settled pile plus a fall zone. */
function stageHeight(sizes: Size[], width: number): number {
  const maxH = Math.max(...sizes.map((s) => s.h))
  const totalW = sizes.reduce((a, s) => a + s.w, 0)
  const rows = Math.max(1, Math.ceil(totalW / (Math.max(width, 1) * 0.8)))
  const pile = rows * (maxH + 6) * 1.16
  const fall = Math.min(170, maxH * 2.4)
  return Math.max(260, Math.round(pile + fall))
}

/**
 * Drops the measured pills into the bin under gravity in timed waves and pins
 * each DOM element to its rigid body every frame until the pile sleeps. Rotation
 * is locked so labels stay upright. Returns a cleanup.
 */
function dropAndStack(
  Matter: typeof import('matter-js'),
  bin: HTMLDivElement,
  els: HTMLSpanElement[],
  sizes: Size[],
  H: number,
): () => void {
  const { Engine, Bodies, Body, Composite } = Matter

  bin.classList.remove('topics__cloud--pending')
  bin.classList.add('topics__cloud--physics')

  const W = bin.clientWidth
  const n = els.length
  const maxW = Math.max(...sizes.map((s) => s.w))

  const engine = Engine.create()
  engine.gravity.y = 1.2
  engine.enableSleeping = true

  // Floor + tall side walls (spawn is just above the top, but keep walls deep
  // so a fast pill can never tunnel out sideways).
  const wall = { isStatic: true, friction: 0.6, restitution: 0.1 }
  const T = 200
  const wallH = (H + 400) * 2
  Composite.add(engine.world, [
    Bodies.rectangle(W / 2, H + T / 2, W + T * 2, T, wall),
    Bodies.rectangle(-T / 2, H / 2, T, wallH, wall),
    Bodies.rectangle(W + T / 2, H / 2, T, wallH, wall),
  ])

  const order = els.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }

  const bodies: Array<MatterJS.Body | null> = els.map(() => null)
  const timers: number[] = []
  const perWave = Math.max(2, Math.floor((W - 100) / (maxW + 26)))
  let placed = 0

  const spawnWave = () => {
    const count = Math.min(perWave, n - placed)
    const step = (W - 120) / count
    for (let c = 0; c < count; c++) {
      const idx = order[placed + c]
      const { w, h } = sizes[idx]
      const cx = 60 + step * (c + 0.5) + (Math.random() - 0.5) * step * 0.55
      const x = Math.max(w / 2 + 6, Math.min(W - w / 2 - 6, cx))
      const y = -30 - Math.random() * 48
      const angle = (Math.random() - 0.5) * 0.22 // ~+/-6deg, readable
      const body = Bodies.rectangle(x, y, w, h, {
        chamfer: { radius: h / 2 },
        restitution: 0.08,
        friction: 0.5,
        frictionStatic: 0.85,
        density: 0.0012,
        angle,
      })
      Body.setInertia(body, Infinity) // lock rotation: labels never flip
      bodies[idx] = body
      els[idx].style.opacity = '1'
      els[idx].style.transform = `translate(${x - w / 2}px, ${y - h / 2}px) rotate(${angle}rad)`
      Composite.add(engine.world, body)
    }
    placed += count
    if (placed < n) timers.push(window.setTimeout(spawnWave, 115))
  }
  spawnWave()

  let raf = 0
  let running = true
  let idle = 0
  let frames = 0

  const step = () => {
    if (!running) return
    Engine.update(engine, 1000 / 60)
    frames++

    let allAsleep = true
    for (let i = 0; i < els.length; i++) {
      const body = bodies[i]
      if (!body) continue
      const { w, h } = sizes[i]
      els[i].style.transform = `translate(${body.position.x - w / 2}px, ${body.position.y - h / 2}px) rotate(${body.angle}rad)`
      if (!body.isSleeping) allAsleep = false
    }

    if (placed >= n && allAsleep) {
      if (++idle > 24) running = false
    } else {
      idle = 0
    }
    if (frames > 1800) running = false
    if (running) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)

  return () => {
    running = false
    cancelAnimationFrame(raf)
    timers.forEach(clearTimeout)
    Composite.clear(engine.world, false)
    Engine.clear(engine)
  }
}
