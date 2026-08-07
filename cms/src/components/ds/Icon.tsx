import React from 'react'
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Menu,
  X,
  ArrowRight,
  ArrowLeft,
  Instagram,
  Facebook,
  Music,
  type LucideIcon,
} from 'lucide-react'

/* Icon — thin wrapper over the Lucide icon set. Pass a kebab-case name. Only
   the glyphs the site uses are imported, so the bundle stays small — add to
   MAP when you introduce a new icon. */
const MAP: Record<string, LucideIcon> = {
  download: ArrowDownToLine,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  search: Search,
  menu: Menu,
  x: X,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  instagram: Instagram,
  facebook: Facebook,
  music: Music,
}

export interface IconProps {
  name: string
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
  style?: React.CSSProperties
}

export function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  color = 'currentColor',
  className = '',
  style,
}: IconProps) {
  const Cmp = MAP[name]
  if (!Cmp) return null
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      className={'be-icon ' + className}
      style={{ display: 'block', flex: 'none', ...style }}
      aria-hidden="true"
    />
  )
}
