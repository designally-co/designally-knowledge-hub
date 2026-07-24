import React from "react";
import {
  ChevronDown,
  Search,
  Menu,
  X,
  ArrowRight,
  ArrowLeft,
  Instagram,
  Facebook,
  Music,
} from "lucide-react";

/* Icon — thin wrapper over the Lucide icon set (bundled via lucide-react).
   Branding Explained uses Lucide-style thin (2px) stroke line icons for all
   functional UI glyphs. Pass a kebab-case Lucide name (e.g. "chevron-down").
   Only the glyphs the site actually uses are imported, so the bundle stays
   small — add to MAP when you introduce a new icon. */
const MAP = {
  "chevron-down": ChevronDown,
  search: Search,
  menu: Menu,
  x: X,
  "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft,
  instagram: Instagram,
  facebook: Facebook,
  music: Music,
};

export function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  color = "currentColor",
  className = "",
  style = {},
}) {
  const Cmp = MAP[name];
  if (!Cmp) return null;
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      className={"be-icon " + className}
      style={{ display: "block", flex: "none", ...style }}
      aria-hidden="true"
    />
  );
}
