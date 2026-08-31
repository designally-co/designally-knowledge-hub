'use client'

import React from 'react'

import { Icon } from '@/components/ds'
import type { Dictionary } from '@/lib/i18n'

/**
 * The message form, on the note.
 *
 * IT COMPOSES A MAIL RATHER THAN POSTING ONE. This site has no mail provider
 * wired up — the newsletter band in the same stylesheet is UI-only for the same
 * reason — and a contact form that silently swallows what somebody typed is
 * worse than no form at all. So the fields are real, the validation is the
 * browser's, and submitting hands the whole message to the visitor's own mail
 * app addressed to `clients@designally.co`, with the subject and body already
 * written. Nothing is stored here and nothing is lost.
 *
 * The consent line says exactly that, because a form that behaves unusually has
 * to say so before it is used rather than after.
 *
 * TO POST IT INSTEAD, replace `send` with a fetch to an endpoint and drop the
 * `mailto`. The markup, the fields and the copy stay as they are.
 */
export interface ContactFormProps {
  dict: Dictionary
  /** Where a composed message is addressed. */
  to: string
}

export function ContactForm({ dict, to }: ContactFormProps) {
  const c = dict.contact
  const [sent, setSent] = React.useState(false)

  const send = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') || '').trim()
    const email = String(data.get('email') || '').trim()
    const subject = String(data.get('subject') || '').trim()
    const message = String(data.get('message') || '').trim()

    /* The address goes in the body as well as in the reply-to: a mail composed
       from someone's own client arrives from whichever account that client is
       signed in to, which is not necessarily the one they typed. */
    const body = [message, '', `— ${name}`, email].filter(Boolean).join('\n')
    const href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    window.location.href = href
    setSent(true)
  }

  return (
    <form className="contact-note__form" noValidate={false} onSubmit={send}>
      <div className="contact-field-row">
        <label className="contact-field">
          <span className="contact-field__label">{c.name}</span>
          <input
            autoComplete="name"
            className="contact-field__input"
            name="name"
            placeholder={c.namePlaceholder}
            required
            type="text"
          />
        </label>

        <label className="contact-field">
          <span className="contact-field__label">{c.email}</span>
          <input
            autoComplete="email"
            className="contact-field__input"
            name="email"
            placeholder={c.emailPlaceholder}
            required
            type="email"
          />
        </label>
      </div>

      {/* The chevron is drawn by the wrapper rather than left to the browser:
          a native select arrow is a different shape in every one of them, and
          this one is the site's. */}
      <label className="contact-field">
        <span className="contact-field__label">{c.subject}</span>
        <span className="contact-field__select">
          <select className="contact-field__input" defaultValue="" name="subject" required>
            <option disabled value="">
              {c.subjectPlaceholder}
            </option>
            {c.subjects.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Icon name="chevron-down" size={18} />
        </span>
      </label>

      <label className="contact-field">
        <span className="contact-field__label">{c.message}</span>
        <textarea
          className="contact-field__input contact-field__input--area"
          name="message"
          placeholder={c.messagePlaceholder}
          required
          rows={5}
        />
      </label>

      <p className="contact-note__help">{c.messageHelp}</p>

      <div className="contact-note__foot">
        <p className="contact-note__consent">{c.consent}</p>
        <button className="contact-note__send" type="submit">
          {c.send}
        </button>
      </div>

      {/* THE ESCAPE HATCH, SHOWN ONLY AFTER A SEND. A browser with no mail
          client handles `mailto:` by doing nothing at all, and the visitor is
          left looking at a form that appears to have ignored them. This is the
          address, in plain sight, the moment that could have happened. */}
      {sent ? (
        <p className="contact-note__fallback" role="status">
          <a href={`mailto:${to}`}>{c.sendFallback}</a>
        </p>
      ) : null}
    </form>
  )
}
