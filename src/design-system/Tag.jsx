import React from "react";

/* Tag — a small uppercase category pill with a hairline outline (no fill).
   Three tones: "ink" (neutral, used over photos & in nav article cards),
   "warm" (rust outline + rust text, used on resource cards) and "onDark". */
export function Tag({ children, tone = "ink", className = "", style, ...rest }) {
  const toneClass = { ink: "tag--ink", warm: "tag--warm", onDark: "tag--on-dark" }[tone] || "tag--ink";
  return (
    <span className={["tag", toneClass, className].filter(Boolean).join(" ")} style={style} {...rest}>
      {children}
    </span>
  );
}
