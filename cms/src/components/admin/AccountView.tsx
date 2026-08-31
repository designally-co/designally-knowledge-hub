'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { SaveButton } from '@payloadcms/ui'

import './AccountView.css'

/**
 * The account screen, given the shape every other screen in this admin has.
 *
 * IT WAS THE ONE PAGE THAT NEVER GOT THE TREATMENT. Payload assembles it from
 * three stacked pieces — the auth fields, the document's own fields, and its
 * `payload-settings` block — and the theme's sheet rule lands on the middle one,
 * which on this collection is EMPTY. So the page drew a white sheet around
 * nothing, printed the email and the API key on the bare page above it, and put
 * a second title bar with timestamps and a dots menu over the lot.
 *
 * This component is a `ui` field on Users, which is how it gets to run on a
 * route Payload owns. It does three things:
 *
 *   1. Marks the body `da-account`, so AccountView.css can reach a screen that
 *      has no class of its own to hook.
 *   2. Portals Save into the header band, where every other document keeps it.
 *
 * The timestamps it displaces are picked up by `ArticleMeta`, which reads
 * `savedDocumentData` and never cared which collection it was in.
 *
 * IT NO LONGER TITLES THE SETTINGS BLOCK, because that block is gone: it held a
 * language select with one option and a Reset Preferences button, and neither
 * earned a panel on this screen. See AccountView.css.
 */

/** A host that may not exist on the first frame after a client-side nav. */
function useHost(selector: string) {
  const [host, setHost] = React.useState<Element | null>(null)

  React.useEffect(() => {
    let frame = 0
    let tries = 0
    const find = () => {
      const el = document.querySelector(selector)
      if (el) return setHost(el)
      if (tries++ < 30) frame = requestAnimationFrame(find)
    }
    find()
    return () => cancelAnimationFrame(frame)
  }, [selector])

  return host
}

export function AccountView() {
  const bar = useHost('.app-header__actions')

  /* The class goes on `<body>` because the thing that needs restyling — the
     document header, the sheet, the settings block — are all ancestors or
     siblings of anything this component can render into.

     NO CLEANUP ON UNMOUNT would leave every other screen wearing it, so unlike
     the writing surface's class this one is removed. */
  React.useEffect(() => {
    document.body.classList.add('da-account')
    return () => document.body.classList.remove('da-account')
  }, [])

  return (
    <>
      {bar
        ? createPortal(
            <div className="da-bar da-bar--account">
              <div className="da-bar__save">
                <SaveButton />
              </div>
            </div>,
            bar,
          )
        : null}

    </>
  )
}

/**
 * What the API key is for, beside the API key.
 *
 * The block is Payload's and it explains nothing: a checkbox, a masked string
 * and a button that replaces it. On this install that string is load-bearing —
 * it is the credential Content Studio posts articles with — and regenerating it
 * stops the other product working until the new one is pasted into it. A
 * control that can break a second application should say so where the finger is
 * already hovering.
 */
export function ApiKeyNote() {
  const host = useHost('.auth-fields__api-key')

  if (!host) return null

  return createPortal(
    <p className="da-account__note">
      Content Studio posts articles with this key. Generating a new one stops it
      publishing until the new key is set there.
    </p>,
    host,
  )
}
