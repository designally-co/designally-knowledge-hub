const { Button, IconButton, Icon } = window.BrandingExplainedDesignSystem_24e200;

function Wordmark({ onDark, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 19, lineHeight: 1.02, letterSpacing: "0.01em", textTransform: "uppercase", color: onDark ? "var(--be-paper)" : "var(--be-ink)" }}>
      Branding<br />Explained
    </button>
  );
}

function Header({ onNavigate }) {
  const { nav } = window.BE_DATA;
  const [open, setOpen] = React.useState(false);
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(244,235,225,0.86)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderBottom: "1px solid var(--be-line)" }}>
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "0 var(--page-gutter)", height: 82, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <Wordmark onClick={() => onNavigate("home")} />
        <nav style={{ display: "flex", alignItems: "center", gap: 30 }}>
          {nav.map((item) => (
            <a key={item} href="#" onClick={(e) => { e.preventDefault(); onNavigate("index", item); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "var(--type-nav)", color: "var(--be-ink)", textDecoration: "none" }}>
              {item}
              <Icon name="chevron-down" size={16} strokeWidth={2.5} />
            </a>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button size="sm" onClick={() => onNavigate("subscribe")}>Subscribe</Button>
          <IconButton icon="search" variant="ghost" size="sm" />
          <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--be-ink)" }}>
            <Icon name={open ? "x" : "menu"} size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
window.Header = Header;
window.Wordmark = Wordmark;
