const { Tag, TopicPill, ArticleCard } = window.BrandingExplainedDesignSystem_24e200;

function IndexPage({ topic, onNavigate }) {
  const D = window.BE_DATA;
  const all = [...D.caseStudies, ...D.insight, ...D.topInspiration];
  return (
    <div style={{ paddingBottom: 96 }}>
      <div style={{ background: "var(--be-paper-deep)", padding: "72px 0 64px" }}>
        <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "0 var(--page-gutter)" }}>
          <p style={{ font: "var(--type-label)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--be-ink-70)", margin: "0 0 16px" }}>Browsing</p>
          <h1 style={{ font: "var(--type-display-1)", color: "var(--be-ink)", margin: 0 }}>{topic || "Insights"}</h1>
          <p style={{ font: "var(--type-body-lg)", color: "var(--be-ink-70)", margin: "20px 0 0", maxWidth: "52ch" }}>
            Case studies, interviews and practical ideas on {(topic || "design").toLowerCase()} — updated as we publish.
          </p>
        </div>
      </div>
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "36px var(--page-gutter) 0" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 44 }}>
          {D.topics.slice(0, 8).map((t) => (
            <TopicPill key={t} size="sm" active={t === topic} onClick={() => onNavigate("index", t)}>{t}</TopicPill>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 32 }}>
          {all.slice(0, 12).map((a, i) => (
            <ArticleCard key={i} title={a.title} date={a.date} tags={a.tags} imageTint={a.tint} ratio="4 / 3" titleSize="md" onClick={(e) => { e.preventDefault(); onNavigate("article"); }} href="#" />
          ))}
        </div>
      </div>
    </div>
  );
}
window.IndexPage = IndexPage;

function SubscribePage({ onNavigate }) {
  const [done, setDone] = React.useState(false);
  const { Button } = window.BrandingExplainedDesignSystem_24e200;
  return (
    <div style={{ minHeight: "72vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px var(--page-gutter)" }}>
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center", background: "var(--be-white)", borderRadius: "var(--radius-card)", padding: "56px 48px", boxShadow: "var(--shadow-card)" }}>
        <p style={{ font: "var(--type-label)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--be-ink-50)", margin: "0 0 18px" }}>Spec Sheet · Newsletter</p>
        <h2 style={{ font: "var(--type-display-2)", margin: 0 }}>{done ? "You're in." : "Join the list."}</h2>
        <p style={{ font: "var(--type-body-lg)", color: "var(--be-ink-70)", margin: "20px 0 32px" }}>
          {done ? "Check your inbox to confirm. First issue lands in two weeks." : "One case study, one practical workflow, and useful ideas about branding, design, and AI — twice a month."}
        </p>
        {!done ? (
          <div style={{ display: "flex", gap: 10, background: "var(--be-paper)", border: "1px solid var(--be-line)", borderRadius: "var(--radius-input)", padding: 8 }}>
            <input placeholder="Enter your email" style={{ flex: 1, border: "none", outline: "none", background: "transparent", font: "var(--type-body)", padding: "8px 12px" }} />
            <Button onClick={() => setDone(true)}>Subscribe</Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => onNavigate("home")} iconRight="arrow-right">Back to reading</Button>
        )}
      </div>
    </div>
  );
}
window.SubscribePage = SubscribePage;
