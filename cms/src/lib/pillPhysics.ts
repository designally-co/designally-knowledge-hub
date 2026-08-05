/**
 * A small rigid-body simulation for the Topics pill heap.
 *
 * The pills are fully rounded, so each one is modelled as a capsule: a line
 * segment with a radius, which is exactly the shape being drawn. That choice is
 * what makes real toppling affordable here. Capsule contact reduces to the
 * closest points between two segments, which hands back a genuine contact point
 * and normal — and once a contact has a position, it produces torque. Boxes
 * would need full separating-axis tests and manifold generation to get the same
 * thing.
 *
 * So bodies carry orientation and angular velocity as real state. A pill that
 * lands across the end of another rotates about that contact and tips until it
 * finds a second one, instead of balancing where it happens to touch.
 *
 * Contacts are resolved with sequential impulses, and overlap is corrected
 * separately by moving bodies after integration rather than by biasing the
 * velocity solve. Keeping the two apart matters: a penetration bias adds energy
 * that the contact never removes, which leaves resting pills oscillating and
 * the heap permanently awake.
 */

export type Size = { w: number; h: number }

export type Body = {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  omega: number
  /** Half the length of the capsule's core segment; 0 when the pill is a circle. */
  hl: number
  /** Capsule radius — half the pill's height, matching its border radius. */
  r: number
  invM: number
  invI: number
  releaseAt: number
  live: boolean
  /** Frozen: a settled pill stops being integrated until something disturbs it. */
  sleeping: boolean
  /** Where this body was when its stillness window opened, and when that was. */
  refX: number
  refY: number
  refA: number
  refT: number
  /** Deepest contact this body had last frame; a squashed pill must not freeze. */
  deepest: number
}

export type World = {
  bodies: Body[]
  sizes: Size[]
  W: number
  H: number
  t: number
}

type Contact = {
  i: number
  /** -1 for the static world: the floor and the two side walls. */
  j: number
  px: number
  py: number
  /** Separation direction for body i. */
  nx: number
  ny: number
  depth: number
}

export const GRAVITY = 2600 // px/s²
export const SPREAD = 0.94 // fraction of the stage width the pills rain into
export const RELEASE_GAP = 0.055 // seconds between one pill dropping and the next
const DENSITY = 0.00016 // mass per px² — only the ratios between pills matter
const VEL_ITERATIONS = 18 // impulse passes per frame
const POS_ITERATIONS = 10 // position passes that push lingering overlap apart
const POS_CORRECTION = 0.6 // share of remaining penetration removed per pass
const SLEEP_WINDOW = 0.3 // seconds of travel a body is judged over
const SLEEP_TRAVEL = 1.2 // px it may drift across that window and still freeze
const SLEEP_TURN = 0.015 // rad it may turn across that window and still freeze
const WAKE_V = 22 // px/s a neighbour must exceed to disturb a frozen body
const RESTITUTION = 0.04 // pills are cardboard stickers, not bouncy balls
const FRICTION = 0.62 // high enough that a tipped pill stops rather than skating
const SLOP = 0.5 // penetration tolerated before the bias engages
const LINEAR_DAMP = 0.12 // per-second bleed, so nothing drifts for ever
const ANGULAR_DAMP = 1.4 // spin dies faster than travel, or pills look frictionless
export const MAX_THROW = 2600 // px/s cap on a flick
export const STILL_PX = 0.3 // per-frame travel below which the heap counts as still
export const SLEEP_FRAMES = 10

function clamp(v: number, lo: number, hi: number): number {
  return hi < lo ? (lo + hi) / 2 : v < lo ? lo : v > hi ? hi : v
}

/** Small deterministic PRNG, so one seed always produces the same drop. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashLabels(labels: string[]): number {
  const s = labels.join('|')
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * How tall the stage has to be for the finished heap. Pills land across a band
 * SPREAD wide and settle at roughly 0.6 packing — looser than row arithmetic
 * suggests, because a settled heap keeps the gaps it lands with, and because
 * pills that come to rest tilted stand taller than their own height. Nothing
 * clips here by design, so underestimating pokes the pile out of the ceiling.
 */
