import type { Metadata } from 'next'

import { Icon } from '@/components/ds'
import { ContactForm } from '@/components/ContactForm'
import { getDictionary, isLocale, type Locale } from '@/lib/i18n'

/**
 * Contact — the ways in, and where the studio is.
 *
 * THE DETAILS ARE HERE, NOT IN THE DICTIONARY. A phone number is not a
 * translation: the same digits are dialled in both languages, and holding them
 * twice is how one of the two ends up stale. Only the labels are localised.
 *
 * The composition follows the About page it sits beside — the same hero, the
 * same label-in-the-margin arrangement, the same watermark — because they are
 * two halves of one section of the site rather than two designs.
 */

const CONTACT = {
  /* The studio, as given. The plus code is what the map is centred on: it is
     exact to a few metres, where a street address in Bangkok is frequently
     resolved to the wrong end of a soi. */
  address: ['368 Ratchadaphisek 42 Alley, Chan Kasem', 'Chatuchak, Bangkok 10900, Thailand'],
  plusCode: 'RHGJ+88 Bangkok',
  phone: '+66 65 005 5993',
  /* Dialling form: no spaces, and the country code as `+66`. */
  phoneHref: 'tel:+66650055993',
  email: 'clients@designally.co',
  line: '@designally',
  lineHref: 'https://line.me/R/ti/p/~@designally',
} as const

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)
  return {
    title: `${dict.contact.eyebrow} — Designally Knowledge Hub`,
    description: dict.contact.lede,
  }
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)
  const c = dict.contact

  const mapQuery = encodeURIComponent(CONTACT.plusCode)

  const rows = [
    { icon: 'phone', label: c.phoneLabel, value: CONTACT.phone, href: CONTACT.phoneHref },
    {
      icon: 'mail',
      label: c.emailRowLabel,
      value: CONTACT.email,
      href: `mailto:${CONTACT.email}`,
    },
    { icon: 'message-square', label: c.lineLabel, value: CONTACT.line, href: CONTACT.lineHref },
    { icon: 'map-pin', label: c.addressLabel, value: CONTACT.address, href: null },
  ]

  return (
    <div className="contact">
      {/* ---- the opening ------------------------------------------------- */}
      <section className="about-hero" aria-labelledby="contact-title">
        <div className="shell about-hero__inner">
          <p className="about-eyebrow">{c.eyebrow}</p>
          <h1 className="about-hero__title" id="contact-title">
            {c.title}
          </h1>
          <p className="about-hero__lede">{c.lede}</p>
        </div>
      </section>

      {/* ---- the message ------------------------------------------------- */}
      <section className="contact-write" aria-labelledby="contact-write-title">
        <div className="shell contact-write__inner">
          <div className="contact-write__lead">
            <p className="about-eyebrow">{c.formLabel}</p>
            <h2 className="contact-write__title" id="contact-write-title">
              {c.formTitle}
            </h2>
            <p className="contact-write__lede">{c.formLede}</p>

            {/* Behind its own rule, because it is a warning rather than the
                next sentence of the paragraph above it. */}
            <p className="contact-write__caution">{c.formCaution}</p>

            <p className="contact-write__social-label">{c.social}</p>
            {/* The two channels that exist. The footer records the same
                decision: an icon pointing at an account nobody has costs more
                trust than a missing one. Add TikTok back with its URL. */}
            <ul className="contact-social">
              <li>
                <a
                  aria-label="Facebook"
                  className="icon-btn icon-btn--outline icon-btn--md"
                  href="https://www.facebook.com/designallyco/"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon name="facebook" size={18} />
                </a>
              </li>
              <li>
                <a
                  aria-label="Instagram"
                  className="icon-btn icon-btn--outline icon-btn--md"
                  href="https://www.instagram.com/designally.co/"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon name="instagram" size={18} />
                </a>
              </li>
            </ul>
          </div>

          {/* THE NOTE. A form on a coloured card, tacked up and sitting a
              degree off square — the one piece of theatre on either of these
              two pages, and it is the piece of paper somebody is writing on. */}
          <div className="contact-note">
            <span aria-hidden="true" className="contact-note__tack">
              <svg fill="none" height="42" viewBox="0 0 34 42" width="34">
                <path
                  d="M17 21.5v16"
                  stroke="var(--be-ink)"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
                <ellipse cx="17" cy="14" fill="var(--be-ink-70)" rx="10" ry="7.5" />
                <ellipse cx="17" cy="11.5" fill="var(--be-ink)" rx="10" ry="7.5" />
                <ellipse cx="13" cy="9.5" fill="rgb(255 255 255 / 0.28)" rx="3" ry="2" />
              </svg>
            </span>

            <h2 className="contact-note__title">{c.cardTitle}</h2>
            <p className="contact-note__lede">{c.cardLede}</p>

            <ContactForm dict={dict} to={CONTACT.email} />
          </div>
        </div>
      </section>

      {/* ---- where we are ------------------------------------------------ */}
      <section className="contact-where" aria-labelledby="contact-where-title">
        <div className="shell contact-where__inner">
          <div className="contact-where__lead">
            <p className="about-eyebrow">{c.whereLabel}</p>
            <h2 className="contact-where__title" id="contact-where-title">
              {c.whereTitle}
            </h2>
          </div>

          {/* Each row is a label and the thing itself, and the thing itself is
              a link wherever a link can do something — dial, compose, open
              LINE. The address is the one that is not. */}
          <dl className="contact-rows">
            {rows.map((row) => (
              <div className="contact-row" key={row.label}>
                <dt className="contact-row__label">
                  <span aria-hidden="true" className="contact-row__mark">
                    <Icon name={row.icon} size={18} />
                  </span>
                  {row.label}
                </dt>
                <dd className="contact-row__value">
                  {Array.isArray(row.value) ? (
                    row.value.map((line) => <span key={line}>{line}</span>)
                  ) : row.href ? (
                    <a href={row.href} rel="noreferrer" target={row.href.startsWith('http') ? '_blank' : undefined}>
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---- the map ----------------------------------------------------- */}
      {/*
        THIRD-PARTY, AND LOADED LATE. The embed is Google's and it sets cookies
        the moment it runs, so it is `loading="lazy"`: a visitor who never
        scrolls this far never loads it. If this site takes on a consent banner,
        this is the frame that has to sit behind it.

        The link beside it is not decoration — an iframe is awkward to use on a
        phone and impossible with a keyboard alone, and this is the way out to
        the real map.
      */}
      <section className="contact-map" aria-label={c.mapTitle}>
        <iframe
          className="contact-map__frame"
          height="420"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${mapQuery}&z=16&output=embed`}
          title={c.mapTitle}
          width="100%"
        />

        <a
          className="contact-map__link"
          href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
          rel="noreferrer"
          target="_blank"
        >
          {c.mapLink}
          <Icon name="arrow-right" size={17} strokeWidth={2.25} />
        </a>
      </section>
    </div>
  )
}
