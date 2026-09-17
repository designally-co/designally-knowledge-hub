import React from 'react'

import { Icon } from './Icon'

/* SocialLinks — Designally's social accounts as a row of round icon links.

   The one list of channels for the whole site. Only channels with a real
   destination are here: an icon that goes nowhere costs more trust than a
   missing one. Add TikTok back with its account URL. */
const CHANNELS = [
  { name: 'Facebook', icon: 'facebook', href: 'https://www.facebook.com/designallyco/' },
  { name: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/designally.co/' },
] as const

export interface SocialLinksProps {
  /** `onDark` for dark bands such as the footer. */
  tone?: 'onLight' | 'onDark'
  className?: string
}

export function SocialLinks({ tone = 'onLight', className = '' }: SocialLinksProps) {
  const linkClass = `social-link${tone === 'onDark' ? ' social-link--on-dark' : ''}`
  return (
    <ul className={['social-links', className].filter(Boolean).join(' ')}>
      {CHANNELS.map((c) => (
        <li key={c.name}>
          <a
            className={linkClass}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Designally on ${c.name}`}
          >
            <Icon name={c.icon} size={18} />
          </a>
        </li>
      ))}
    </ul>
  )
}
