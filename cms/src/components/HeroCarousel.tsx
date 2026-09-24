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
// screen's left edge, and the row runs on past the right one under the mist.
// About MAX_VISIBLE cards share the width; narrower screens show fewer rather
// than shrink them below MIN_UNIT.
const MAX_VISIBLE = 4
const MIN_UNIT = 140
// On a phone, how much of each neighbour shows beside the centred emphasis card.
const PEEK = 40
// Every cover keeps its own shape: one height for the row, and each card as
// wide as its cover makes it. Only a freak — a banner strip, a sliver — is held
// to these bounds, so it cannot take the row over or vanish from it.
const RATIO_MIN = 0.5
const RATIO_MAX = 2.4

/** Covers measured in the browser, by image URL: width over height. */
type Measured = Record<string, number>

/** A cover's width over its height. From the stored dimensions when the Hub
    has them (lib/resources' "w / h"); otherwise from the image itself once it
    has loaded, and a 3:4 placeholder until then. */
const ratioOf = (item: CarouselItem | undefined, measured: Measured): number => {
  let r = 0.75
  if (item?.ratioKnown) {
    const [a, b] = String(item.ratio)
      .split('/')
      .map((n) => parseFloat(n))
    if (a > 0 && b > 0) r = a / b
  } else if (item?.image && measured[item.image]) {
    r = measured[item.image]
  }
  return Math.min(RATIO_MAX, Math.max(RATIO_MIN, r))
}

type Metrics = {
  width: number // of the rail
  railH1: number // height of a passing card
  visible: number
  phone: boolean // the emphasis card centred, rather than led by one card
  emphX: number // where the emphasis card's left edge always sits (desk)
}

/** How tall the row is, and roughly how many cards share the width.

    The row is sized for its AVERAGE cover: as many average cards as fit (up to
    MAX_VISIBLE, none narrower than MIN_UNIT) fill the width, so wider and
    narrower covers even out and the row still runs past the right edge. On a
    phone the emphasis card sits in the middle with PEEK of each neighbour
    either side — sized so even the widest cover's emphasis stays on screen. */
