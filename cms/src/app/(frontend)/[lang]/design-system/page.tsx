import React from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

import {
  ArticleCard,
  Button,
  Divider,
  FileTypeIcon,
  FilterChip,
  IconButton,
  ResourceCard,
  SectionHeading,
  SocialLinks,
  Tabs,
  Tag,
  TopicPill,
} from '@/components/ds'
import { ListingPager } from '@/components/listing/ListingPager'
import { getDictionary, isLocale, localeHref } from '@/lib/i18n'
import './showcase.css'

/**
 * The design system, rendered: every colour token, every text style in English
 * and Thai, and every shared component. The reference for anyone building a
 * page — if a value is not on this page, it is not in the system.
 *
 * Team only. Anywhere but local development it needs a signed-in Hub admin,
 * and to anyone else it is a 404.
 */

export const metadata: Metadata = {
  title: 'Design system — Designally Knowledge Hub',
  robots: { index: false, follow: false },
}

const COLOURS: { group: string; tokens: string[] }[] = [
  {
    group: 'Neutrals',
    tokens: [
      'neutral-black', 'neutral-black-60', 'neutral-black-32', 'neutral-black-12', 'neutral-dark',
      'neutral-gray-400', 'neutral-gray-200', 'neutral-gray-100', 'neutral-white', 'neutral-white-60',
      'neutral-white-32',
    ],
  },
  {
    group: 'Brand',
    tokens: [
      'brand-dark', 'brand-mid', 'brand-mid-12', 'brand-mid-30', 'brand-primary', 'brand-primary-4',
      'brand-light', 'brand-surface',
    ],
  },
  { group: 'Accent', tokens: ['accent-red', 'accent-orange', 'accent-navy'] },
  {
    group: 'Category',
    tokens: [
      'category-blue-light', 'category-blue-mid', 'category-green-light', 'category-green-mid',
      'category-purple-light', 'category-purple-mid',
    ],
  },
]

const TYPE_STYLES: { token: string; spec: string; serif?: boolean }[] = [
  { token: 'display-1', spec: '80 / 80 · −3', serif: true },
  { token: 'display-2', spec: '64 / 72 · −2', serif: true },
  { token: 'heading-1', spec: '48 / 56 · −1', serif: true },
  { token: 'heading-2', spec: '40 / 48 · −0.3 · 600' },
  { token: 'heading-3', spec: '32 / 40 · −0.2', serif: true },
  { token: 'heading-4', spec: '24 / 32 · −0.1 · 600' },
  { token: 'heading-5', spec: '20 / 28 · −0.1 · 700' },
  { token: 'subtitle', spec: '20 / 28 · −0.1 · 600' },
  { token: 'body-large', spec: '16 / 24 · 400' },
  { token: 'body-large-emphasis', spec: '16 / 24 · 600' },
  { token: 'body', spec: '14 / 20 · 400' },
  { token: 'label', spec: '14 / 20 · 600' },
  { token: 'overline', spec: '14 / 20 · 700' },
  { token: 'tag', spec: '12 / 18 · 700' },
  { token: 'caption', spec: '12 / 18 · 600' },
  { token: 'body-small', spec: '12 / 18 · 400' },
]

const typeStyle = (token: string): React.CSSProperties => ({
  font: `var(--type-${token})`,
  letterSpacing: `var(--tracking-${token})`,
})

const SAMPLE_ARTICLES = [
  { title: 'A field guide to type pairing that holds up in production', date: '12 July 2026', tags: ['Typography'], tint: 'var(--color-category-blue-light)' },
  { title: 'How to run a logo review that ends in a decision', date: '8 July 2026', tags: ['Design Critique'], tint: 'var(--color-brand-light)' },
  { title: 'The brief template we hand every new client', date: '1 July 2026', tags: ['Design Process'], tint: 'var(--color-category-green-light)' },
]

async function isTeam(): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') return true
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    return Boolean(user)
  } catch {
    return false
  }
}

function Section({ title, note, children }: { title: string; note?: string; children?: React.ReactNode }) {
  return (
    <section className="ds-section">
      <h2 className="ds-section__label">{title}</h2>
      {note && <p className="ds-section__note">{note}</p>}
      {children}
    </section>
  )
}

