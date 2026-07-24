import React from "react";
import { Icon } from "./Icon.jsx";

/* IconButton — circular icon-only control. Used for the "→" next-arrow on
   section headers and carousels, search, and social links. Outline on paper,
   solid on cards, inverse on dark bands, or bare when it sits inside another
   control's box.

   `label` is required in practice: the icon is aria-hidden, so the accessible
   name comes from here. It falls back to the icon name rather than rendering
   an unnamed control. */
export function IconButton({
  icon = "arrow-right",
  size = "md",
  variant = "outline",
  label = "",
  onClick,
  href,
  className = "",
  style,
  ...rest
}) {
  const iconSize = { sm: 16, md: 20, lg: 24 }[size] || 20;
  const classes = ["icon-btn", `icon-btn--${variant}`, `icon-btn--${size}`, className]
    .filter(Boolean)
    .join(" ");
  const glyph = <Icon name={icon} size={iconSize} strokeWidth={2} />;

  if (href) {
    return (
      <a href={href} onClick={onClick} aria-label={label || icon} className={classes} style={style} {...rest}>
        {glyph}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label || icon}
      className={classes}
      style={style}
      {...rest}
    >
      {glyph}
    </button>
  );
}
