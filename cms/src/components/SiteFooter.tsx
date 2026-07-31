import React from 'react'
import Link from 'next/link'

import { Icon } from './ds'
import { LocaleSwitcher } from './LocaleSwitcher'
import { CATEGORIES, TAG_OPTIONS, tagSlug } from '@/lib/tags'
import {
  categoryLabel,
  localeHref,
  tagLabel,
  type Dictionary,
  type Locale,
} from '@/lib/i18n'

/*
 * SiteFooter — photo background under an ochre wash + serif tagline. Link columns
 * use the Hub's real nav (Explore = categories + Resources, Topics = tags), all
 * locale-prefixed. Chrome strings come from the dictionary; the "Information"
 * column is omitted (no such pages yet). Styling lives in styles/layout.css.
 */

const FOOTER_TOPICS = TAG_OPTIONS.slice(0, 8)

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const catAnchor = (c: string) =>
    localeHref(locale, `/#cat-${c.toLowerCase().replace(/\s+/g, '-')}`)

  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <p className="site-footer__tagline">
          {dict.footer.tagline[0]}
          <br />
          {dict.footer.tagline[1]}
        </p>

        <div className="site-footer__rule" />

        <div className="site-footer__cols">
          <div className="site-footer__masthead">
            <p className="site-footer__mark">Designally</p>
            <p className="site-footer__blurb">{dict.footer.blurb}</p>
            <p className="site-footer__label site-footer__label--social">{dict.footer.social}</p>
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

          <nav aria-label={dict.footer.explore}>
            <p className="site-footer__label">{dict.footer.explore}</p>
            <ul className="site-footer__col-list">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link className="site-footer__col-link" href={catAnchor(c)}>
                    {categoryLabel(c, locale)}
                  </Link>
                </li>
              ))}
              <li>
                <Link className="site-footer__col-link" href={localeHref(locale, '/resources')}>
                  {dict.footer.resources}
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label={dict.footer.topics}>
            <p className="site-footer__label">{dict.footer.topics}</p>
            <ul className="site-footer__col-list">
              {FOOTER_TOPICS.map((t) => (
                <li key={t}>
                  <Link className="site-footer__col-link" href={localeHref(locale, `/tag/${tagSlug(t)}`)}>
                    {tagLabel(t, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="site-footer__base">
          <p className="site-footer__fineprint">
            © {new Date().getFullYear()} Designally. {dict.footer.rights}
          </p>
          <LocaleSwitcher locale={locale} className="site-footer__locale" />
        </div>
      </div>
    </footer>
  )
}
