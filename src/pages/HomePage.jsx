import React from "react";
import {
  Button,
  IconButton,
  Tag,
  TopicPill,
  ArticleCard,
  ResourceCard,
  SectionHeading,
  useCarousel,
} from "../design-system/index.js";
import { BE_DATA } from "../data.js";
import { useNav } from "../useNav.js";

/* Cover aspect ratios, as a width-over-height number.

   RATIO_MIN keeps a tall portrait from producing a card too narrow for the
   nowrap tag row; anything narrower than 3:4 crops to 3:4. RATIO_MAX stops a
   panorama from producing an emphasis card wider than the screen. PEEK is the
   slice of the next card that must stay visible, which is what caps the ratio
   on small screens. */
const RATIO_MIN = 0.75; // 3:4
const RATIO_MAX = 1.9; // a shade wider than 16:9
const PEEK = 56;

/* How much taller the emphasised card is than a passing one. The whole size
   morph is this single number. */
const EMPH_SCALE = 1.5;

/* Widest tag pair on an emphasised card (AGENCY + ADVERTISING), and the
   passing-card width floor that keeps a 3:4 emphasised card at least that
   wide so the nowrap tag row never clips. At 1.5x that floor is 146px; at 2x
   it was 112. Above this the cards grow with the viewport up to 160px. */
const TAG_ROW_MIN = 218;
const UNIT_FLOOR = Math.ceil(TAG_ROW_MIN / EMPH_SCALE);

const ratioOf = (item) => {
  const raw = item?.ratio;
  if (typeof raw === "number") return raw;
  const [a, b] = String(raw ?? "3 / 4")
    .split("/")
    .map((n) => parseFloat(n));
  return b > 0 && a > 0 ? a / b : RATIO_MIN;
};

const clampRatio = (r, ratioMax) => Math.min(Math.max(r, RATIO_MIN), ratioMax);

/* A single carousel card. The emphasised card is a real 1.5x taller box (so the
   inter-card gap stays uniform — no transform scaling) and reveals its category
   Tags + date above/below the image; de-emphasised cards are the base height and
   show only image + title.

   Cards share a height and differ in width: `ratio` is the cover image's own
   aspect ratio, so a 16:9 still sits beside a 3:4 portrait on the same
   baseline without either being letterboxed. */
