'use client'

import React from 'react'

import { ArticleCard, IconButton } from '@/components/ds'
import { PromoBanner } from '@/components/PromoBanner'
import type { CarouselItem } from '@/lib/resources'

type CaseStudyCarouselProps = {
  items: CarouselItem[]
  title: string
  previousLabel: string
  nextLabel: string
  bannerLabel: string
  bannerHref: string
  className?: string
}

export function CaseStudyCarousel({
  items,
  title,
  previousLabel,
  nextLabel,
  bannerLabel,
  bannerHref,
  className = '',
}: CaseStudyCarouselProps) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const headingId = React.useId()
  const [canPrevious, setCanPrevious] = React.useState(false)
  const [canNext, setCanNext] = React.useState(items.length > 1)

  const updateControls = React.useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const maxScroll = track.scrollWidth - track.clientWidth
    setCanPrevious(track.scrollLeft > 2)
    setCanNext(track.scrollLeft < maxScroll - 2)
  }, [])

  React.useEffect(() => {
    updateControls()
    window.addEventListener('resize', updateControls)
    return () => window.removeEventListener('resize', updateControls)
  }, [updateControls])

  const move = (direction: -1 | 1) => {
    // aria-disabled, not disabled — see the controls below — so the guard is here.
    if (direction === -1 ? !canPrevious : !canNext) return
    const track = trackRef.current
    const firstCard = track?.firstElementChild as HTMLElement | null
    if (!track || !firstCard) return
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollBy({ left: direction * (firstCard.offsetWidth + gap), behavior: still ? 'auto' : 'smooth' })
  }

  if (items.length === 0) return null

  return (
    <section
      className={['case-studies', className].filter(Boolean).join(' ')}
      aria-labelledby={headingId}
    >
      <div className="case-studies__header">
        <h2 id={headingId} className="case-studies__heading">
          <img className="section-icon" src="/section-icons/case.svg" alt="" aria-hidden="true" />
          {title}
        </h2>
        <div className="case-studies__controls">
          <IconButton
            className="case-studies__control"
            icon="arrow-left"
            label={previousLabel}
            onClick={() => move(-1)}
            /* Not `disabled`: a button disabled under the keyboard drops focus
               to the page, and reaching the end of the row did exactly that. */
            aria-disabled={!canPrevious}
            size="md"
            variant="outline"
          />
          <IconButton
            className="case-studies__control"
            icon="arrow-right"
            label={nextLabel}
            onClick={() => move(1)}
            aria-disabled={!canNext}
            size="md"
            variant="outline"
          />
        </div>
      </div>

      <div
        ref={trackRef}
        className="case-studies__track"
        onScroll={updateControls}
        tabIndex={0}
        role="region"
        aria-label={title}
      >
        {items.map((item) => (
          <ArticleCard
            className="case-studies__card"
            key={item.href}
            title={item.title}
            date={item.date}
            tags={item.tags}
            image={item.image}
            imageSrcSet={item.imageSrcSet}
            ratio={item.ratio}
            href={item.href}
            titleSize="sm"
          />
        ))}
      </div>

      <div className="case-studies__banner-row content-grid">
        <PromoBanner
          className="case-studies__banner"
          graphic="/promo/case-studies.png"
          label={bannerLabel}
          href={bannerHref}
          arrow={false}
        />
      </div>
    </section>
  )
}
