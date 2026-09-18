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

const EMPH_SCALE = 1.5 // how much larger the emphasised card is
const GAP = 14
// The rail runs edge to edge: one card before the emphasis card starts at the
// screen's left edge and the last card ends at its right. At most MAX_VISIBLE
// cards share the width; narrower screens drop cards rather than shrink them
// below MIN_UNIT.
const MAX_VISIBLE = 6
const MIN_UNIT = 140
// Every cover takes the same square frame (images crop to it), so the row sums
// to the screen width exactly whichever card holds the emphasis.
const CARD_RATIO = 1
// On a phone, how much of each neighbour shows beside the centred emphasis card.
const PEEK = 40

type Metrics = {
  unit: number // width of a passing card
  visible: number
  gap: number // between cards
  inset: number // where the row starts when the emphasis card leads (phones)
}

/** The most cards (up to MAX_VISIBLE) that fit across `w`, and their width.
    With three or more, the rail runs edge to edge. Narrower (phones), the
    emphasis card sits in the middle with PEEK of each neighbour either side,
    faded by the mists, so the row reads as going both ways. */
function fitRow(w: number): Metrics {
  for (let n = MAX_VISIBLE; n > 2; n--) {
    const unit = (w - (n - 1) * GAP) / (n - 1 + EMPH_SCALE)
    if (unit >= MIN_UNIT) return { unit, visible: n, gap: GAP, inset: 0 }
  }
  const emph = w - 2 * (PEEK + GAP)
  return { unit: emph / EMPH_SCALE, visible: 2, gap: GAP, inset: (w - emph) / 2 }
}

/* A single carousel card. The emphasised card is a real 1.5x taller box and
   reveals its tags + date; passing cards show only image + title. */
function TickerCard({
  item,
  emph,
  index,
  total,
  ratio,
  itemLabel,
}: {
  item: CarouselItem
  emph: boolean
  index: number
  total: number
  ratio: number
  itemLabel: string
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
        {emph && <span className="visually-hidden">{itemLabel.replace('{index}', String(index)).replace('{total}', String(total))}</span>}
        {item.title}
      </span>
      <p className="carousel__date">{item.date}</p>
    </a>
  )
}

export function HeroCarousel({
  items,
  label,
  itemLabel,
}: {
  items: CarouselItem[]
  /** The region's name and the emphasised card's "{index} of {total}" prefix,
      both from the page's dictionary. */
  label: string
  itemLabel: string
}) {
  const DWELL = 5200 // ms each card holds the emphasis slot
  const len = items.length

  const [dragDelta, setDragDelta] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)
  const drag = React.useRef({ active: false, startX: 0, delta: 0, moved: false, captured: false })

  const containerRef = React.useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = React.useState<Metrics>(() => fitRow(1440))

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const measure = () => setMetrics(fitRow(el.clientWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { unit, visible, gap, inset } = metrics
  const railH1 = unit / CARD_RATIO
  const railH2 = railH1 * EMPH_SCALE
  const step = unit + gap
  // A full row of clones either side, so the seam is never on screen.
  const clones = visible + 1
  // The card that just left the emphasis stays on screen to its left. On a
  // phone the emphasis card leads instead, pushed in by `inset` to the middle.
  const lead = visible >= 3 ? 1 : 0

  const car = useCarousel({ count: len, clones, autoAdvanceMs: DWELL })

  // The server renders a 1440px guess; the first measurement (and any resize)
  // moves the track to new geometry. Snap there in the same render instead of
  // sliding across the page on load.
  const [placedUnit, setPlacedUnit] = React.useState(unit)
  if (placedUnit !== unit) {
    setPlacedUnit(unit)
    car.snap()
  }

  const strip = React.useMemo(() => {
    const at = (n: number) => items[((n % len) + len) % len]
    const out: { item: CarouselItem; key: string }[] = []
    for (let i = 0; i < clones; i++) out.push({ item: at(len - clones + i), key: `lead-${i}` })
    items.forEach((item, i) => out.push({ item, key: `real-${i}` }))
    for (let i = 0; i < clones; i++) out.push({ item: at(i), key: `trail-${i}` })
    return out
  }, [items, len, clones])

  // Every slot is the same width, so a card's offset is its index times a step.
  // The emphasis card grows into the room the row leaves for it.
  const offsetAt = (i: number) => i * step
  const nearestTo = (target: number) =>
    Math.max(0, Math.min(strip.length - 1, Math.round(target / step)))

  const translateX = -offsetAt(car.pos - lead) + inset + dragDelta
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
    <section aria-roledescription="carousel" aria-label={label}>
      <div
        ref={containerRef}
        className="carousel"
        style={
          {
            '--rail-h1': `${railH1}px`,
            '--rail-h2': `${railH2}px`,
            '--carousel-gap': `${gap}px`,
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
          className={[
            'carousel__track',
            (dragging || !car.animated) && 'carousel__track--static',
            // The silent loop jump: the emphasis moves from a clone to its real
            // twin in the same frame, so the cards' own grow/shrink must not
            // animate either, or the big card visibly shrinks and regrows.
            !car.animated && 'carousel__track--jump',
          ]
            .filter(Boolean)
            .join(' ')}
          onTransitionEnd={car.onTransitionEnd}
          style={{ transform: `translate3d(${translateX}px,0,0)` }}
        >
          {strip.map((entry, j) => (
            <TickerCard
              key={entry.key}
              item={entry.item}
              ratio={CARD_RATIO}
              emph={j === activePos}
              index={car.real + 1}
              total={len}
              itemLabel={itemLabel}
            />
          ))}
        </div>
        {/* Both edges fade: over the card that just left the emphasis on a
            wide screen, over the neighbour peeking beside it on a phone. */}
        <div className="carousel__mist carousel__mist--left" />
        <div className="carousel__mist carousel__mist--right" />
      </div>
    </section>
  )
}