function TickerCard({ item, emph, onOpen, index, total, ratio }) {
  return (
    <a
      href="#"
      onClick={onOpen}
      draggable={false}
      className={`carousel__card${emph ? " carousel__card--emph" : ""}`}
      style={{ "--cover-ratio": ratio }}
      aria-hidden={emph ? undefined : "true"}
      tabIndex={emph ? undefined : -1}
    >
      {/* Category tags — revealed only for the emphasised card, above the image.
          The row holds its height at every state so the images stay on one line
          and nothing reflows as the carousel advances. */}
      <div className="carousel__meta">
        {item.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
      {/* alt="" on purpose: the link's own text already names the article, so
          describing the cover again would announce every card twice. */}
      <img
        className="carousel__image"
        style={{ "--card-tint": item.tint }}
        src={item.image}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      {/* A span, not a heading: these are carousel link labels, and as <h3>s
          they landed above the page's own <h1> in the document outline. */}
      <span className="carousel__title">
        {emph && <span className="visually-hidden">{`Item ${index} of ${total}: `}</span>}
        {item.title}
      </span>
      <p className="carousel__date">{item.date}</p>
    </a>
  );
}

/* InspirationCarousel — an auto-advancing carousel. One card sits in the
   emphasis slot (2nd position: larger, tags + date); after a dwell it slides
   one step so the next card takes that slot. Soft paper "mist" fades both
   edges.

   This component owns geometry only: how wide a card is at this viewport,
   where the content line falls, and how many clones that implies. Index and
   wrap logic live in useCarousel, so the same infinite behaviour is available
   to the resource and lesson rails without a second copy of it.

   The loop is clone-based rather than N-copies-of-everything, and the silent
   reset fires on transitionend rather than a timer that has to restate the CSS
   duration in JavaScript. */
function InspirationCarousel({ items, onOpen }) {
  const GAP = 14;
  const DWELL = 5200; // ms each card holds the emphasis slot
  const len = items.length;

  const [dragDelta, setDragDelta] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const drag = React.useRef({ active: false, startX: 0, delta: 0, moved: false });

  /* Measured geometry. Rail height is the shared constant — h1 for a passing
     card, h2 = EMPH_SCALE x h1 at emphasis — and each card's width is that
     height times its cover's aspect ratio. A phone's emphasis image is ~293px
     tall, a desktop's ~320px, so the composition reads the same at both.

     `clones` is measured too: it's how many cards are actually visible either
     side of the emphasis slot. A phone shows one or two, an ultrawide shows
     ten. Cloning that many — rather than repeating the whole list a fixed
     number of times — is the difference between 16 nodes and 48 on the device
     most of this traffic arrives on. */
  const containerRef = React.useRef(null);
  const [metrics, setMetrics] = React.useState({
    railH1: 213,
    railH2: 320,
    contentLeft: 20,
    ratioMax: RATIO_MAX,
    clones: 4,
  });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const measure = () => {
      const w = el.clientWidth;
      const pageMax =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--page-max")) || 1440;
      const gutter = Math.min(88, Math.max(20, window.innerWidth * 0.05)); // clamp(20px, 5vw, 88px)
      const margin = Math.max((w - pageMax) / 2, 0);
      const contentLeft = margin + gutter;
      // `unit` is the passing 3:4 card width; railH1 is its height. The
      // emphasised card is EMPH_SCALE taller (and, at the same ratio, wider).
      const unit = Math.round(Math.min(160, Math.max(UNIT_FLOOR, w * 0.3)));
      const railH1 = Math.round((unit * 4) / 3);
      const railH2 = Math.round(railH1 * EMPH_SCALE);

      /* A very wide cover cannot show its full ratio on a narrow screen: at
         375px a 16:9 emphasis card would want 532px. Cap the width so one card
         plus a peek of the next always fits, and let the cover crop into it. */
      const maxCardW = Math.max(railH2 * RATIO_MIN, w - contentLeft - PEEK);
      const ratioMax = Math.max(RATIO_MIN, Math.min(RATIO_MAX, maxCardW / railH2));

      /* Clone budget from the narrowest card actually in the set: narrower
         cards mean more of them fit, so this is the conservative count. */
      const narrowest =
        railH1 * Math.min(...items.map((it) => clampRatio(ratioOf(it), ratioMax)));
      const lead = Math.ceil(contentLeft / (narrowest + GAP)) + 1;
      const trail =
        Math.ceil(Math.max(0, w - contentLeft - narrowest * EMPH_SCALE) / (narrowest + GAP)) + 1;
      // Not clamped to the list length: a wide display can need more than one
      // full cycle either side, and the strip builder wraps with a real modulo.
      setMetrics({ railH1, railH2, contentLeft, ratioMax, clones: Math.max(1, lead, trail) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items]);

  const car = useCarousel({ count: len, clones: metrics.clones, autoAdvanceMs: DWELL });

  /* The rendered strip plus its geometry. Keys carry the slot, not the item,
     so React never reuses a node across the silent jump.

     Widths vary per card now, so a card's position is no longer `index x step`
     — it's a prefix sum. `offsets[i]` is card i's left edge with every card at
     its passing width, which is exactly the resting state whenever card i
     holds the emphasis slot (everything before it is passing). */
  const geom = React.useMemo(() => {
    const { clones, railH1, ratioMax } = metrics;
    const at = (n) => items[((n % len) + len) % len];
    const strip = [];
    for (let i = 0; i < clones; i++) strip.push({ item: at(len - clones + i), key: `lead-${i}` });
    items.forEach((item, i) => strip.push({ item, key: `real-${i}` }));
    for (let i = 0; i < clones; i++) strip.push({ item: at(i), key: `trail-${i}` });

    const ratios = strip.map((e) => clampRatio(ratioOf(e.item), ratioMax));
    const offsets = [0];
    for (let i = 0; i < strip.length; i++) {
      offsets.push(offsets[i] + railH1 * ratios[i] + GAP);
    }
    return { strip, ratios, offsets };
  }, [items, len, metrics]);

  // `pos` can briefly sit outside the strip on the render where a resize
  // changed the clone budget but the hook hasn't reconciled it yet.
  const offsetAt = (i) =>
    geom.offsets[Math.max(0, Math.min(geom.offsets.length - 1, i))];

  /** Index whose left edge sits closest to a target track offset. */
  const nearestTo = (target) => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < geom.strip.length; i++) {
      const d = Math.abs(geom.offsets[i] - target);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  };

  const translateX = metrics.contentLeft - offsetAt(car.pos) + dragDelta;

  /* Which card is in the emphasis slot right now. While a finger is down this
     tracks the drag rather than the committed index, so whichever card is
     arriving grows into the slot as you move and the one leaving shrinks out
     of it — the same morph the auto-advance uses, just driven by the finger.
     Without this, nothing changes size until release and the swipe feels dead. */
  const activePos = dragging ? nearestTo(offsetAt(car.pos) - dragDelta) : car.pos;

  // ---- Swipe / drag interaction ----
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { active: true, startX: e.clientX, delta: 0, moved: false };
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.active) return;
    d.delta = e.clientX - d.startX;
    if (Math.abs(d.delta) > 5) d.moved = true;
    setDragDelta(d.delta);
  };
  const endDrag = (e) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    // Land on whichever card's left edge the drag brought closest to the
    // content line — the same rule the live emphasis used, so the card that
    // grew under the finger is the one that stays.
    const steps = nearestTo(offsetAt(car.pos) - d.delta) - car.pos;
    setDragging(false);
    setDragDelta(0);
    if (steps !== 0) car.advance(steps);
  };
  // A drag shouldn't also fire the card's click-through navigation.
  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <section aria-roledescription="carousel" aria-label="Latest inspiration">
      <div
        ref={containerRef}
        className="carousel"
        style={{
          "--rail-h1": `${metrics.railH1}px`,
          "--rail-h2": `${metrics.railH2}px`,
          "--carousel-gap": `${GAP}px`,
          "--content-left": `${metrics.contentLeft}px`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={onClickCapture}
        /* The visible prev/next buttons are gone, so arrow keys carry the
           keyboard path instead. This fires while the emphasised card has
           focus — it's already the only focusable card — so it costs no extra
           tab stop and no visible chrome. */
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            car.prev();
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            car.next();
          }
        }}
        /* Hovering deliberately does not hold the rail — it keeps advancing
           under the pointer. Focus still does: a keyboard user who has tabbed
           to the emphasised card would otherwise have it slide out from under
           them mid-read. */
        onFocusCapture={() => car.setHeld(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) car.setHeld(false);
        }}
      >
        {/* Duration and easing live in CSS; JS only says whether the track is
            currently free-running (a finger is down, or a silent loop jump is
            being applied). The card morph is never switched off — it keeps
            animating through the drag. */}
        <div
          className={`carousel__track${dragging || !car.animated ? " carousel__track--static" : ""}`}
          onTransitionEnd={car.onTransitionEnd}
          style={{ transform: `translate3d(${translateX}px,0,0)` }}
        >
          {geom.strip.map((entry, j) => (
            <TickerCard
              key={entry.key}
              item={entry.item}
              ratio={geom.ratios[j]}
              emph={j === activePos}
              onOpen={onOpen}
              index={car.real + 1}
              total={len}
            />
          ))}
        </div>
        {/* The preceding cards dissolve into the paper toward the screen's left
            edge; the fade ends exactly at the content line so the emphasised
            card stays crisp. */}
        <div className="carousel__mist carousel__mist--left" />
        <div className="carousel__mist carousel__mist--right" />
      </div>
    </section>
  );
}

