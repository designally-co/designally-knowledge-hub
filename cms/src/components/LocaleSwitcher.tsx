'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LOCALES, getDictionary, switchLocalePath, type Locale } from '@/lib/i18n'

/*
 * Language switcher — a two-segment pill toggle. Each segment links to the same
 * page in that locale (English unprefixed, Thai under /th); the active locale is
 * the filled segment. Client component because it reads the current pathname.
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
    <div className={`locale-switcher${className ? ` ${className}` : ''}`} role="group" aria-label="Language">
      {LOCALES.map((l) => (
        <Link
          key={l}
          className={`locale-switcher__link${l === locale ? ' is-active' : ''}`}
          href={switchLocalePath(pathname, l)}
          aria-current={l === locale ? 'true' : undefined}
          hrefLang={l}
        >
          {getDictionary(l).localeName}
        </Link>
      ))}
    </div>
  )
}
