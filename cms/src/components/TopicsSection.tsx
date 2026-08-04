'use client'

import React from 'react'

import { TopicPill } from '@/components/ds'
import { localeHref, type Locale } from '@/lib/i18n'
import { tagSlug } from '@/lib/tags'

/**
 * "Topics" — a centred index: the serif title, a row of five category icons,
 * and a cloud of white sticker pills (one per tag).
 *
 * The first time the section scrolls into view the pills fall in under gravity
 * and pack into a dense triangle: the layout is computed as a pyramid (a wide
 * base tapering to a point, row counts adapting to the width so it stays a
 * triangle on both desktop and mobile), then each pill drops straight into its
 * slot with a small settle bounce and a tiny fixed tilt so the labels stay
 * readable. Nothing is clipped — soft shadows show in full.
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

type Size = { w: number; h: number }
type Target = {
  x: number
  targetY: number
  startY: number
  angle: number
  delay: number
  fallT: number
  bounce: number
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
  // look; the drop animation gives each pill a fresh tilt.
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

    // Measure the pills in flow, compute the pyramid, reserve the stage height so
    // nothing jumps, and hide the pills ready to drop.
    const sizes: Size[] = els.map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }))
    bin.classList.add('topics__cloud--stage', 'topics__cloud--pending')
    const layout = pyramidLayout(sizes, bin.clientWidth)
    bin.style.minHeight = `${layout.H}px`

    let cleanup: (() => void) | undefined
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        io.disconnect()
        cleanup = dropIntoPyramid(bin, els, sizes, layout.targets)
      },
      { threshold: 0.25 },
    )
    io.observe(bin)

    return () => {
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

/**
 * Lays the pills out as a centred triangle: a wide base tapering to a point.
 * Row counts come from a linear taper (base capacity → 1) sized to the width, so
 * the shape stays a triangle whether it's 3–4 wide on desktop or 2 wide on a
 * phone. Widest pills go to the base. Returns per-pill drop targets + the stage
 * height.
 */
function pyramidLayout(sizes: Size[], W: number): { targets: Target[]; H: number } {
  const n = sizes.length
  const maxH = Math.max(...sizes.map((s) => s.h))
  const totalW = sizes.reduce((a, s) => a + s.w, 0)
  const gapX = 8
  const gapY = 4
  const rowH = maxH + gapY
  const baseW = W * 0.94
  const avgW = totalW / n
  const baseCap = Math.max(1, Math.floor((baseW + gapX) / (avgW + gapX)))
  const R = Math.max(2, Math.round((2 * n) / (baseCap + 1)))

  // Row counts: linear taper from the base capacity down to 1, rounded, then
  // nudged so they sum to exactly n.
  let counts = Array.from({ length: R }, (_, r) => baseCap - (baseCap - 1) * (R > 1 ? r / (R - 1) : 0))
  const isum = counts.reduce((a, b) => a + b, 0)
  counts = counts.map((v) => Math.max(1, Math.round((v * n) / isum)))
  let rem = n - counts.reduce((a, b) => a + b, 0)
  for (let r = 0; rem > 0; r = (r + 1) % R) {
    counts[r]++
    rem--
  }
  for (let r = R - 1; rem < 0 && r >= 0; r--) {
    while (rem < 0 && counts[r] > 1) {
      counts[r]--
      rem++
    }
  }

  const ids = sizes.map((_, i) => i).sort((a, b) => sizes[b].w - sizes[a].w)
  const rows: number[][] = []
  for (let r = 0; r < R; r++) {
    const items = ids.splice(0, counts[r])
    if (items.length) rows.push(items)
  }
  if (ids.length) rows.push(ids.splice(0))

  const pileH = rows.length * rowH
  const H = Math.round(pileH + Math.min(96, maxH * 1.5))

  const targets: Target[] = new Array(n)
  rows.forEach((row, r) => {
    // row 0 is the widest = the base, placed at the bottom.
    const yc = H - rowH * (r + 0.5)
    const rw = row.reduce((a, id, i) => a + sizes[id].w + (i ? gapX : 0), 0)
    let cx = (W - rw) / 2
    const rowDelay = r * 0.06 // base falls first, then it builds upward
    row.forEach((id, ci) => {
      const w = sizes[id].w
      const x = cx + w / 2
      cx += w + gapX
      const startY = -34 - Math.random() * 30
      const dist = yc - startY
      targets[id] = {
        x,
        targetY: yc,
        startY,
        angle: (Math.random() - 0.5) * 0.12,
        delay: rowDelay + ci * 0.025 + Math.random() * 0.02,
        fallT: Math.sqrt((2 * dist) / GRAVITY),
        bounce: Math.min(9, dist * 0.028),
      }
    })
  })
  return { targets, H }
}

/**
 * Drives each pill from above down to its pyramid slot with gravity easing and a
 * small landing bounce, staggered so the pile builds from the base up. Returns a
 * cleanup that stops the animation frame.
 */
function dropIntoPyramid(
  bin: HTMLDivElement,
  els: HTMLSpanElement[],
  sizes: Size[],
  targets: Target[],
): () => void {
  bin.classList.remove('topics__cloud--pending')
  bin.classList.add('topics__cloud--physics')

  const t0 = performance.now()
  let raf = 0
  let running = true

  const frame = (now: number) => {
    if (!running) return
    let done = true
    for (let i = 0; i < els.length; i++) {
      const tg = targets[i]
      if (!tg) continue
      const e = (now - t0) / 1000 - tg.delay
      if (e <= 0) {
        els[i].style.opacity = '0'
        done = false
        continue
      }
      els[i].style.opacity = '1'
      const { w, h } = sizes[i]
      let y: number
      if (e < tg.fallT) {
        y = tg.startY + 0.5 * GRAVITY * e * e
        done = false
      } else {
        const be = e - tg.fallT
        if (be < 0.24) {
          y = tg.targetY - tg.bounce * Math.sin((be / 0.24) * Math.PI) * Math.exp(-be * 6.5)
          done = false
        } else {
          y = tg.targetY
        }
      }
      els[i].style.transform = `translate(${tg.x - w / 2}px, ${y - h / 2}px) rotate(${tg.angle}rad)`
    }
    if (!done) raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  return () => {
    running = false
    cancelAnimationFrame(raf)
  }
}
