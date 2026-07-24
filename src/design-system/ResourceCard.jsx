import React from "react";
import { Tag } from "./Tag.jsx";

/* ResourceCard — the downloadable-resource tile. A colored "document" panel
   (with the card title reversed out in white) sits behind a frosted
   lilac/pink glass "folder pocket". Below: warm-toned category Tags, a bold
   title and a date. `color` sets the document panel (use a brand spot color).

   The illustration repeats the title, so it's marked aria-hidden — screen
   reader users hear the heading once, not twice. */
export function ResourceCard({
  title,
  date,
  tags = [],
  color = "var(--be-gold)",
  href = "#",
  onClick,
  className = "",
  style,
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={["resource-card", className].filter(Boolean).join(" ")}
      style={{ "--doc-color": color, ...style }}
    >
      <div className="resource-card__figure" aria-hidden="true">
        <div className="resource-card__doc">
          <span className="resource-card__doc-title">{title}</span>
        </div>
        <div className="resource-card__pocket" />
      </div>
      {tags.length > 0 && (
        <div className="resource-card__tags">
          {tags.map((t) => (
            <Tag key={t} tone="warm">
              {t}
            </Tag>
          ))}
        </div>
      )}
      <h3 className="resource-card__title">{title}</h3>
      {date && <p className="resource-card__date">{date}</p>}
    </a>
  );
}
