import React from 'react'

import { Tag } from '@/components/ds'
import { PromoBanner } from '@/components/PromoBanner'
import type { CarouselItem } from '@/lib/resources'

type WorkflowsGridProps = {
  items: CarouselItem[]
  title: string
  bannerLabel: string
  bannerHref: string
  seeAllLabel: string
}

/**
 * "Workflows" — articles in the Design with AI category, laid out as one large
 * featured story on the left and a divided list of three on the right, capped by
 * a green wordmark banner that links to the full category. Mirrors the Insights /
 * Case Studies sections in vocabulary (Tag, serif heading, hairline dividers).
 *
 * On a phone there is no large story: the lead article opens the list as a row
 * like the rest (`workflows__row--lead`, hidden from tablet up, where the large
 * story takes its place).
 */
export function WorkflowsGrid({ items, title, bannerLabel, bannerHref, seeAllLabel }: WorkflowsGridProps) {
  if (items.length === 0) return null

  const [feature, ...rest] = items
  const rows = [{ item: feature, lead: true }, ...rest.slice(0, 3).map((item) => ({ item, lead: false }))]

  return (
    <section className="workflows" aria-labelledby="workflows-heading">
      <div className="workflows__inner">
        <h2 id="workflows-heading" className="workflows__heading">
          <img className="section-icon" src="/section-icons/workflows.svg" alt="" aria-hidden="true" />
          {title}
        </h2>

        <div className="workflows__layout">
          <a className="workflows__feature" href={feature.href}>
            <span
              className="workflows__feature-media"
              style={{ '--card-ratio': feature.ratio } as React.CSSProperties}
            >
              {feature.image && (
                <img
                  className="workflows__feature-img"
                  src={feature.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              )}
            </span>
            <span className="workflows__body">
              {feature.tags.length > 0 && (
                <span className="workflows__tags">
                  {feature.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </span>
              )}
              <span className="workflows__feature-title">{feature.title}</span>
              {feature.date && <span className="workflows__date">{feature.date}</span>}
            </span>
          </a>

          <div className="workflows__side">
            {rows.length > 0 && (
              <ul className="workflows__list">
                {rows.map(({ item, lead }) => (
                  <li
                    className={lead ? 'workflows__row workflows__row--lead' : 'workflows__row'}
                    key={item.href}
                  >
                    <a className="workflows__row-link" href={item.href}>
                      <span className="workflows__row-media">
                        {item.image && (
                          <img
                            className="workflows__row-img"
                            src={item.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </span>
                      <span className="workflows__body">
                        {item.tags.length > 0 && (
                          <span className="workflows__tags">
                            {item.tags.map((t) => (
                              <Tag key={t}>{t}</Tag>
                            ))}
                          </span>
                        )}
                        <span className="workflows__row-title">{item.title}</span>
                        {item.date && <span className="workflows__date">{item.date}</span>}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <PromoBanner
              className="workflows__banner"
              graphic="/promo/workflows.png"
              label={bannerLabel}
              href={bannerHref}
              arrow={false}
              ariaLabel={seeAllLabel}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