export function stageHeight(sizes: Size[], W: number): number {
  const area = sizes.reduce((a, s) => a + (s.w + 8) * (s.h + 8), 0)
  const tallest = Math.max(...sizes.map((s) => s.h))
  const band = Math.max(1, W * SPREAD)
  return Math.round(Math.max(190, area / (band * 0.6) + tallest * 1.1))
}

/**
 * Builds the starting state: every pill waits just above the stage and is let go
 * on a stagger, so they rain in one at a time and pile up rather than landing as
 * one slab.
 *
 * Drop columns are dealt out evenly across the width rather than drawn at
 * random. Independent draws cluster, and clustered falling bodies stack instead
 * of spreading the way loose material would, which grows a tower out of the top
 * of the stage.
 */
export function createWorld(sizes: Size[], W: number, seed: number): World {
  const rand = mulberry32(seed)
  const H = stageHeight(sizes, W)
  const n = sizes.length
  const band = Math.max(1, W * SPREAD)
  const left = (W - band) / 2

  const columns = sizes.map((_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[columns[i], columns[j]] = [columns[j], columns[i]]
  }
  // Release order is shuffled separately, so the cloud rains in at random
  // rather than sweeping across the screen.
  const slots = sizes.map((_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[slots[i], slots[j]] = [slots[j], slots[i]]
  }

  const bodies: Body[] = sizes.map((s, i) => {
    const m = DENSITY * s.w * s.h
    // Inertia of the equivalent rectangle. A capsule's true value is a little
    // lower, but the difference is well inside what any of this needs to be.
    const inertia = (m * (s.w * s.w + s.h * s.h)) / 12
    return {
      x: clamp(left + ((columns[i] + 0.5) * band) / n + (rand() - 0.5) * 20, s.w / 2, W - s.w / 2),
      y: -s.h / 2 - 20 - rand() * 40,
      vx: (rand() - 0.5) * 30,
      vy: 0,
      // Only a slight lean and drift of spin on the way down. The tilt in the
      // finished heap should be earned — a pill coming to rest across another's
      // end and tipping — rather than handed out at spawn. Throwing them in
      // spinning hard just leaves labels standing on end, unreadable.
      angle: (rand() - 0.5) * 0.22,
      omega: (rand() - 0.5) * 0.6,
      hl: Math.max(0, (s.w - s.h) / 2),
      r: s.h / 2,
      invM: 1 / m,
      invI: 1 / inertia,
      releaseAt: slots[i] * RELEASE_GAP + rand() * 0.02,
      live: false,
      sleeping: false,
      refX: 0,
      refY: 0,
      refA: 0,
      refT: 0,
      deepest: 0,
    }
  })

  return { bodies, sizes, W, H, t: 0 }
}

/** Closest points between segments p1q1 and p2q2 (Ericson, Real-Time Collision Detection). */
function closestSegments(
  p1x: number, p1y: number, q1x: number, q1y: number,
  p2x: number, p2y: number, q2x: number, q2y: number,
  out: { ax: number; ay: number; bx: number; by: number },
): void {
  const d1x = q1x - p1x, d1y = q1y - p1y
  const d2x = q2x - p2x, d2y = q2y - p2y
  const rx = p1x - p2x, ry = p1y - p2y
  const a = d1x * d1x + d1y * d1y
  const e = d2x * d2x + d2y * d2y
  const f = d2x * rx + d2y * ry
  const EPS = 1e-8

  let s = 0
  let t = 0
  if (a <= EPS && e <= EPS) {
    // Both degenerate: two circles.
  } else if (a <= EPS) {
    t = clamp(f / e, 0, 1)
  } else {
    const c = d1x * rx + d1y * ry
    if (e <= EPS) {
      s = clamp(-c / a, 0, 1)
    } else {
      const b = d1x * d2x + d1y * d2y
      const denom = a * e - b * b
      s = denom !== 0 ? clamp((b * f - c * e) / denom, 0, 1) : 0
      t = (b * s + f) / e
      if (t < 0) {
        t = 0
        s = clamp(-c / a, 0, 1)
      } else if (t > 1) {
        t = 1
        s = clamp((b - c) / a, 0, 1)
      }
    }
  }
  out.ax = p1x + d1x * s
  out.ay = p1y + d1y * s
  out.bx = p2x + d2x * t
  out.by = p2y + d2y * t
}

const seg = { ax: 0, ay: 0, bx: 0, by: 0 }

/** Gathers every contact in the world: pill against pill, and pill against the floor and walls. */
function collect(world: World, contacts: Contact[]): number {
  const { bodies, W, H } = world
  let count = 0

  const push = (c: Contact) => {
    contacts[count++] = c
  }

  for (let i = 0; i < bodies.length; i++) {
    const A = bodies[i]
    if (!A.live) continue
    const ca = Math.cos(A.angle), sa = Math.sin(A.angle)
    const a1x = A.x - ca * A.hl, a1y = A.y - sa * A.hl
    const a2x = A.x + ca * A.hl, a2y = A.y + sa * A.hl

    for (let j = i + 1; j < bodies.length; j++) {
      const B = bodies[j]
      if (!B.live) continue
      // Cheap reject before the segment maths.
      const rr = A.hl + A.r + B.hl + B.r
      if (Math.abs(B.x - A.x) > rr || Math.abs(B.y - A.y) > rr) continue

      const cb = Math.cos(B.angle), sb = Math.sin(B.angle)
      closestSegments(
        a1x, a1y, a2x, a2y,
        B.x - cb * B.hl, B.y - sb * B.hl, B.x + cb * B.hl, B.y + sb * B.hl,
        seg,
      )
      let dx = seg.ax - seg.bx
      let dy = seg.ay - seg.by
      let dist = Math.hypot(dx, dy)
      const rsum = A.r + B.r
      if (dist >= rsum) continue

      if (dist < 1e-6) {
        // Cores exactly coincident: fall back to the line between centres so
        // the pair still has a direction to separate along.
        dx = A.x - B.x
        dy = A.y - B.y
        dist = Math.hypot(dx, dy) || 1
      }
      const nx = dx / dist
      const ny = dy / dist
      push({
        i,
        j,
        // Contact sits midway through the overlap.
        px: seg.ax - nx * (A.r - (rsum - dist) / 2),
        py: seg.ay - ny * (A.r - (rsum - dist) / 2),
        nx,
        ny,
        depth: rsum - dist,
      })
    }

    // Floor and side walls. Both capsule ends are tested, which is what lets a
    // pill rest flat on two contacts instead of pivoting on a single one.
    for (let k = 0; k < 2; k++) {
      const ex = k === 0 ? a1x : a2x
      const ey = k === 0 ? a1y : a2y
      if (A.hl === 0 && k === 1) break

      const floor = ey + A.r - H
      if (floor > 0) push({ i, j: -1, px: ex, py: H, nx: 0, ny: -1, depth: floor })
      const leftPen = A.r - ex
      if (leftPen > 0) push({ i, j: -1, px: 0, py: ey, nx: 1, ny: 0, depth: leftPen })
      const rightPen = ex + A.r - W
      if (rightPen > 0) push({ i, j: -1, px: W, py: ey, nx: -1, ny: 0, depth: rightPen })
    }
  }
  return count
}

const contactPool: Contact[] = []

/**
 * Advances the world one step and returns how far the busiest body moved, which
 * is what the caller uses to decide the heap has stopped. `drag` is the pill
 * held by the pointer: it is driven kinematically, shoving the heap around
 * while nothing can shove it back.
 */
export function stepWorld(world: World, dt: number, drag: number): number {
  const { bodies, W, H } = world
  world.t += dt

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i]
    if (!b.live && world.t >= b.releaseAt) b.live = true
  }

  const linDecay = Math.exp(-LINEAR_DAMP * dt)
  const angDecay = Math.exp(-ANGULAR_DAMP * dt)
  const beforeX: number[] = []
  const beforeY: number[] = []
  const beforeA: number[] = []

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i]
    beforeX[i] = b.x
    beforeY[i] = b.y
    beforeA[i] = b.angle
    b.deepest = 0
    if (!b.live || b.sleeping || i === drag) continue
    b.vy += GRAVITY * dt
    b.vx *= linDecay
    b.vy *= linDecay
    b.omega *= angDecay
  }

  const count = collect(world, contactPool)

  // A frozen pill has to be woken by anything that actually arrives with some
  // speed, or the heap would absorb a thrown pill without reacting.
  for (let c = 0; c < count; c++) {
    const k = contactPool[c]
    const A = bodies[k.i]
    const B = k.j >= 0 ? bodies[k.j] : null
    if (A.deepest < k.depth) A.deepest = k.depth
    if (B && B.deepest < k.depth) B.deepest = k.depth
    if (!B) continue
    const aLively = k.i === drag || (!A.sleeping && Math.hypot(A.vx, A.vy) > WAKE_V)
    const bLively = k.j === drag || (!B.sleeping && Math.hypot(B.vx, B.vy) > WAKE_V)
    if (aLively && B.sleeping) wakeBody(B)
    if (bLively && A.sleeping) wakeBody(A)
  }

  for (let pass = 0; pass < VEL_ITERATIONS; pass++) {
    for (let c = 0; c < count; c++) {
      const k = contactPool[c]
      const A = bodies[k.i]
      const B = k.j >= 0 ? bodies[k.j] : null
      // A held pill is infinitely heavy: it pushes, and nothing pushes back.
      // A frozen one behaves the same way until something wakes it.
      const staticA = k.i === drag || A.sleeping
      const staticB = B ? k.j === drag || B.sleeping : true
      const imA = staticA ? 0 : A.invM
      const iiA = staticA ? 0 : A.invI
      const imB = B && !staticB ? B.invM : 0
      const iiB = B && !staticB ? B.invI : 0
      if (imA === 0 && imB === 0 && iiA === 0 && iiB === 0) continue

      const rax = k.px - A.x, ray = k.py - A.y
      const rbx = B ? k.px - B.x : 0
      const rby = B ? k.py - B.y : 0

      // Velocity of each contact point, spin included.
      const vax = A.vx - A.omega * ray
      const vay = A.vy + A.omega * rax
      const vbx = B ? B.vx - B.omega * rby : 0
      const vby = B ? B.vy + B.omega * rbx : 0
      const rvx = vax - vbx
      const rvy = vay - vby

      const vn = rvx * k.nx + rvy * k.ny
      const raCrossN = rax * k.ny - ray * k.nx
      const rbCrossN = rbx * k.ny - rby * k.nx
      const kn = imA + imB + raCrossN * raCrossN * iiA + rbCrossN * rbCrossN * iiB
      if (kn <= 0) continue

      // No penetration bias here on purpose. Feeding overlap back in as extra
      // separating velocity injects energy the contact never takes out again:
      // a resting pill sinks for a few frames, gets kicked clear, falls back,
      // and repeats forever — a limit cycle that keeps the heap awake and stops
      // it ever settling. Overlap is dealt with after integration instead, by
      // moving bodies rather than by pushing them.
      const target = vn < -40 ? -vn * RESTITUTION : 0
      let jn = (target - vn) / kn
      if (jn < 0) jn = 0 // contacts push, they never pull

      const pnx = jn * k.nx
      const pny = jn * k.ny
      A.vx += pnx * imA
      A.vy += pny * imA
      A.omega += (rax * pny - ray * pnx) * iiA
      if (B) {
        B.vx -= pnx * imB
        B.vy -= pny * imB
        B.omega -= (rbx * pny - rby * pnx) * iiB
      }

      // Friction along the contact tangent. Without it a tipped pill skates
      // instead of catching and coming to rest.
      const tx = -k.ny
      const ty = k.nx
      const vaxF = A.vx - A.omega * ray
      const vayF = A.vy + A.omega * rax
      const vbxF = B ? B.vx - B.omega * rby : 0
      const vbyF = B ? B.vy + B.omega * rbx : 0
      const vt = (vaxF - vbxF) * tx + (vayF - vbyF) * ty
      const raCrossT = rax * ty - ray * tx
      const rbCrossT = rbx * ty - rby * tx
      const kt = imA + imB + raCrossT * raCrossT * iiA + rbCrossT * rbCrossT * iiB
      if (kt <= 0) continue
      let jt = -vt / kt
      const maxF = FRICTION * jn
      jt = clamp(jt, -maxF, maxF)

      const ptx = jt * tx
      const pty = jt * ty
      A.vx += ptx * imA
      A.vy += pty * imA
      A.omega += (rax * pty - ray * ptx) * iiA
      if (B) {
        B.vx -= ptx * imB
        B.vy -= pty * imB
        B.omega -= (rbx * pty - rby * ptx) * iiB
      }
    }
  }

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i]
    if (!b.live || b.sleeping || i === drag) continue
    b.x += b.vx * dt
    b.y += b.vy * dt
    b.angle += b.omega * dt
  }

  // Position correction. Baumgarte alone leaves deep overlap in a crowded heap
  // because it only bleeds penetration away through the velocity solve; these
  // passes move bodies apart directly, recollecting contacts each time so the
  // depths are current. Linear only — nudging angles here would fight the
  // velocity solver for control of how a pill is resting.
  for (let pass = 0; pass < POS_ITERATIONS; pass++) {
    const pc = collect(world, contactPool)
    let worst = 0
    for (let c = 0; c < pc; c++) {
      const k = contactPool[c]
      const A = bodies[k.i]
      const B = k.j >= 0 ? bodies[k.j] : null
      // Frozen bodies are immovable here as well as in the velocity solve. If
      // they were not, this pass would shove a settled pill a fraction of a
      // pixel and the disturbance would wake it straight back up — the heap
      // would never manage to stay asleep.
      const imA = k.i === drag || A.sleeping ? 0 : A.invM
      const imB = B ? (k.j === drag || B.sleeping ? 0 : B.invM) : 0
      const sum = imA + imB
      if (sum <= 0) continue
      const over = k.depth - SLOP
      if (over <= 0) continue
      if (over > worst) worst = over
      const corr = (over * POS_CORRECTION) / sum
      A.x += k.nx * corr * imA
      A.y += k.ny * corr * imA
      if (B) {
        B.x -= k.nx * corr * imB
        B.y -= k.ny * corr * imB
      }
    }
    if (worst <= 0) break
  }

  // Freeze anything that has stopped going anywhere.
  //
  // The test is net travel across a window, not instantaneous velocity, because
  // velocity does not distinguish the two cases that matter. A pill resting on
  // the floor never fully stops: its two ends trade a contact back and forth and
  // it rocks a fraction of a pixel indefinitely, with speeds that flick above
  // any threshold low enough to be meaningful. Measured over a window that
  // rocking has gone nowhere, while a pill genuinely toppling or creeping has
  // moved — which is exactly the distinction wanted.
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i]
    if (!b.live || b.sleeping) continue
    if (i === drag) {
      b.refT = world.t
      b.refX = b.x
      b.refY = b.y
      b.refA = b.angle
      continue
    }
    if (world.t - b.refT < SLEEP_WINDOW) continue
    const travelled = Math.hypot(b.x - b.refX, b.y - b.refY)
    const turned = Math.abs(b.angle - b.refA)
    // Never freeze a body that is still squashed into its neighbours; it has
    // somewhere to go even if it is not going there quickly.
    if (travelled < SLEEP_TRAVEL && turned < SLEEP_TURN && b.deepest < SLOP + 2.5) {
      b.sleeping = true
      b.vx = 0
      b.vy = 0
      b.omega = 0
    }
    b.refT = world.t
    b.refX = b.x
    b.refY = b.y
    b.refA = b.angle
  }

  // A held pill is placed by the pointer, so it can still be driven straight
  // through a wall; the heap around it must not be.
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i]
    if (!b.live) continue
    const reach = b.hl + b.r
    if (b.x < -reach) b.x = -reach
    if (b.x > W + reach) b.x = W + reach
    if (b.y > H + reach) b.y = H + reach
  }

  let drift = 0
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i]
    if (!b.live) {
      drift = Math.max(drift, STILL_PX * 2) // still pills to come; stay awake
      continue
    }
    if (i === drag) continue
    const swept = Math.abs(b.angle - beforeA[i]) * (b.hl + b.r)
    drift = Math.max(drift, Math.abs(b.x - beforeX[i]), Math.abs(b.y - beforeY[i]), swept)
  }
  return drift
}

/** Stops everything dead — used when the heap is put to sleep. */
export function park(world: World): void {
  for (const b of world.bodies) {
    b.vx = 0
    b.vy = 0
    b.omega = 0
    if (b.live) b.sleeping = true
  }
}

export function wakeBody(b: Body): void {
  b.sleeping = false
  b.refT = -1e9 // force a fresh stillness window before it can freeze again
}

/** Rouses the whole heap — used when a pill is grabbed. */
export function wakeAll(world: World): void {
  for (const b of world.bodies) wakeBody(b)
}
