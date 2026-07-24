const { Icon } = window.BrandingExplainedDesignSystem_24e200;

function FootCol({ label, links, onNavigate }) {
  return (
    <div>
      <p style={{ font: "var(--type-label)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "rgba(244,237,227,0.6)", margin: "0 0 20px" }}>{label}</p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        {links.map((l) => (
          <li key={l}><a href="#" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate("index", l); }}
            style={{ font: "700 20px/1 var(--font-sans)", color: "var(--be-paper)", textDecoration: "none" }}>{l}</a></li>
        ))}
      </ul>
    </div>
  );
}

function Footer({ onNavigate }) {
  return (
    <footer style={{ background: "var(--be-band-ochre)", color: "var(--be-paper)", position: "relative" }}>
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "72px var(--page-gutter) 40px" }}>
        <div style={{ borderTop: "1px solid rgba(244,237,227,0.35)", marginBottom: 56 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40 }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: 34, lineHeight: 1.05, textTransform: "uppercase", letterSpacing: "0.01em", margin: "0 0 24px" }}>Branding<br />Explained</p>
            <p style={{ font: "700 21px/1.35 var(--font-sans)", maxWidth: "22ch", margin: 0 }}>A publication about how brands, interfaces, and creative systems are researched, designed, and built.</p>
            <p style={{ font: "var(--type-label)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "rgba(244,237,227,0.6)", margin: "40px 0 16px" }}>Social</p>
            <div style={{ display: "flex", gap: 14 }}>
              {["facebook", "instagram", "music"].map((ic) => (
                <a key={ic} href="#" onClick={(e) => e.preventDefault()} style={{ width: 44, height: 44, borderRadius: 999, border: "1.5px solid rgba(244,237,227,0.7)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--be-paper)" }}>
                  <Icon name={ic} size={18} />
                </a>
              ))}
            </div>
          </div>
          <FootCol label="Explore" links={["Case Studies", "Insights", "Workflows", "Resources"]} onNavigate={onNavigate} />
          <FootCol label="Topics" links={["Branding", "UX/UI", "Typography", "AI & Design", "Figma"]} onNavigate={onNavigate} />
          <FootCol label="Information" links={["About", "Authors", "Contact", "Editorial Policy", "Newsletter Archive"]} onNavigate={onNavigate} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 72 }}>
          <p style={{ font: "var(--type-body-sm)", color: "rgba(244,237,227,0.7)", margin: 0 }}>© 2026 Branding Explained. All rights reserved.</p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--be-white)", color: "var(--be-ink)", borderRadius: 10, padding: "8px 14px", font: "700 14px/1 var(--font-sans)" }}>🇬🇧 EN <Icon name="chevron-down" size={14} color="var(--be-ink)" /></span>
        </div>
      </div>
    </footer>
  );
}
window.Footer = Footer;
