import React from 'react'
import Link from 'next/link'

import { Divider, SocialLinks } from './ds'
import { FooterNavGroup } from './FooterNavGroup'
import { LocaleSwitcher } from './LocaleSwitcher'
import { CATEGORIES, TAG_OPTIONS, categorySlug, tagPath } from '@/lib/tags'
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

const FOOTER_TOPICS = TAG_OPTIONS.slice(0, 4)

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const catAnchor = (c: (typeof CATEGORIES)[number]) =>
    localeHref(locale, `/category/${categorySlug(c)}`)

  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <p className="site-footer__tagline">
          {dict.footer.tagline[0]}
          <br />
          {dict.footer.tagline[1]}
        </p>

        <Divider tone="onDark" className="site-footer__rule" />

        <div className="site-footer__cols">
          <div className="site-footer__masthead">
            {/* The mark heads the masthead: left-aligned beside the lists, and
                centred with the rest of the masthead on a phone. The two layers
                are decoration — the label says the name. */}
            <p aria-label="Designally" className="site-footer__mark" role="img">
              <i aria-hidden="true" className="site-footer__mark-d" />
              <i aria-hidden="true" className="site-footer__mark-dot" />
            </p>
            <p className="site-footer__blurb">{dict.footer.blurb}</p>
            <p className="site-footer__label site-footer__label--social">{dict.footer.social}</p>
            <SocialLinks tone="onDark" className="site-footer__social" />
          </div>

          <FooterNavGroup label={dict.footer.explore}>
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
          </FooterNavGroup>

          <FooterNavGroup label={dict.footer.topics}>
            <ul className="site-footer__col-list">
              {FOOTER_TOPICS.map((t) => (
                <li key={t}>
                  <Link className="site-footer__col-link" href={localeHref(locale, tagPath(t))}>
                    {tagLabel(t, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterNavGroup>

          {/* INFORMATION — the pages about the publication rather than in it,
              and last in the row. They were in Explore, which is where the
              reading is: a category, a tag and "Contact" are not the same kind
              of destination.

              THERE IS NO POLICY LINK YET. The column was asked for with one,
              and this site has no editorial-policy page to point it at — a
              footer link to a 404 is the same trade the social icons already
              refused. Add the page and it goes here. */}
          <FooterNavGroup label={dict.footer.information}>
            <ul className="site-footer__col-list">
              <li>
                <Link className="site-footer__col-link" href={localeHref(locale, '/about')}>
                  {dict.footer.about}
                </Link>
              </li>
              <li>
                <Link className="site-footer__col-link" href={localeHref(locale, '/contact')}>
                  {dict.footer.contact}
                </Link>
              </li>
              <li>
                <Link className="site-footer__col-link" href={localeHref(locale, '/newsletter')}>
                  {dict.footer.newsletter}
                </Link>
              </li>
            </ul>
          </FooterNavGroup>
        </div>

        <div className="site-footer__base">
          <p className="site-footer__fineprint">
            © {new Date().getFullYear()} Designally. {dict.footer.rights}
          </p>
          <LocaleSwitcher locale={locale} placement="up" className="site-footer__locale" />
        </div>
      </div>
    </footer>
  )
}
