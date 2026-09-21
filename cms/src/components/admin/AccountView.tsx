'use client'

import React from 'react'
import { createPortal } from 'react-dom'

import { ChevronDown } from 'lucide-react'

import { DocMeta } from './DocActions'
import { SaveButton, useField } from '@payloadcms/ui'

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
 * On or off, as Content Studio draws it.
 *
 * PAYLOAD'S CHECKBOX WAS DOING THIS JOB, and a checkbox reads as something you
 * tick on the way to pressing Save. This one is a state — the key either works
 * or it does not — which is the shape a switch has. Its own `role="switch"` so
 * a screen reader hears on/off rather than "checked", and the whole control is
 * a 44px target: the track is 40 by 24 and the thumb 20, which is a miss
 * waiting to happen on a coarse pointer.
 *
 * It writes to Payload's field, so Save, the dirty state and validation carry
 * on knowing nothing about it.
 */
function Switch({ checked, label, onChange }: { checked: boolean; label: string; onChange: (next: boolean) => void }) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={`da-switch${checked ? ' da-switch--on' : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span aria-hidden="true" className="da-switch__track">
        <span className="da-switch__thumb" />
      </span>
    </button>
  )
}

/**
 * The API key, folded away — the routine sheet's advanced-settings panel.
 *
 * IT IS THE LEAST TOUCHED THING ON THE SCREEN AND IT SAT OPEN ABOVE EVERYTHING:
 * a checkbox, a masked string, a button that replaces it and a warning about
 * what replacing it breaks, all of it in the way of the two lines anybody comes
 * to this page for. Folded, it says what it is and stays shut until asked, the
 * way Content Studio treats the settings you set once.
 *
 * THE FIELDS NEVER LEAVE THE DOM. Payload submits this form from the values it
 * holds, and a closed panel whose inputs had gone would save an account with no
 * key. Closed it is hidden and `inert` — still submitted, not reachable by Tab.
 *
 * NO DOM SURGERY: Payload owns the block, so this renders a trigger beside it
 * and a switch inside it, and the stylesheet orders the three into one panel.
 */
export function ApiAccessPanel() {
  const host = useHost('.auth-fields')
  const body = useHost('.auth-fields__api-key')
  const [open, setOpen] = React.useState(false)
  const { setValue, value } = useField<boolean>({ path: 'enableAPIKey' })
  const enabled = Boolean(value)

  React.useEffect(() => {
    if (!body) return
    body.classList.add('da-api__body')
    body.classList.toggle('da-api__body--open', open)
    ;(body as HTMLElement).inert = !open
    return () => {
      body.classList.remove('da-api__body', 'da-api__body--open')
      ;(body as HTMLElement).inert = false
    }
  }, [body, open])

  return (
    <>
      {host
        ? createPortal(
            <button
              aria-expanded={open}
              className={`da-api__trigger${open ? ' da-api__trigger--open' : ''}`}
              onClick={() => setOpen((was) => !was)}
              type="button"
            >
              <span className="da-api__lead">
                <span className="da-api__title">API access</span>
                <span className="da-api__sub">
                  {enabled ? 'A key is set. Content Studio publishes with it.' : 'No key. Content Studio cannot publish.'}
                </span>
              </span>
              <ChevronDown aria-hidden="true" className="da-api__chevron" size={18} strokeWidth={1.75} />
            </button>,
            host,
          )
        : null}

      {body
        ? createPortal(
            <>
              <div className="da-api__switch">
                <span className="da-api__switch-label">Enable API key</span>
                <Switch checked={enabled} label="Enable API key" onChange={(next) => setValue(next)} />
              </div>
              {/* What regenerating costs, where the finger is already hovering:
                  this key is the credential Content Studio publishes with. */}
              <p className="da-account__note">
                Content Studio posts articles with this key. Generating a new one stops it
                publishing until the new key is set there.
              </p>
            </>,
            body,
          )
        : null}
    </>
  )
}

/**
 * When the account was made, inside the card rather than under it.
 *
 * Every other document ends with this block in its rail. The account has no
 * rail — every field of a user is a sidebar field, so the column holds the
 * whole document — and left where it was declared it drew a second card under
 * the first, holding two lines. A subscriber is one card and so is this.
 */
export function AccountMeta() {
  const host = useHost('.auth-fields')

  if (!host) return null

  return createPortal(<DocMeta />, host)
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
