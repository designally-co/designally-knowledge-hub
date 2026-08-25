'use client'

import React from 'react'
import type { DocumentViewClientProps } from 'payload'
import { DefaultEditView } from '@payloadcms/ui'

/**
 * Payload's own editor, re-mounted on its own tab.
 *
 * The Review view took over `views.edit.default`, which is the route a document
 * opens at — so the editor needs somewhere else to live. Every document view is
 * handed the same `DocumentViewClientProps` (`documentSubViewType`, `formState`,
 * `viewType`, plus the document slots), and the surrounding shell provides the
 * form, config and auth context, so forwarding the props untouched is the whole
 * of it. Verified by spike: title, rich text, Save, the rail, and all four
 * custom field components render and save correctly from here.
 *
 * FRAGILE IN EXACTLY ONE WAY, so it is written down. This depends on
 * `DefaultEditView` remaining a public export of `@payloadcms/ui`. It is today.
 * If a Payload upgrade makes it internal, this tab is what breaks — and the
 * failure would be the editor disappearing, not a build error. Worth checking
 * on any Payload minor-version bump.
 */
export function EditFormView(props: DocumentViewClientProps) {
  return <DefaultEditView {...props} />
}
