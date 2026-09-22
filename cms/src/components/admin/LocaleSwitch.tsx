'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useConfig, useLocale } from '@payloadcms/ui'

import './LocaleSwitch.css'

/**
 * Which language you are editing, on the screens where that is a real question.
 *
 * A SINGLE ROUND BUTTON since 22 September 2026, in the header's top corner
 * beside search — see the note on the markup below.
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
    /* ONE BUTTON, NOT A PAIR OF CHIPS.
     *
     * It was EN and TH side by side with the active one filled — a segmented
     * control, which is the right shape for a choice you make by looking at the
     * options. There are two, they never change, and the one you are not in is
     * the one you want: that is a toggle, and a toggle costs half the width and
     * none of the reading. Which matters here because it now sits in the
     * header's top corner beside search, where the line is 44px tall and every
     * pixel of it is spoken for.
     *
     * THE FACE IS THE STATE, AND THE LABEL IS THE ACTION. It shows where you
     * are — the language you are editing — and says where pressing takes you,
     * because a control that shows its own destination leaves you guessing
     * which of the two you are looking at.
     */
    <button
      aria-label={`Language: ${names[at]}. Switch to ${names[next]}`}
      className="da-locale"
      onClick={() => switchTo(codes[next])}
      title={`Switch to ${names[next]}`}
      type="button"
    >
      {(codes[at] ?? '').toUpperCase()}
    </button>
  )
}
