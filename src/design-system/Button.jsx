import React from "react";
import { Icon } from "./Icon.jsx";

/* Button — the brand's pill button. Fully-rounded, tight bold grotesque label.
   Primary is solid ink on paper; secondary is a paper/white pill with a hairline
   ink border; ghost is transparent. Optional leading/trailing Lucide icon.

   Styling lives in styles/components.css (.btn). Press feedback is :active
   rather than mouse handlers, so it fires for touch and keyboard too, and the
   target grows to 44px under a coarse pointer without changing the pointer
   layout. */
export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  href,
  onClick,
  disabled = false,
  type = "button",
  className = "",
  style,
  ...rest
}) {
  const iconSize = { sm: 15, md: 17, lg: 19 }[size] || 17;
  const classes = ["btn", `btn--${variant}`, `btn--${size}`, className]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      {icon && <Icon name={icon} size={iconSize} strokeWidth={2.25} />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} size={iconSize} strokeWidth={2.25} />}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        onClick={disabled ? undefined : onClick}
        className={classes}
        style={style}
        aria-disabled={disabled || undefined}
        {...rest}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={classes}
      style={style}
      {...rest}
    >
      {inner}
    </button>
  );
}
