const { Button, IconButton, Tag, TopicPill, ArticleCard, ResourceCard, SectionHeading } =
  window.BrandingExplainedDesignSystem_24e200;

const Section = ({ children, style }) => (
  <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "0 var(--page-gutter)", ...style }}>{children}</div>
);

function Carousel({ items, onOpen }) {
  return (
    <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(232px, 232px)", gap: 24, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
      {items.map((a, i) => (
        <ArticleCard key={i} title={a.title} date={a.date} tags={a.tags} imageTint={a.tint} ratio={a.ratio || "3 / 4"} onClick={onOpen} href="#" />
      ))}
    </div>
  );
}

function HomePage({ onNavigate }) {
  const D = window.BE_DATA;
  const open = (e) => { if (e) e.preventDefault(); onNavigate("article"); };

  return (
    <div>
      {/* ---- Top inspiration + editorial line ---- */}
      <Section style={{ paddingTop: 40 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          <Tag>Inspiration</Tag><Tag>Graphic Design</Tag>
        </div>
        <Carousel items={D.topInspiration} onOpen={open} />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, margin: "56px 0 8px", flexWrap: "wrap" }}>
          <h1 style={{ font: "var(--type-display-2)", color: "var(--be-ink-50)", margin: 0, maxWidth: "16ch" }}>Learn how better brands are built.</h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, maxWidth: 560, justifyContent: "flex-end" }}>
            {D.topics.slice(0, 9).map((t) => (
              <span key={t} style={{ padding: "9px 18px", border: "1px solid var(--border-tag)", borderRadius: 999, font: "700 15px/1 var(--font-sans)" }}>{t}</span>
            ))}
            <Button variant="secondary" size="sm" iconRight="arrow-right" onClick={() => onNavigate("index", "Topics")}>See all topics</Button>
          </div>
        </div>
      </Section>

      {/* ---- Hero band ---- */}
      <div style={{ background: "var(--be-paper-deep)", marginTop: 40, padding: "80px 0 88px" }}>
        <Section>
          <ArticleCard layout="overlay" ratio="21 / 9" title={D.hero.title} date={D.hero.date} tags={D.hero.tags} imageTint={D.hero.tint} onClick={open} href="#" />
        </Section>
      </div>

      {/* ---- Case Studies ---- */}
      <Section style={{ paddingTop: "var(--section-gap)" }}>
        <SectionHeading action="arrow" onArrow={() => onNavigate("index", "Case Studies")}>Case Studies</SectionHeading>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 28, marginTop: 36 }}>
          {D.caseStudies.map((a, i) => (
            <ArticleCard key={i} title={a.title} date={a.date} tags={a.tags} imageTint={a.tint} ratio="4 / 3" onClick={open} href="#" />
          ))}
        </div>
        <div style={{ background: "var(--be-cobalt)", borderRadius: "var(--radius-card)", marginTop: 48, padding: "30px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <p style={{ font: "800 26px/1.1 var(--font-sans)", letterSpacing: "0.01em", textTransform: "uppercase", color: "#fff", margin: 0 }}>Design is better when ideas connect.</p>
          <Button variant="inverse" onClick={() => onNavigate("subscribe")}>Join now</Button>
        </div>
      </Section>

      {/* ---- Insight ---- */}
      <div style={{ background: "var(--be-band-lavender)", marginTop: "var(--section-gap)", padding: "72px 0 88px" }}>
        <Section>
          <SectionHeading action="arrow" onArrow={() => onNavigate("index", "Insights")}>Insight</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gridAutoRows: "auto", gap: 28, marginTop: 36 }}>
            <div style={{ gridColumn: "span 2", gridRow: "span 2" }}>
              <ArticleCard title={D.insight[1].title} date={D.insight[1].date} tags={D.insight[1].tags} imageTint={D.insight[1].tint} ratio="1 / 1" titleSize="md" onClick={open} href="#" />
            </div>
            <ArticleCard title={D.insight[0].title} date={D.insight[0].date} tags={D.insight[0].tags} imageTint={D.insight[0].tint} ratio="16 / 10" onClick={open} href="#" />
            <ArticleCard title={D.insight[2].title} date={D.insight[2].date} tags={D.insight[2].tags} imageTint={D.insight[2].tint} ratio="16 / 10" onClick={open} href="#" />
            <ArticleCard title={D.insight[3].title} date={D.insight[3].date} tags={D.insight[3].tags} imageTint={D.insight[3].tint} ratio="4 / 3" onClick={open} href="#" />
            <ArticleCard title={D.insight[4].title} date={D.insight[4].date} tags={D.insight[4].tags} imageTint={D.insight[4].tint} ratio="4 / 3" onClick={open} href="#" />
          </div>
        </Section>
      </div>

      {/* ---- Dark video promo ---- */}
      <div style={{ background: "var(--be-band-black)", padding: "56px 0 96px", textAlign: "center" }}>
        <Section>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 40 }}>
            {["#20321f", "#3a1230", "#101826"].map((c, i) => (
              <div key={i} style={{ width: 210, height: 380, borderRadius: 26, background: c, transform: i === 1 ? "translateY(-24px)" : "none", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)" }} />
            ))}
          </div>
          <p style={{ font: "var(--type-label)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--be-paper)", margin: "0 0 22px" }}>Watch · Learn · Try</p>
          <h2 style={{ font: "var(--type-display-2)", color: "var(--be-paper)", margin: 0 }}>Fresh design ideas,<br />made simple.</h2>
          <p style={{ font: "700 19px/1.5 var(--font-sans)", color: "var(--be-paper)", maxWidth: "34ch", margin: "26px auto 32px" }}>Follow Branding Explained for short videos about branding, design, creative tools, AI, and new technology.</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
            <Button variant="inverse" icon="instagram">Instagram</Button>
            <Button variant="inverse" icon="music">TikTok</Button>
          </div>
          <p style={{ font: "var(--type-meta)", color: "var(--text-on-dark-dim)", marginTop: 30 }}>New videos every week.</p>
        </Section>
      </div>

      {/* ---- Workflows ---- */}
      <div style={{ background: "var(--be-band-mint)", padding: "72px 0 var(--section-gap)" }}>
        <Section>
          <SectionHeading action="arrow" onArrow={() => onNavigate("index", "Workflows")}>Workflows</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40, marginTop: 36, alignItems: "start" }}>
            <ArticleCard title="The act of 'making' is at the heart of APFEL's exhibition graphics for V&A East Museum" date="10 June 2026" tags={["Workflow"]} imageTint="#c94a1e" ratio="16 / 9" titleSize="md" onClick={open} href="#" />
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {D.caseStudies.slice(0, 3).map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 16 }} onClick={open}>
                  <div style={{ width: 96, height: 72, borderRadius: 6, background: a.tint, flex: "none" }} />
                  <div>
                    <div style={{ marginBottom: 8 }}><Tag>Workflow</Tag></div>
                    <p style={{ font: "700 15px/1.3 var(--font-sans)", margin: 0, cursor: "pointer" }}>{a.title}</p>
                  </div>
                </div>
              ))}
              <div style={{ background: "var(--be-green)", borderRadius: "var(--radius-card)", padding: "26px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ font: "800 34px/1 var(--font-sans)", color: "#fff", letterSpacing: "0.01em" }}>WORKFLOW</span>
                <IconButton icon="arrow-right" variant="ghost" />
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* ---- Topics ---- */}
      <div style={{ background: "linear-gradient(180deg, var(--be-band-mint), var(--be-band-butter))", padding: "72px 0 88px" }}>
        <Section>
          <h2 style={{ font: "var(--type-section)", color: "var(--be-ink)", textAlign: "center", margin: "0 0 40px" }}>Topics</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", maxWidth: 900, margin: "0 auto" }}>
            {D.topics.map((t, i) => (
              <TopicPill key={t} rotate={[-3, 2, -1, 3, 0, -2, 1, -3, 2, 0, -2, 3][i % 12]} onClick={() => onNavigate("index", t)}>{t}</TopicPill>
            ))}
          </div>
        </Section>
      </div>

      {/* ---- Resources ---- */}
      <Section style={{ paddingTop: "var(--section-gap)" }}>
        <SectionHeading actionLabel="See all resources" onArrow={() => onNavigate("index", "Resources")}>Resources</SectionHeading>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 28, marginTop: 36 }}>
          {D.resources.map((r, i) => (
            <ResourceCard key={i} title={r.title} date={r.date} tags={r.tags} color={r.color} onClick={open} href="#" />
          ))}
        </div>
      </Section>

      {/* ---- Summit promo ---- */}
      <Section style={{ paddingTop: "var(--section-gap)" }}>
        <div style={{ background: "var(--be-orange)", borderRadius: "var(--radius-card)", padding: "34px 44px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <p style={{ font: "800 40px/1 var(--font-sans)", color: "var(--be-paper)", margin: 0 }}>Can stories save us?</p>
            <p style={{ font: "700 16px/1.4 var(--font-sans)", color: "var(--be-paper)", margin: "12px 0 0" }}>Speakers from Adobe, ustwo Games, YouTube, and Arcadis.</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ font: "800 22px/1 var(--font-sans)", color: "var(--be-paper)", margin: "0 0 14px", letterSpacing: "0.02em" }}>STORYTELLING<br />SUMMIT</p>
            <Button variant="inverse" iconRight="arrow-right">Find out more</Button>
          </div>
        </div>
      </Section>

      {/* ---- Newsletter ---- */}
      <div style={{ background: "var(--be-band-mint)", marginTop: "var(--section-gap)", padding: "80px 0" }}>
        <Section>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 48, alignItems: "center" }}>
            <div>
              <p style={{ font: "var(--type-label)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", margin: "0 0 22px" }}>Spec Sheet · Newsletter</p>
              <h2 style={{ font: "var(--type-display-2)", margin: 0 }}>Better design thinking,<br />twice a month.</h2>
            </div>
            <div>
              <p style={{ font: "700 22px/1.4 var(--font-sans)", margin: "0 0 28px" }}>One case study, one practical workflow, and useful ideas about branding, design, and AI.</p>
              <div style={{ display: "flex", gap: 10, background: "var(--be-white)", border: "1px solid var(--be-line)", borderRadius: "var(--radius-input)", padding: 8, maxWidth: 460 }}>
                <input placeholder="Enter your email" style={{ flex: 1, border: "none", outline: "none", background: "transparent", font: "var(--type-body)", padding: "8px 12px", color: "var(--be-ink)" }} />
                <Button onClick={() => onNavigate("subscribe")}>Subscribe</Button>
              </div>
              <p style={{ font: "var(--type-body-sm)", color: "var(--be-ink-50)", margin: "14px 0 0" }}>No spam. Unsubscribe at any time.</p>
            </div>
          </div>
        </Section>
      </div>

      {/* ---- Stay curious ---- */}
      <div style={{ background: "var(--be-paper-deep)", padding: "88px 0", textAlign: "center" }}>
        <h2 style={{ font: "var(--type-display-1)", color: "var(--be-ink)", margin: 0 }}>Stay curious.<br />Make thoughtful things.</h2>
      </div>
    </div>
  );
}
window.HomePage = HomePage;
