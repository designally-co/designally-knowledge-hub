import React from "react";
import { Icon } from "./Icon.jsx";
import { IconButton } from "./IconButton.jsx";

/* SectionHeading — the large editorial serif section title used to open every
   home section ("Case Studies", "Insight", "Workflows", "Resources"). Optional
   circular next-arrow (IconButton) or a text link on the right. Set `onDark`
   for the black band.

   The row wraps below 36em rather than compressing a serif heading into two
   words per line. The text-link form draws its arrow with a plain Icon: the
   previous build nested an IconButton (a real <button>) inside the <a>, which
   is invalid HTML and produced a second, ambiguous tab stop. */
export function SectionHeading({
  children,
  action, // "arrow" | node | null
  actionLabel, // optional text link, e.g. "See all resources"
  onArrow,
  onDark = false,
  align = "left",
  className = "",
  style,
}) {
  const classes = [
    "section-heading",
    align === "center" ? "section-heading--center" : "",
    onDark ? "section-heading--on-dark" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} style={style}>
      <h2 className="section-heading__title">{children}</h2>

      {action === "arrow" && (
        <IconButton
          icon="arrow-right"
          variant={onDark ? "inverse" : "outline"}
          onClick={onArrow}
          label={`See more ${typeof children === "string" ? children : ""}`.trim()}
        />
      )}

      {actionLabel && (
        <a href="#" onClick={onArrow} className="section-heading__link">
          {actionLabel}
          <Icon name="arrow-right" size={18} strokeWidth={2.25} />
        </a>
      )}

      {action && action !== "arrow" && action}
    </div>
  );
}
