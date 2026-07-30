import React from 'react'
import Link from 'next/link'

import { Icon } from './ds'
import { CATEGORIES, TAG_OPTIONS, tagSlug } from '@/lib/tags'

/*
 * SiteFooter — ported from the standalone Vite app, with the design's photo
 * background (public/footer-bg.jpg under an ochre wash) and serif tagline.
 * Styling lives in styles/layout.css (.site-footer*).
 *
 * Link columns use the Hub's real nav: Explore = the four categories + Resources
 * (homepage section anchors / /resources), Topics = a sample of taxonomy tags
 * (/tag/[slug]). The mockup's Information column (About/Contact/…) is omitted —
 * those pages don't exist yet.
 */

/** Homepage anchor for a category section (mirrors SiteHeader). */
function categoryAnchor(category: string): string {
  return `/#cat-${category.toLowerCase().replace(/\s+/g, '-')}`
}

const FOOTER_TOPICS = TAG_OPTIONS.slice(0, 8)

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <p className="site-footer__tagline">
          Stay curious.
          <br />
          Make thoughtful things.
        </p>

        <div className="site-footer__rule" />

        <div className="site-footer__cols">
          <div className="site-footer__masthead">
            <p className="site-footer__mark">Designally</p>
            <p className="site-footer__blurb">
              A library of design templates, articles and resources — your creative design ally.
            </p>
            <p className="site-footer__label site-footer__label--social">Social</p>
            <div className="site-footer__social">
              <a className="site-footer__social-link" href="#" aria-label="Facebook">
                <Icon name="facebook" size={18} />
              </a>
              <a className="site-footer__social-link" href="#" aria-label="Instagram">
                <Icon name="instagram" size={18} />
              </a>
              <a className="site-footer__social-link" href="#" aria-label="TikTok">
                <Icon name="music" size={18} />
              </a>
            </div>
          </div>

          <nav aria-label="Explore">
            <p className="site-footer__label">Explore</p>
            <ul className="site-footer__col-list">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link className="site-footer__col-link" href={categoryAnchor(c)}>
                    {c}
                  </Link>
                </li>
              ))}
              <li>
                <Link className="site-footer__col-link" href="/resources">
                  Resources
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Topics">
            <p className="site-footer__label">Topics</p>
            <ul className="site-footer__col-list">
              {FOOTER_TOPICS.map((t) => (
                <li key={t}>
                  <Link className="site-footer__col-link" href={`/tag/${tagSlug(t)}`}>
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="site-footer__base">
          <p className="site-footer__fineprint">
            © {new Date().getFullYear()} Designally. All rights reserved.
          </p>
          <span className="site-footer__locale">EN</span>
        </div>
      </div>
    </footer>
  )
}
