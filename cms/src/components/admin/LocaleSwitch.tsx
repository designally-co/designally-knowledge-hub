'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useConfig, useLocale } from '@payloadcms/ui'

import './LocaleSwitch.css'

/**
 * Which language you are editing, on the screens where that is a real question.
 *
 * A PAIR ON THE DESK, A SINGLE ROUND BUTTON ON THE PHONE. The round button
 * replaced the pair everywhere on 22 September 2026; the desk got its pair
 * back on 24 September — see the note on the markup below.
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

  /* THE NEXT ONE, ROUND THE RING. Two locales make this a toggle; three would
     make it a cycle, and both read the same way from a button that says what it
     is showing rather than what it will do. */
  const codes = locales.map((option) => (typeof option === 'string' ? option : option.code))
  const names = locales.map((option) =>
    typeof option === 'string'
      ? option
      : typeof option.label === 'string'
        ? option.label
        : option.code,
  )
  const at = Math.max(0, codes.indexOf(current ?? codes[0]))
  const next = (at + 1) % codes.length

  return (
    /* A PAIR ON THE DESK, ONE DISC ON THE PHONE — both are rendered, and the
     * stylesheet shows the one that fits (LocaleSwitch.css, 48rem).
     *
     * On a desk the control sits in the list's own control row, 36 tall beside
     * the search field and Create, where there is width to spare: both
     * languages are shown and the one you are editing is filled, so the state
     * is read at a glance and the other is one click away.
     *
     * On a phone it moves onto the header's top line beside search and the
     * menu, where every pixel of a 44px line is spoken for. There it is a
     * toggle: the face is the language you are editing, and the label says
     * where pressing takes you.
     *
     * `display: none` on the form not shown keeps it out of the tab order and
     * the accessibility tree, so each width has exactly one control.
     */
    <div aria-label="Language" className="da-locale" role="group">
      {codes.map((code, i) => {
        const active = i === at
        return (
          <button
            aria-label={names[i]}
            aria-pressed={active}
            className={`da-locale__opt${active ? ' da-locale__opt--on' : ''}`}
            key={code}
            onClick={() => switchTo(code)}
            title={names[i]}
            type="button"
          >
            {code.toUpperCase()}
          </button>
        )
      })}
      <button
        aria-label={`Language: ${names[at]}. Switch to ${names[next]}`}
        className="da-locale__toggle"
        onClick={() => switchTo(codes[next])}
        title={`Switch to ${names[next]}`}
        type="button"
      >
        {(codes[at] ?? '').toUpperCase()}
      </button>
    </div>
  )
}
