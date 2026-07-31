'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LOCALES, getDictionary, switchLocalePath, type Locale } from '@/lib/i18n'

/*
 * Language switcher. Links to the same page in each locale (English unprefixed,
 * Thai under /th). Client component because it reads the current pathname.
 */
export function LocaleSwitcher({
  locale,
  className,
}: {
  locale: Locale
  className?: string
}) {
  const pathname = usePathname() || '/'

  return (
    <div className={`locale-switcher${className ? ` ${className}` : ''}`}>
      {LOCALES.map((l, i) => (
        <React.Fragment key={l}>
          {i > 0 && <span className="locale-switcher__sep" aria-hidden="true">/</span>}
          <Link
            className={`locale-switcher__link${l === locale ? ' is-active' : ''}`}
            href={switchLocalePath(pathname, l)}
            aria-current={l === locale ? 'true' : undefined}
            hrefLang={l}
          >
            {getDictionary(l).localeName}
          </Link>
        </React.Fragment>
      ))}
    </div>
  )
}
