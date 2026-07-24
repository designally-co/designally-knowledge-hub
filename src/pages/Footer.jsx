import React from "react";
import { Icon } from "../design-system/index.js";
import { useNav } from "../useNav.js";

/* Footer — four columns on desktop, two at 36em, one on phones.

   Note for the colour pass: paper text on the ochre band measures 2.55:1 and
   still fails WCAG AA. The per-element opacity that made it worse (labels at
   1.81:1, the fineprint at 1.98:1) is gone, but the band itself needs a
   darker value or ink text. See /impeccable colorize. */

function FootCol({ label, links, onNavigate }) {
  return (
    <div>
      <p className="site-footer__label">{label}</p>
      <ul className="site-footer__col-list">
        {links.map((l) => (
          <li key={l}>
            <a
              className="site-footer__col-link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.("index", l);
              }}
            >
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const onNavigate = useNav();

  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <div className="site-footer__rule" />

        <div className="site-footer__cols">
          <div className="site-footer__masthead">
            <p className="site-footer__mark">
              Branding
              <br />
              Explained
            </p>
            <p className="site-footer__blurb">
              A publication about how brands, interfaces, and creative systems are
              researched, designed, and built.
            </p>
            <p className="site-footer__label site-footer__label--social">Social</p>
            <div className="site-footer__social">
              {[
                ["facebook", "Facebook"],
                ["instagram", "Instagram"],
                ["music", "TikTok"],
              ].map(([ic, name]) => (
                <a
                  key={ic}
                  className="site-footer__social-link"
                  href="#"
                  aria-label={name}
                  onClick={(e) => e.preventDefault()}
                >
                  <Icon name={ic} size={18} />
                </a>
              ))}
            </div>
          </div>

          <FootCol
            label="Explore"
            links={["Case Studies", "Insights", "Workflows", "Resources"]}
            onNavigate={onNavigate}
          />
          <FootCol
            label="Topics"
            links={["Branding", "UX/UI", "Typography", "AI & Design", "Figma"]}
            onNavigate={onNavigate}
          />
          <FootCol
            label="Information"
            links={["About", "Authors", "Contact", "Editorial Policy", "Newsletter Archive"]}
            onNavigate={onNavigate}
          />
        </div>

        <div className="site-footer__base">
          <p className="site-footer__fineprint">
            © 2026 Branding Explained. All rights reserved.
          </p>
          {/* Decorative locale badge, kept as-is. It is a <span>, not a
              control, so nothing here promises an interaction — but PRODUCT.md
              puts localisation out of v1 scope entirely, so it has nothing to
              indicate either. Flagged for /impeccable harden. */}
          <span className="site-footer__locale">
            🇬🇧 EN <Icon name="chevron-down" size={14} />
          </span>
        </div>
      </div>
    </footer>
  );
}
