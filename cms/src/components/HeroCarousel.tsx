'use client'
import React from 'react'

import { Tag } from '@/components/ds'
import { useCarousel } from '@/components/ds/useCarousel.js'
import type { CarouselItem } from '@/lib/resources'

/* Hero inspiration carousel — ported from the Vite app's InspirationCarousel.
   One card sits in the emphasis slot (larger, tags + date); after a dwell it
   slides one step so the next card takes that slot. Auto-advances, supports
   drag/swipe and arrow keys, and loops via clone-based infinite scrolling.

   Now data-driven: `items` come from the CMS (most recent published articles)
   via the Local API — see lib/resources.ts. */

const RATIO_MIN = 0.75 // 3:4
const RATIO_MAX = 1.9 // a shade wider than 16:9
const PEEK = 56
const EMPH_SCALE = 1.5 // how much taller the emphasised card is
const TAG_ROW_MIN = 218
const UNIT_FLOOR = Math.ceil(TAG_ROW_MIN / EMPH_SCALE)

const ratioOf = (item: CarouselItem): number => {
  const raw = item?.ratio
  const [a, b] = String(raw ?? '3 / 4')
    .split('/')
    .map((n) => parseFloat(n))
  return b > 0 && a > 0 ? a / b : RATIO_MIN
}

const clampRatio = (r: number, ratioMax: number) => Math.min(Math.max(r, RATIO_MIN), ratioMax)

type Metrics = {
  railH1: number
  railH2: number
  contentLeft: number
  ratioMax: number
  clones: number
}

/* A single carousel card. The emphasised card is a real 1.5x taller box and
   reveals its tags + date; passing cards show only image + title. */
