import React from "react";
import { Button, IconButton, Icon } from "../design-system/index.js";
import { BE_DATA } from "../data.js";
import { useNav } from "../useNav.js";

/* Header — sticky masthead.

   Below 64em the four nav items no longer share a line with the wordmark and
   the action cluster, so they move into a drawer. The menu button previously
   toggled state that rendered nothing; it now opens a real panel with
   escape-to-close, focus containment, scroll lock and the topic list, so no
   navigation is desktop-only.

   The nav items lost their chevrons: there is no dropdown behind them, and a
   disclosure affordance that opens nothing is worse on touch than on pointer,
   where at least nothing was hovering. */

function useLockBodyScroll() {
  React.useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
}

function Drawer({ nav, topics, onNavigate, onClose, returnFocusTo }) {
  const panelRef = React.useRef(null);
  const closeRef = React.useRef(null);

  useLockBodyScroll();

  React.useEffect(() => {
    closeRef.current?.focus();
    const restoreTo = returnFocusTo;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      // Keep tabbing inside the panel while it owns the screen.
      const focusables = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      restoreTo?.current?.focus();
    };
  }, [onClose, returnFocusTo]);

  const go = (name, topic) => {
    onNavigate(name, topic);
    onClose();
  };

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Site menu" ref={panelRef}>
        <div className="drawer__head">
          <span className="wordmark" aria-hidden="true">
            Branding
            <br />
            Explained
          </span>
          <button
            type="button"
            className="icon-btn icon-btn--bare icon-btn--md"
            aria-label="Close menu"
            onClick={onClose}
            ref={closeRef}
          >
            <Icon name="x" size={22} />
          </button>
        </div>

        <nav aria-label="Sections">
          <ul className="drawer__list">
            {nav.map((item) => (
              <li key={item}>
                <a
                  className="drawer__link"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    go("index", item);
                  }}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="drawer__label">Topics</p>
        <div className="drawer__topics">
          {topics.slice(0, 8).map((t) => (
            <button key={t} type="button" className="topic-chip" onClick={() => go("index", t)}>
              {t}
            </button>
          ))}
        </div>

        <Button className="drawer__cta" onClick={() => go("subscribe")}>
          Subscribe
        </Button>
      </div>
    </>
  );
}

export function Header() {
  const onNavigate = useNav();
  const { nav, topics } = BE_DATA;
  const [open, setOpen] = React.useState(false);
  const toggleRef = React.useRef(null);

  return (
    <>
      <header className="site-header">
        <div className="shell site-header__bar">
          <a
            className="wordmark"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("home");
            }}
          >
            Branding
            <br />
            Explained
          </a>

          <nav className="site-nav" aria-label="Sections">
            {nav.map((item) => (
              <a
                key={item}
                className="site-nav__link"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("index", item);
                }}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="site-header__actions">
            <Button
              size="sm"
              className="site-header__subscribe"
              onClick={() => onNavigate("subscribe")}
            >
              Subscribe
            </Button>
            <IconButton icon="search" variant="bare" size="sm" label="Search" />
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              ref={toggleRef}
            >
              <Icon name={open ? "x" : "menu"} size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Rendered outside the sticky header so the panel isn't trapped in its
          stacking context. */}
      {open && (
        <Drawer
          nav={nav}
          topics={topics}
          onNavigate={onNavigate}
          onClose={() => setOpen(false)}
          returnFocusTo={toggleRef}
        />
      )}
    </>
  );
}
