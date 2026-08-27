'use client'

import React from 'react'
import { useDocumentInfo, useLocale } from '@payloadcms/ui'
import { usePathname, useSearchParams } from 'next/navigation'

import './LocaleGuard.css'

/*
 * Says which language you are editing in, at the top of the document.
 *
 * THE LOCALE IS AN APPLICATION MODE, AND THAT CAUSES TWO SILENT FAILURES.
 *
 * Payload's locale switcher lives in the header and its choice is sticky: pick
 * ไทย to read a translation, and every document you open afterwards is in Thai
 * until you change it back. Nothing in the document says so beyond a small
 * "— ไทย (Thai)" suffix beside some labels.
 *
 * 1. CREATING IN THE WRONG LANGUAGE. `/articles/create` inherits the sticky
 *    preference, so it can open with Title, Deck and Body labelled ไทย. The
 *    resulting article has no English at all — invisible to the English site.
 *    This warning is now the ONLY thing standing between that mistake and a
 *    published article: the dashboard used to run a "Thai missing" queue, but
 *    that article slipped past it anyway (its Thai title IS filled), and the
 *    dashboard has since been removed along with the rest of the triage.
 *
 * 2. NOT KNOWING WHICH FIELDS ARE SHARED. In Thai, Cover, Status, Published
 *    date, Tag and Slug remain editable and look identical to the Thai-only
 *    fields, but they are not localized — changing the Tag there changes it for
 *    both languages. The only thing distinguishing the two kinds of field is
 *    the PRESENCE of a suffix on the other ones, and absence is not a signal.
 *
 * Both are the same root cause, so both are answered in the same place. This is
 * a `ui` field placed first in the collection, which puts it above the title and
 * ahead of anything it is warning about.
 *
 * The warning carries the fix rather than just the problem: the switch back to
 * English is a link, because Payload keeps the locale in the query string.
 */

const DEFAULT_LOCALE = 'en'

export function LocaleGuard() {
  const { code, label } = useLocale()
  const { id } = useDocumentInfo()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (code === DEFAULT_LOCALE) return null

  const localeName = typeof label === 'string' ? label : code

  const params = new URLSearchParams(searchParams?.toString() ?? '')
  params.set('locale', DEFAULT_LOCALE)
  const switchHref = `${pathname}?${params.toString()}`

  // No id means this document does not exist yet — the create case, and the
  // one that produces an article with no English in it.
  const creating = !id

  if (creating) {
    return (
      <aside className="da-locale da-locale--warn" role="alert">
        <p className="da-locale__text">
          <strong>You are creating this in {localeName}.</strong> English is the source
          language — Thai is translated from it. Saved like this, the article has no
          English text and will not appear on the English site.
        </p>
        <a className="da-locale__action" href={switchHref}>
          Switch to English
        </a>
      </aside>
    )
  }

  return (
    <aside className="da-locale">
      <p className="da-locale__text">
        Editing the <strong>{localeName}</strong> translation. Fields without a
        “— {localeName}” label — cover, status, published date, tag and slug — are shared
        with English, so changing one here changes both.
      </p>
      <a className="da-locale__action" href={switchHref}>
        Switch to English
      </a>
    </aside>
  )
}