function TickerCard({
  item,
  emph,
  index,
  total,
  ratio,
}: {
  item: CarouselItem
  emph: boolean
  index: number
  total: number
  ratio: number
}) {
  return (
    <a
      href={item.href}
      draggable={false}
      className={`carousel__card${emph ? ' carousel__card--emph' : ''}`}
      style={{ '--cover-ratio': ratio } as React.CSSProperties}
      aria-hidden={emph ? undefined : 'true'}
      tabIndex={emph ? undefined : -1}
    >
      <div className="carousel__meta">
        {item.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
      {item.image ? (
        <img
          className="carousel__image"
          src={item.image}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ) : (
        <span className="carousel__image" aria-hidden="true" />
      )}
      <span className="carousel__title">
        {emph && <span className="visually-hidden">{`Item ${index} of ${total}: `}</span>}
        {item.title}
      </span>
      <p className="carousel__date">{item.date}</p>
    </a>
  )
}

export function HeroCarousel({ items }: { items: CarouselItem[] }) {
  const GAP = 14
  const DWELL = 5200 // ms each card holds the emphasis slot
  const len = items.length

  const [dragDelta, setDragDelta] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)
  const drag = React.useRef({ active: false, startX: 0, delta: 0, moved: false, captured: false })

  const containerRef = React.useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = React.useState<Metrics>({
    railH1: 213,
    railH2: 320,
    contentLeft: 20,
    ratioMax: RATIO_MAX,
    clones: 4,
  })

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const measure = () => {
      const w = el.clientWidth
      const pageMax =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-max')) ||
        1440
      const gutter = Math.min(88, Math.max(20, window.innerWidth * 0.05)) // clamp(20px, 5vw, 88px)
      const margin = Math.max((w - pageMax) / 2, 0)
      const contentLeft = margin + gutter
      const unit = Math.round(Math.min(160, Math.max(UNIT_FLOOR, w * 0.3)))
      const railH1 = Math.round((unit * 4) / 3)
      const railH2 = Math.round(railH1 * EMPH_SCALE)

      const maxCardW = Math.max(railH2 * RATIO_MIN, w - contentLeft - PEEK)
      const ratioMax = Math.max(RATIO_MIN, Math.min(RATIO_MAX, maxCardW / railH2))

      const narrowest = railH1 * Math.min(...items.map((it) => clampRatio(ratioOf(it), ratioMax)))
      const lead = Math.ceil(contentLeft / (narrowest + GAP)) + 1
      const trail =
        Math.ceil(Math.max(0, w - contentLeft - narrowest * EMPH_SCALE) / (narrowest + GAP)) + 1
      setMetrics({ railH1, railH2, contentLeft, ratioMax, clones: Math.max(1, lead, trail) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [items])

  const car = useCarousel({ count: len, clones: metrics.clones, autoAdvanceMs: DWELL })

  const geom = React.useMemo(() => {
    const { clones, railH1, ratioMax } = metrics
    const at = (n: number) => items[((n % len) + len) % len]
    const strip: { item: CarouselItem; key: string }[] = []
    for (let i = 0; i < clones; i++) strip.push({ item: at(len - clones + i), key: `lead-${i}` })
    items.forEach((item, i) => strip.push({ item, key: `real-${i}` }))
    for (let i = 0; i < clones; i++) strip.push({ item: at(i), key: `trail-${i}` })

    const ratios = strip.map((e) => clampRatio(ratioOf(e.item), ratioMax))
    const offsets = [0]
    for (let i = 0; i < strip.length; i++) {
      offsets.push(offsets[i] + railH1 * ratios[i] + GAP)
    }
    return { strip, ratios, offsets }
  }, [items, len, metrics])

  const offsetAt = (i: number) =>
    geom.offsets[Math.max(0, Math.min(geom.offsets.length - 1, i))]

  const nearestTo = (target: number) => {
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < geom.strip.length; i++) {
      const d = Math.abs(geom.offsets[i] - target)
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    return best
  }

  const translateX = metrics.contentLeft - offsetAt(car.pos) + dragDelta
  const activePos = dragging ? nearestTo(offsetAt(car.pos) - dragDelta) : car.pos

  // ---- Swipe / drag interaction ----
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // Deliberately do NOT capture the pointer here: capturing on pointerdown
    // swallows the subsequent click on a child link, so a plain click on a card
    // would never navigate. Capture is deferred to onPointerMove, once an actual
    // drag is detected.
    drag.current = { active: true, startX: e.clientX, delta: 0, moved: false, captured: false }
    setDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d.active) return
    d.delta = e.clientX - d.startX
    if (Math.abs(d.delta) > 5) {
      d.moved = true
      if (!d.captured) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
          d.captured = true
        } catch {
          /* noop */
        }
      }
    }
    setDragDelta(d.delta)
  }
  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d.active) return
    d.active = false
    if (d.captured) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* noop */
      }
    }
    const steps = nearestTo(offsetAt(car.pos) - d.delta) - car.pos
    setDragging(false)
    setDragDelta(0)
    if (steps !== 0) car.advance(steps)
  }
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      drag.current.moved = false
    }
  }

  if (len === 0) return null

  return (
    <section aria-roledescription="carousel" aria-label="Latest articles">
      <div
        ref={containerRef}
        className="carousel"
        style={
          {
            '--rail-h1': `${metrics.railH1}px`,
            '--rail-h2': `${metrics.railH2}px`,
            '--carousel-gap': `${GAP}px`,
            '--content-left': `${metrics.contentLeft}px`,
          } as React.CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={onClickCapture}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            car.prev()
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            car.next()
          }
        }}
        onFocusCapture={() => car.setHeld(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) car.setHeld(false)
        }}
      >
        <div
          className={`carousel__track${dragging || !car.animated ? ' carousel__track--static' : ''}`}
          onTransitionEnd={car.onTransitionEnd}
          style={{ transform: `translate3d(${translateX}px,0,0)` }}
        >
          {geom.strip.map((entry, j) => (
            <TickerCard
              key={entry.key}
              item={entry.item}
              ratio={geom.ratios[j]}
              emph={j === activePos}
              index={car.real + 1}
              total={len}
            />
          ))}
        </div>
        <div className="carousel__mist carousel__mist--left" />
        <div className="carousel__mist carousel__mist--right" />
      </div>
    </section>
  )
}