function fitRow(w: number, avg: number, widest: number): Metrics {
  for (let n = MAX_VISIBLE; n > 2; n--) {
    const unit = (w - (n - 1) * GAP) / (n - 1 + EMPH_SCALE)
    if (unit >= MIN_UNIT) {
      return { width: w, railH1: unit / avg, visible: n, phone: false, emphX: unit + GAP }
    }
  }
  const emph = w - 2 * (PEEK + GAP)
  const railH2 = Math.min(emph / avg, (w - 2 * GAP) / widest)
  return { width: w, railH1: railH2 / EMPH_SCALE, visible: 2, phone: true, emphX: 0 }
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
  priority,
}: {
  item: CarouselItem
  emph: boolean
  index: number
  total: number
  ratio: number
  itemLabel: string
  /** The card that holds the emphasis on arrival: the home page's largest
      paint on a phone. Fetched first rather than lazily. */
  priority?: boolean
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
          srcSet={item.imageSrcSet}
          sizes="(max-width: 47.999em) 72vw, 34vw"
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
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

  /* COVERS WITH NO STORED SIZE ARE MEASURED. A cover given as a URL, or an
     upload saved without dimensions, has no ratio on the server, and a guessed
     3:4 box crops a 16:9 picture to a sliver. Each is read once in the
     browser — all of them up front, not as each card scrolls in, so the row
     settles once rather than jumping card by card. */
  const [measured, setMeasured] = React.useState<Measured>({})
  React.useEffect(() => {
    let live = true
    items.forEach((item) => {
      if (item.ratioKnown || !item.image) return
      const src = item.image
      const probe = new Image()
      probe.onload = () => {
        if (!live || !probe.naturalWidth || !probe.naturalHeight) return
        const r = probe.naturalWidth / probe.naturalHeight
        setMeasured((was) => (was[src] === r ? was : { ...was, [src]: r }))
      }
      probe.src = src
    })
    return () => {
      live = false
    }
  }, [items])

  const shape = React.useMemo(() => {
    const ratios = items.map((item) => ratioOf(item, measured))
    return {
      avg: ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0.75,
      widest: ratios.length ? Math.max(...ratios) : 0.75,
      narrowest: ratios.length ? Math.min(...ratios) : 0.75,
    }
  }, [items, measured])
  const [metrics, setMetrics] = React.useState<Metrics>(() => fitRow(1440, shape.avg, shape.widest))

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const measure = () => setMetrics(fitRow(el.clientWidth, shape.avg, shape.widest))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [shape])

  const { width, railH1, visible, phone, emphX } = metrics
  const railH2 = railH1 * EMPH_SCALE
  const gap = GAP
  // Clones either side enough to cover the rail even in the narrowest covers,
  // so the seam is never on screen.
  const clones = Math.max(visible + 1, Math.ceil(width / (railH1 * shape.narrowest + gap)) + 1)
  const car = useCarousel({ count: len, clones, autoAdvanceMs: DWELL })

  /* TWO REASONS TO HOLD STILL, KEPT APART. Focus inside the rail and the
     pointer over it each stop the advance while they last (WCAG 2.2.2: moving
     content stops for whoever is reading it). One flag for both would let the
     pointer leaving release a hold that focus still needs. */
  const [focusHeld, setFocusHeld] = React.useState(false)
  const [hoverHeld, setHoverHeld] = React.useState(false)
  const { setHeld } = car
  React.useEffect(() => setHeld(focusHeld || hoverHeld), [focusHeld, hoverHeld, setHeld])

  /* AN ARROW KEY TAKES FOCUS WITH IT. The emphasis moves to the next card and
     the one that had it becomes aria-hidden and untabbable — with focus still
     on it, a screen reader was left on a card it had just been told to ignore.
     Set on the key press, acted on once the new emphasis has rendered. */
  const keyMoved = React.useRef(false)

  // The server renders a 1440px guess; the first measurement (and any resize)
  // moves the track to new geometry. Snap there in the same render instead of
  // sliding across the page on load.
  const [placedH, setPlacedH] = React.useState(railH1)
  const [placedMeasured, setPlacedMeasured] = React.useState(measured)
  if (placedH !== railH1 || placedMeasured !== measured) {
    setPlacedH(railH1)
    setPlacedMeasured(measured)
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

  /* Where each card starts along the track. The cards before the emphasis are
     all at the passing height, so a card's offset is the sum of the passing
     widths before it; the emphasis card grows into the row after it. */
  const ratios = React.useMemo(() => strip.map((entry) => ratioOf(entry.item, measured)), [strip, measured])
  const offsets = React.useMemo(() => {
    const out = [0]
    ratios.forEach((r, i) => out.push(out[i] + railH1 * r + gap))
    return out
  }, [ratios, railH1, gap])
  const offsetAt = (i: number) => offsets[Math.max(0, Math.min(offsets.length - 1, i))]
  const nearestTo = (target: number) => {
    let best = 0
    for (let i = 1; i < strip.length; i++) {
      if (Math.abs(offsets[i] - target) < Math.abs(offsets[best] - target)) best = i
    }
    return best
  }

  /* THE EMPHASIS HOLDS ITS PLACE. Its left edge is the same spot on every step
     — one average card in from the left on a desk, the middle on a phone — so
     the eye never has to find it again. Covers differ in width, so the card
     before it is whatever fits: a wide one runs off the left edge under the
     mist, a narrow one leaves a sliver of the card before it. */
  const anchor = phone ? (width - railH2 * (ratios[car.pos] ?? shape.avg)) / 2 : emphX
  const translateX = anchor - offsetAt(car.pos) + dragDelta
  const activePos = dragging ? nearestTo(offsetAt(car.pos) - dragDelta) : car.pos

  React.useEffect(() => {
    if (!keyMoved.current) return
    keyMoved.current = false
    containerRef.current
      ?.querySelector<HTMLAnchorElement>('.carousel__card--emph')
      ?.focus({ preventScroll: true })
  }, [car.pos])

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
            keyMoved.current = true
            car.prev()
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            keyMoved.current = true
            car.next()
          }
        }}
        onFocusCapture={() => setFocusHeld(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusHeld(false)
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') setHoverHeld(true)
        }}
        onPointerLeave={() => setHoverHeld(false)}
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
              ratio={ratios[j]}
              emph={j === activePos}
              index={car.real + 1}
              total={len}
              itemLabel={itemLabel}
              priority={entry.key === 'real-0'}
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
