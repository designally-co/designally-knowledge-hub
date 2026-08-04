import React from 'react'

import {
  Button,
  IconButton,
  Tag,
  TopicPill,
  ArticleCard,
  ResourceCard,
  SectionHeading,
} from '@/components/ds'
import './showcase.css'

/**
 * PHASE 1 CHECKPOINT — design-system gallery.
 *
 * Renders every ported component in its variants so the placeholder visual
 * system can be verified running under Next (server components + the three
 * interactive client components). No CMS data is wired yet; the sample content
 * below is inline and throwaway. Phase 2 replaces this file with the real
 * homepage at `/`.
 */

const SPOTS = [
  ['--be-gold', 'gold'],
  ['--be-cobalt', 'cobalt'],
  ['--be-brick', 'brick'],
  ['--be-green', 'green'],
  ['--be-rust', 'rust'],
  ['--be-purple', 'purple'],
  ['--be-indigo', 'indigo'],
  ['--be-orange', 'orange'],
] as const

const SAMPLE_ARTICLES = [
  {
    title: 'A field guide to type pairing that actually holds up in production',
    date: '12 July 2026',
    tags: ['Typography', 'Guide'],
    imageTint: '#2c5fb3',
  },
  {
    title: 'How to run a logo review that ends in a decision, not a debate',
    date: '8 July 2026',
    tags: ['Process'],
    imageTint: '#b23127',
  },
  {
    title: 'The brief template we hand every new client on day one',
    date: '1 July 2026',
    tags: ['Templates'],
    imageTint: '#2e9e54',
  },
  {
    title: 'Colour systems that survive contact with a real product',
    date: '24 June 2026',
    tags: ['Colour', 'Systems'],
    imageTint: '#7b3fb0',
  },
]

export default function DesignSystemGallery() {
  return (
    <div className="ds-page shell">
      <header className="ds-head">
        <p className="ds-head__eyebrow">Designally Knowledge Hub — Phase 1</p>
        <h1 className="ds-head__title">Design system, running under Next</h1>
        <p className="ds-head__lede">
          The ported component library and design tokens rendered as server
          components (with three interactive client components). Fonts and palette
          are placeholders to be replaced with the real Designally brand.
        </p>
      </header>

      {/* Buttons */}
      <section className="ds-section">
        <p className="ds-section__label">Button — variants &amp; sizes</p>
        <div className="ds-row">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" icon="search">
            With icon
          </Button>
          <Button variant="secondary" iconRight="arrow-right">
            Read more
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
      </section>

      {/* Icon buttons */}
      <section className="ds-section">
        <p className="ds-section__label">IconButton — variants</p>
        <div className="ds-row">
          <IconButton icon="arrow-right" variant="outline" label="Next" />
          <IconButton icon="arrow-right" variant="solid" label="Next" />
          <IconButton icon="search" variant="ghost" label="Search" />
          <IconButton icon="arrow-left" variant="outline" size="sm" label="Previous" />
          <IconButton icon="arrow-right" variant="outline" size="lg" label="Next" />
        </div>
      </section>

      {/* Tags */}
      <section className="ds-section">
        <p className="ds-section__label">Tag — tones</p>
        <div className="ds-row">
          <Tag tone="ink">Case Study</Tag>
          <Tag tone="warm">Design Tools</Tag>
          <Tag tone="ink">Typography</Tag>
          <Tag tone="warm">Templates</Tag>
        </div>
      </section>

      {/* Topic pills */}
      <section className="ds-section">
        <p className="ds-section__label">TopicPill — sizes &amp; state</p>
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
      </section>

      {/* Section heading */}
      <section className="ds-section">
        <p className="ds-section__label">SectionHeading</p>
        <SectionHeading action="arrow">Case Studies</SectionHeading>
        <div style={{ height: 32 }} />
        <SectionHeading actionLabel="See all resources">Resources</SectionHeading>
        <div className="ds-band on-dark">
          <SectionHeading action="arrow" onDark>
            On a dark band
          </SectionHeading>
        </div>
      </section>

      {/* Article cards */}
      <section className="ds-section">
        <p className="ds-section__label">ArticleCard — vertical grid</p>
        <div className="ds-grid">
          {SAMPLE_ARTICLES.map((a) => (
            <ArticleCard
              key={a.title}
              title={a.title}
              date={a.date}
              tags={a.tags}
              imageTint={a.imageTint}
            />
          ))}
        </div>
      </section>

      <section className="ds-section">
        <p className="ds-section__label">ArticleCard — overlay (hero)</p>
        <ArticleCard
          layout="overlay"
          title="The rebrand playbook: everything we ship in the first two weeks"
          date="16 July 2026"
          tags={['Playbook', 'Branding']}
          imageTint="#12100d"
          ratio="21 / 9"
          ratioMobile="4 / 3"
        />
      </section>

      {/* Resource cards */}
      <section className="ds-section">
        <p className="ds-section__label">ResourceCard — downloadable files</p>
        <div className="ds-grid">
          <ResourceCard
            title="The Practical Brand Strategy Starter Kit"
            date="12 July 2026"
            category="Figma File"
            color="var(--be-gold)"
          />
          <ResourceCard
            title="A Simple Checklist for Better Logo Reviews"
            date="8 July 2026"
            category="PDF"
            color="var(--be-cobalt)"
          />
          <ResourceCard
            title="24 Free Fonts for Modern Editorial Design"
            date="1 July 2026"
            category="Fonts"
            color="var(--be-green)"
          />
        </div>
      </section>

      {/* Colour tokens */}
      <section className="ds-section">
        <p className="ds-section__label">Colour — spot palette</p>
        <div className="ds-swatches">
          {SPOTS.map(([varName, name]) => (
            <div key={varName}>
              <div className="ds-swatch__chip" style={{ background: `var(${varName})` }} />
              <p className="ds-swatch__name">
                {name} · {varName}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Type scale */}
      <section className="ds-section">
        <p className="ds-section__label">Type — scale</p>
        <div className="ds-type">
          <div className="ds-type__row">
            <span style={{ font: 'var(--type-display-2)' }}>Display serif</span>
            <span className="ds-type__meta">--type-display-2 · Newsreader</span>
          </div>
          <div className="ds-type__row">
            <span style={{ font: 'var(--type-section)' }}>Section heading</span>
            <span className="ds-type__meta">--type-section · Newsreader</span>
          </div>
          <div className="ds-type__row">
            <span style={{ font: 'var(--type-title-lg)' }}>Title large (sans)</span>
            <span className="ds-type__meta">--type-title-lg · Hanken Grotesk</span>
          </div>
          <div className="ds-type__row">
            <span style={{ font: 'var(--type-body-lg)' }}>
              Body large — the reading size for long-form editorial prose.
            </span>
            <span className="ds-type__meta">--type-body-lg · Hanken Grotesk</span>
          </div>
        </div>
      </section>
    </div>
  )
}
