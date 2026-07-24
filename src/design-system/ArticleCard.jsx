import React from "react";
import { Tag } from "./Tag.jsx";

/* ArticleCard — the core editorial unit across the site: an image on top,
   a row of category Tags, a bold sans title and a grey date. "vertical" is the
   grid/carousel form; "overlay" places the tag+title card over a large image
   (the hero form). Pass `image` (url) or leave blank for a tinted placeholder.

   `ratio` and `ratioMobile` feed CSS custom properties so the crop can differ
   per breakpoint: the 21:9 hero letterbox is unreadable on a phone, where it
   opens to 4:3 and the caption plate drops below the image instead of
   covering two-thirds of it. */
export function ArticleCard({
  title,
  date,
  tags = [],
  image,
  imageTint = "#e7e2da",
  ratio = "4 / 3",
  ratioMobile,
  layout = "vertical",
  href = "#",
  onClick,
  titleSize = "sm",
  className = "",
  style,
}) {
  const css = {
    "--card-ratio": ratio,
    "--card-ratio-mobile": ratioMobile || ratio,
    "--card-tint": imageTint,
    ...style,
  };
  /* A real image element rather than a CSS background: it gets lazy loading,
     async decoding and a place in the preload scanner. Empty alt is
     deliberate — the card's own heading already names the article, so
     describing the cover again would announce every card twice. The tint
     stays behind it as the paint-in colour and the no-cover fallback. */
  const media = (
    <span className="article-card__media">
      {image && (
        <img
          className="article-card__img"
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
        />
      )}
    </span>
  );

  if (layout === "overlay") {
    return (
      <a
        href={href}
        onClick={onClick}
        className={["article-card", "article-card--overlay", className].filter(Boolean).join(" ")}
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
    );
  }

  return (
    <a
      href={href}
      onClick={onClick}
      className={["article-card", className].filter(Boolean).join(" ")}
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
  );
}