export default async function DesignSystemPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang) || !(await isTeam())) notFound()
  const dict = getDictionary(lang)
  const here = localeHref(lang, '/design-system')

  return (
    <div className="ds-page shell">
      <header className="ds-head">
        <p className="ds-head__eyebrow">Designally Knowledge Hub · team only</p>
        <h1 className="ds-head__title">Design system</h1>
        <p className="ds-head__lede">
          Every colour, text style and shared component on the public site. Tokens live in
          styles/tokens, components in components/ds.
        </p>
      </header>

      <Section title="Colour" note="28 tokens. Use them as var(--color-…); never type a hex.">
        {COLOURS.map((g) => (
          <div key={g.group} className="ds-colour-group">
            <h3 className="ds-colour-group__title">{g.group}</h3>
            <div className="ds-swatches">
              {g.tokens.map((t) => (
                <div key={t} className="ds-swatch">
                  <div
                    className={`ds-swatch__chip${t.startsWith('neutral-white') ? ' ds-swatch__chip--on-dark' : ''}`}
                    style={{ '--swatch': `var(--color-${t})` } as React.CSSProperties}
                  />
                  <p className="ds-swatch__name">{t}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section
        title="Typography"
        note="16 styles. Set both font: var(--type-…) and letter-spacing: var(--tracking-…). Thai swaps Ovo for Athiti (set 600) and Geist for IBM Plex Sans Thai; sizes are identical. The four largest shrink below 1440px."
      >
        <div className="ds-type">
          {TYPE_STYLES.map((s) => (
            <div key={s.token} className="ds-type__row">
              <p className="ds-type__meta">
                <span className="ds-type__token">{s.token}</span>
                <span>
                  {s.serif ? 'Ovo · Athiti 600' : 'Geist · IBM Plex Sans Thai'} · {s.spec}
                </span>
              </p>
              <p className="ds-type__sample" lang="en" style={typeStyle(s.token)}>
                Better brands are built
              </p>
              <p className="ds-type__sample" lang="th" style={typeStyle(s.token)}>
                สร้างแบรนด์ที่ดีกว่า
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Button">
        <div className="ds-row">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" iconRight="arrow-right">
            With icon
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className="ds-row">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
        <div className="ds-band">
          <Button variant="inverse">Inverse, on dark</Button>
        </div>
      </Section>

      <Section title="IconButton">
        <div className="ds-row">
          <IconButton icon="arrow-right" variant="outline" label="Next" />
          <IconButton icon="arrow-right" variant="solid" label="Next" />
          <IconButton icon="search" variant="ghost" label="Search" />
          <IconButton icon="arrow-left" variant="outline" size="sm" label="Previous" />
          <IconButton icon="arrow-right" variant="outline" size="lg" label="Next" />
        </div>
      </Section>

      <Section title="Tag" note="The category label on cards. Not interactive.">
        <div className="ds-row">
          <Tag>Case Study</Tag>
          <Tag>Typography</Tag>
          <Tag tone="warm">Templates</Tag>
        </div>
      </Section>

      <Section title="FilterChip" note="Narrows a listing; a link, so the filter is in the URL.">
        <div className="ds-row">
          <FilterChip href={here} active>
            All
          </FilterChip>
          <FilterChip href={here}>Branding Systems</FilterChip>
          <FilterChip href={here}>Visual Identity</FilterChip>
          <FilterChip href={here}>UX/UI</FilterChip>
        </div>
      </Section>

      <Section title="Tabs" note="Links when each tab is its own URL; buttons when it switches in place.">
        <Tabs
          label="Example tabs"
          items={[
            { key: 'all', label: 'All (18)', active: true, href: here },
            { key: 'case', label: 'Case Studies (9)', active: false, href: here },
            { key: 'res', label: 'Resources (4)', active: false, href: here },
          ]}
        />
      </Section>

      <Section title="TopicPill">
        <div className="ds-row">
          <TopicPill size="sm">Branding</TopicPill>
          <TopicPill size="md" rotate={-2}>
            Typography
          </TopicPill>
          <TopicPill size="lg" rotate={2}>
            UX / UI
          </TopicPill>
          <TopicPill size="md" active>
            Active
          </TopicPill>
        </div>
      </Section>

      <Section title="Pagination" note="40×40 items; 44 on touch screens.">
        <ListingPager page={3} totalPages={9} hrefForPage={() => here} labels={dict.listing} />
      </Section>

      <Section title="SectionHeading">
        <SectionHeading action="arrow">Case Studies</SectionHeading>
        <div className="ds-gap" />
        <SectionHeading actionLabel="See all resources">Resources</SectionHeading>
        <div className="ds-band">
          <SectionHeading action="arrow" onDark>
            On a dark band
          </SectionHeading>
        </div>
      </Section>

      <Section title="ArticleCard">
        <div className="ds-grid">
          {SAMPLE_ARTICLES.map((a) => (
            <ArticleCard key={a.title} title={a.title} date={a.date} tags={a.tags} imageTint={a.tint} />
          ))}
        </div>
        <div className="ds-gap" />
        <ArticleCard
          layout="overlay"
          title="The rebrand playbook: everything we ship in the first two weeks"
          date="16 July 2026"
          tags={['Case Study']}
          imageTint="var(--color-neutral-dark)"
          ratio="21 / 9"
          ratioMobile="4 / 3"
        />
      </Section>

      <Section title="ResourceCard">
        <div className="ds-grid">
          <ResourceCard title="The Practical Brand Strategy Starter Kit" date="12 July 2026" category="Templates" color="var(--color-category-blue-mid)" />
          <ResourceCard title="24 Free Fonts for Modern Editorial Design" date="1 July 2026" category="Fonts" color="var(--color-accent-red)" />
          <ResourceCard title="The UX Research Planning Worksheet" date="24 June 2026" category="Ebooks & Guides" color="var(--color-category-green-mid)" />
        </div>
      </Section>

      <Section title="FileTypeIcon">
        <div className="ds-row">
          {['guide.pdf', 'cover.png', 'display.otf', 'pack.zip', 'kit.fig', 'notes.csv'].map((f) => (
            <span key={f} className="ds-filetype">
              <FileTypeIcon filename={f} size={36} />
              <span className="ds-swatch__name">{f}</span>
            </span>
          ))}
        </div>
      </Section>

      <Section title="SocialLinks">
        <SocialLinks />
        <div className="ds-band">
          <SocialLinks tone="onDark" />
        </div>
      </Section>

      <Section title="Divider">
        <Divider />
        <div className="ds-band">
          <Divider tone="onDark" />
        </div>
      </Section>

      <Section
        title="Site furniture"
        note="The header (SiteHeader), footer (SiteFooter) and newsletter block (NewsletterCta) are shared components too; they frame every page, including this one."
      />
    </div>
  )
}