export function HomePage() {
  const onNavigate = useNav();
  const D = BE_DATA;
  const open = (e) => {
    if (e) e.preventDefault();
    onNavigate("article");
  };

  return (
    <div>
      {/* ---- Top inspiration (full-bleed) ---- */}
      <InspirationCarousel items={D.topInspiration} onOpen={open} />

      {/* ---- Editorial line + topics (full-bleed, like the carousel) ---- */}
      <div className="editorial-line">
        <h1 className="editorial-line__lede">
          <span className="editorial-line__lede-fit">Learn how better brands are built.</span>
        </h1>
        <div className="editorial-line__topics">
          {D.featuredTopics.map((t) => (
            <button
              key={t}
              type="button"
              className="topic-chip"
              onClick={() => onNavigate("index", t)}
            >
              {t}
            </button>
          ))}
          <Button
            variant="secondary"
            size="sm"
            iconRight="arrow-right"
            className="btn--chip"
            onClick={() => onNavigate("index", "Topics")}
          >
            See all topics
          </Button>
        </div>
      </div>

      {/* ---- Hero band ---- */}
      <div className="band band--hero">
        <div className="shell">
          <ArticleCard
            layout="overlay"
            ratio="21 / 9"
            ratioMobile="4 / 3"
            title={D.hero.title}
            date={D.hero.date}
            tags={D.hero.tags}
            image={D.hero.image}
            imageTint={D.hero.tint}
            onClick={open}
            href="#"
          />
        </div>
      </div>

      {/* ---- Case Studies ---- */}
      <div className="shell section-gap">
        <SectionHeading
          action="arrow"
          onArrow={() => onNavigate("index", "Case Studies")}
          className="grid-head"
        >
          Case Studies
        </SectionHeading>
        <div className="card-grid card-grid--4">
          {D.caseStudies.map((a) => (
            <ArticleCard
              key={a.title}
              title={a.title}
              date={a.date}
              tags={a.tags}
              image={a.image}
              imageTint={a.tint}
              ratio="4 / 3"
              onClick={open}
              href="#"
            />
          ))}
        </div>
        <div className="promo promo--connect">
          <p className="promo__line">Design is better when ideas connect.</p>
          <Button variant="inverse" onClick={() => onNavigate("subscribe")}>
            Join now
          </Button>
        </div>
      </div>

      {/* ---- Insight ---- */}
      <div className="band band--insight">
        <div className="shell">
          <SectionHeading
            action="arrow"
            onArrow={() => onNavigate("index", "Insights")}
            className="grid-head"
          >
            Insight
          </SectionHeading>
          <div className="insight-grid">
            <div className="insight-grid__feature">
              <ArticleCard
                title={D.insight[1].title}
                date={D.insight[1].date}
                tags={D.insight[1].tags}
                image={D.insight[1].image}
                imageTint={D.insight[1].tint}
                ratio="1 / 1"
                ratioMobile="4 / 3"
                titleSize="md"
                onClick={open}
                href="#"
              />
            </div>
            {[0, 2, 3, 4].map((idx) => (
              <ArticleCard
                key={D.insight[idx].title}
                title={D.insight[idx].title}
                date={D.insight[idx].date}
                tags={D.insight[idx].tags}
                image={D.insight[idx].image}
                imageTint={D.insight[idx].tint}
                ratio={idx === 0 || idx === 2 ? "16 / 10" : "4 / 3"}
                onClick={open}
                href="#"
              />
            ))}
          </div>
        </div>
      </div>

      {/* ---- Dark video promo ---- */}
      <div className="band band--video on-dark">
        <div className="shell">
          <div className="video-promo__frames" aria-hidden="true">
            {["#20321f", "#3a1230", "#101826"].map((c, i) => (
              <div
                key={c}
                className={`video-promo__frame${i === 1 ? " video-promo__frame--lifted" : ""}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <p className="video-promo__kicker">Watch · Learn · Try</p>
          <h2 className="video-promo__title">
            Fresh design ideas,
            <br />
            made simple.
          </h2>
          <p className="video-promo__body">
            Follow Branding Explained for short videos about branding, design, creative
            tools, AI, and new technology.
          </p>
          <div className="video-promo__actions">
            <Button variant="inverse" icon="instagram">
              Instagram
            </Button>
            <Button variant="inverse" icon="music">
              TikTok
            </Button>
          </div>
          <p className="video-promo__note">New videos every week.</p>
        </div>
      </div>

      {/* ---- Workflows ---- */}
      <div className="band band--workflows">
        <div className="shell">
          <SectionHeading
            action="arrow"
            onArrow={() => onNavigate("index", "Workflows")}
            className="grid-head"
          >
            Workflows
          </SectionHeading>
          <div className="workflows">
            <ArticleCard
              title={D.workflow.title}
              date={D.workflow.date}
              tags={D.workflow.tags}
              image={D.workflow.image}
              imageTint={D.workflow.tint}
              ratio={D.workflow.ratio}
              titleSize="md"
              onClick={open}
              href="#"
            />
            <div className="workflows__list">
              {D.caseStudies.slice(0, 3).map((a) => (
                <a key={a.title} className="workflows__item" href="#" onClick={open}>
                  <span className="workflows__thumb" style={{ "--card-tint": a.tint }} />
                  <span>
                    <Tag>Workflow</Tag>
                    <span className="workflows__item-title">{a.title}</span>
                  </span>
                </a>
              ))}
              <a
                className="workflows__cta"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("index", "Workflows");
                }}
              >
                <span className="workflows__cta-label">WORKFLOW</span>
                <IconButton icon="arrow-right" variant="ghost" label="Browse workflows" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Topics ---- */}
      <div className="band band--topics">
        <div className="shell">
          <h2 className="band__title">Topics</h2>
          <div className="topic-cloud">
            {D.topics.map((t, i) => (
              <TopicPill
                key={t}
                rotate={[-3, 2, -1, 3, 0, -2, 1, -3, 2, 0, -2, 3][i % 12]}
                onClick={() => onNavigate("index", t)}
              >
                {t}
              </TopicPill>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Resources ---- */}
      <div className="shell section-gap">
        <SectionHeading
          actionLabel="See all resources"
          onArrow={() => onNavigate("index", "Resources")}
          className="grid-head"
        >
          Resources
        </SectionHeading>
        <div className="card-grid card-grid--4">
          {D.resources.map((r) => (
            <ResourceCard
              key={r.title}
              title={r.title}
              date={r.date}
              tags={r.tags}
              color={r.color}
              onClick={open}
              href="#"
            />
          ))}
        </div>
      </div>

      {/* ---- Summit promo ---- */}
      <div className="shell section-gap">
        <div className="promo promo--summit">
          <div>
            <p className="promo__title">Can stories save us?</p>
            <p className="promo__sub">
              Speakers from Adobe, ustwo Games, YouTube, and Arcadis.
            </p>
          </div>
          <div className="promo__aside">
            <p className="promo__kicker">
              STORYTELLING
              <br />
              SUMMIT
            </p>
            <Button variant="inverse" iconRight="arrow-right">
              Find out more
            </Button>
          </div>
        </div>
      </div>

      {/* ---- Newsletter ---- */}
      <div className="band band--newsletter">
        <div className="shell">
          <div className="newsletter">
            <div>
              <p className="newsletter__kicker">Spec Sheet · Newsletter</p>
              <h2 className="newsletter__title">
                Better design thinking,
                <br />
                twice a month.
              </h2>
            </div>
            <div>
              <p className="newsletter__body">
                One case study, one practical workflow, and useful ideas about branding,
                design, and AI.
              </p>
              <div className="email-field">
                <label className="visually-hidden" htmlFor="home-newsletter-email">
                  Email address
                </label>
                <input
                  id="home-newsletter-email"
                  className="email-field__input"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                />
                <Button onClick={() => onNavigate("subscribe")}>Subscribe</Button>
              </div>
              <p className="newsletter__fineprint">No spam. Unsubscribe at any time.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Stay curious ---- */}
      <div className="band band--closing">
        <div className="shell">
          <h2 className="closing-line">
            Stay curious.
            <br />
            Make thoughtful things.
          </h2>
        </div>
      </div>
    </div>
  );
}
