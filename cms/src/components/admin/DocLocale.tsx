'use client'

import React from 'react'
import { useConfig, useFormModified, useLocale } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

import './DocLocale.css'

/**
 * Which language of this article or resource you are looking at, at the top of
 * the rail.
 *
 * THE DOCUMENT IS WHERE THE QUESTION IS ASKED. The list's pair picks the
 * language before you know which item you want; here you are already in one
 * and want its other side. Switching reloads the same document in the other
 * locale, and everything after follows it: the Edit page opens in the language
 * chosen here (DocActions carries `?locale=`), and Save writes only that
 * language's fields.
 *
 * NOT ON THE EDIT PAGE. The writing surface hides the rail, and with it this —
 * the language is chosen before you start writing, not in the middle.
 *
 * REFUSES WHILE THE FORM IS DIRTY. Switching reloads the document in the other
 * language, and an unsaved edit would go with the page.
 */
const NAMES: Record<string, string> = { en: 'English', th: 'ไทย' }

export function DocLocale() {
  const router = useRouter()
  const { config } = useConfig()
  const locale = useLocale()
  const modified = useFormModified()

  const locales = config?.localization ? config.localization.locales : []
  if (locales.length < 2) return null

  const codes = locales.map((option) => (typeof option === 'string' ? option : option.code))
  const current = locale?.code ?? codes[0]

  const switchTo = (code: string) => {
    if (code === current || modified) return
    const params = new URLSearchParams(window.location.search)
    params.set('locale', code)
    router.push(`${window.location.pathname}?${params.toString()}`)
    router.refresh()
  }

  return (
    <div className="da-doc-locale">
      <span className="field-label" id="da-doc-locale-label">
        Language
      </span>
      <div aria-labelledby="da-doc-locale-label" className="da-doc-locale__track" role="group">
        {codes.map((code) => {
          const active = code === current
          return (
            <button
              aria-disabled={modified && !active ? true : undefined}
              aria-pressed={active}
              className={`da-doc-locale__opt${active ? ' da-doc-locale__opt--on' : ''}`}
              key={code}
              lang={code}
              onClick={() => switchTo(code)}
              type="button"
            >
              {NAMES[code] ?? code.toUpperCase()}
            </button>
          )
        })}
      </div>
      {modified ? (
        <p className="da-doc-locale__note">Save first. Switching language reloads the page.</p>
      ) : null}
    </div>
  )
}
