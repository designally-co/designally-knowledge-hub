import React from 'react'
import { Tag } from './Tag'

/* ArticleCard — the core editorial unit. "vertical" is the grid/carousel form;
   "overlay" places the tag+title plate over a large image (the hero form).
   `ratio`/`ratioMobile` feed CSS custom properties so the crop can differ per
   breakpoint. */
export interface ArticleCardProps {
  title: React.ReactNode
  date?: string
  tags?: string[]
  image?: string
  /** Width-described candidates for `image` (see coverSrcSetOf). */
  imageSrcSet?: string
  /** How wide the image renders. The default is a grid card: a quarter of the
      page or less on a wide screen, half of it on a phone. A card that spans
      more (a feature tile) says so. */
  imageSizes?: string
  imageTint?: string
  ratio?: string
  ratioMobile?: string
  layout?: 'vertical' | 'overlay'
  href?: string
  onClick?: React.MouseEventHandler
  titleSize?: 'sm' | 'md' | 'lg'
  className?: string
  style?: React.CSSProperties
}

export function ArticleCard({
  title,
  date,
  tags = [],
  image,
  imageSrcSet,
  imageSizes = '(max-width: 47.999em) 50vw, 25vw',
  imageTint,
  ratio = '4 / 3',
  ratioMobile,
  layout = 'vertical',
  href = '#',
  onClick,
  titleSize = 'sm',
  className = '',
  style,
}: ArticleCardProps) {
  const css = {
    '--card-ratio': ratio,
    '--card-ratio-mobile': ratioMobile || ratio,
    // Only override the tint when one is given; otherwise the CSS default shows.
    ...(imageTint ? { '--card-tint': imageTint } : {}),
    ...style,
  } as React.CSSProperties

  const media = (
    <span className="article-card__media">
      {image && (
        <img
          className="article-card__img"
          src={image}
          srcSet={imageSrcSet}
          sizes={imageSrcSet ? imageSizes : undefined}
          alt=""
          loading="lazy"
          decoding="async"
        />
      )}
    </span>
  )

  if (layout === 'overlay') {
    return (
      <a
        href={href}
        onClick={onClick}
        className={['article-card', 'article-card--overlay', className].filter(Boolean).join(' ')}
        style={css}
      >
        {media}
        <div className="article-card__plate">
          {tags.length > 0 && (
            <div className="article-card__tags">
              {tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          )}
          <h3 className="article-card__title">{title}</h3>
          {date && <p className="article-card__date">{date}</p>}
        </div>
      </a>
    )
  }

  return (
    <a
      href={href}
      onClick={onClick}
      className={['article-card', className].filter(Boolean).join(' ')}
      style={css}
    >
      {media}
      {tags.length > 0 && (
        <div className="article-card__tags">
          {tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}
      <h3 className={`article-card__title article-card__title--${titleSize}`}>{title}</h3>
      {date && <p className="article-card__date">{date}</p>}
    </a>
  )
}
