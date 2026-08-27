'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useConfig, useLocale } from '@payloadcms/ui'

import './LocaleSwitch.css'

/**
 * Which language you are editing, on the screens where that is a real question.
 *
 * IT MOVED OUT OF THE NAV, 27 August 2026. Payload puts the locale control in
 * the app header and it was moved to the foot of the nav with the account — one
 * global switch, present on every screen. But localization only touches fields
 * marked `localized: true`, and only two collections have any: Articles (title,
 * deck, body, SEO) and Resources (title, description, SEO). On Media and Users
 * every field is shared, so a global switcher offered a choice that changed
 * nothing on half the screens it appeared on.
 *
 * So it is rendered per collection now, through `beforeListTable`, and only the
 * two collections that are actually bilingual ask for it.
 *
 * IT REBUILDS PAYLOAD'S CONTROL rather than moving it. `Localizer` is not
 * exported, and reaching a client component through a second module specifier
 * gives it a second instance whose context is empty — the failure that took the
 * whole screen down when `DeleteDocument` was imported that way. `useLocale`
 * reports the current locale, `useConfig` supplies the list, and switching does
 * what the real control does: rewrite `?locale=` and let the router reload.
 */
export function LocaleSwitch() {
  const router = useRouter()
  const { config } = useConfig()
  const locale = useLocale()

  const locales = config?.localization ? config.localization.locales : []
  const current = locale?.code

  /* Nothing to choose from on a single-locale install. */
  if (locales.length < 2) return null

  const switchTo = (code: string) => {
    if (code === current) return
    const params = new URLSearchParams(window.location.search)
    params.set('locale', code)
    router.push(`${window.location.pathname}?${params.toString()}`)
    router.refresh()
  }

  return (
    <div aria-label="Language" className="da-locale" role="group">
      {locales.map((option) => {
        const code = typeof option === 'string' ? option : option.code
        /* The full name — "English", "ไทย (Thai)" — is what the config calls it
           and what a screen reader should hear. The button shows the code, so
           the pair stays two short, equal-width chips instead of one word and
           one word-plus-parenthetical. */
        const name =
          typeof option === 'string'
            ? option
            : typeof option.label === 'string'
              ? option.label
              : option.code
        const active = code === current
        return (
          <button
            aria-label={name}
            aria-pressed={active}
            className={`da-locale__opt${active ? ' da-locale__opt--on' : ''}`}
            key={code}
            onClick={() => switchTo(code)}
            title={name}
            type="button"
          >
            {code.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
