import React from "react";

/* TopicPill — a white, fully-rounded "sticker" pill used in the Topics cloud.
   Larger and friendlier than Tag, with a soft shadow and an optional playful
   rotation so a cluster reads like scattered stickers.

   The rotation is passed as a custom property rather than a transform: below
   36em the stylesheet ignores it, because tilting pills costs horizontal room
   a phone doesn't have. */
export function TopicPill({
  children,
  size = "md",
  rotate = 0,
  active = false,
  href,
  onClick,
  className = "",
  style,
  ...rest
}) {
  const classes = [
    "topic-pill",
    `topic-pill--${size}`,
    active ? "topic-pill--active" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const css = { "--pill-rotate": `${rotate}deg`, ...style };

  if (href) {
    return (
      <a href={href} onClick={onClick} className={classes} style={css} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      style={css}
      aria-pressed={active || undefined}
      {...rest}
    >
      {children}
    </button>
  );
}
