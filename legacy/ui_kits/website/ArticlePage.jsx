const { Button, Tag, IconButton, ArticleCard, SectionHeading } =
  window.BrandingExplainedDesignSystem_24e200;

function ArticlePage({ onNavigate }) {
  const D = window.BE_DATA;
  const S = { maxWidth: 820, margin: "0 auto", padding: "0 var(--page-gutter)" };
  return (
    <article style={{ paddingTop: 48, paddingBottom: 96 }}>
      <div style={S}>
        <button onClick={() => onNavigate("home")} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", font: "var(--type-nav)", color: "var(--be-ink-50)", padding: 0, marginBottom: 28 }}>
          <IconButton icon="arrow-left" size="sm" variant="outline" style={{ width: 34, height: 34 }} /> Back to home
        </button>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          <Tag>Inspiration</Tag><Tag>Graphic Design</Tag>
        </div>
        <h1 style={{ font: "var(--type-title-lg)", color: "var(--be-ink)", margin: 0, letterSpacing: "var(--tracking-tight)" }}>
          There's a spirit in everything and Maki Yamaguchi is vividly bringing them to life
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "26px 0 0" }}>
          <div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--be-paper-deep)" }} />
          <p style={{ font: "var(--type-meta)", color: "var(--be-ink-50)", margin: 0 }}>By Naomi Reeves · 16 July 2026 · 6 min read</p>
        </div>
      </div>
      <div style={{ maxWidth: "var(--page-max)", margin: "36px auto 0", padding: "0 var(--page-gutter)" }}>
        <div style={{ width: "100%", aspectRatio: "16 / 8", borderRadius: "var(--radius-hero)", background: "#1c2733" }} />
      </div>
      <div style={{ ...S, marginTop: 48 }}>
        <p style={{ font: "var(--type-body-lg)", color: "var(--be-ink)", margin: "0 0 24px" }}>
          Maki Yamaguchi paints the interior lives of ordinary objects — a desk lamp mid-thought, a kettle holding its breath. The work is warm, a little uncanny, and entirely sincere.
        </p>
        <p style={{ font: "var(--type-body-lg)", color: "var(--be-ink-70)", margin: "0 0 24px" }}>
          We spoke to Yamaguchi about animism as a design tool, why restraint reads as confidence, and how a personal illustration practice quietly reshaped an entire brand system.
        </p>
        <figure style={{ margin: "40px 0", borderLeft: "3px solid var(--be-rust)", paddingLeft: 28 }}>
          <blockquote style={{ font: "var(--type-display-2)", fontSize: "clamp(26px,3vw,38px)", color: "var(--be-ink)", margin: 0 }}>
            "If you treat every object as if it has a spirit, you stop designing at things and start designing with them."
          </blockquote>
        </figure>
        <p style={{ font: "var(--type-body-lg)", color: "var(--be-ink-70)", margin: "0 0 24px" }}>
          That principle runs through the identity work: soft grotesque type, a warm paper palette, and spot colours borrowed straight from the illustrations rather than a brand deck.
        </p>
      </div>
      <div style={{ maxWidth: "var(--page-max)", margin: "72px auto 0", padding: "0 var(--page-gutter)" }}>
        <SectionHeading action="arrow" onArrow={() => onNavigate("index", "Insights")}>More like this</SectionHeading>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 28, marginTop: 36 }}>
          {D.caseStudies.map((a, i) => (
            <ArticleCard key={i} title={a.title} date={a.date} tags={a.tags} imageTint={a.tint} ratio="4 / 3" onClick={(e) => { e.preventDefault(); onNavigate("article"); }} href="#" />
          ))}
        </div>
      </div>
    </article>
  );
}
window.ArticlePage = ArticlePage;
