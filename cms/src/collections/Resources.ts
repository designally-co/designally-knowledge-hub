import type { CollectionConfig } from 'payload'

import { fromMarkdownHandler } from '../endpoints/fromMarkdown'
import { translateToThaiHandler } from '../endpoints/translateToThai'
import { slugField } from '../fields/slug'
import { TAG_SELECT_OPTIONS } from '../lib/tags'

/**
 * The single unifying content model (PRD §7.1 / PRODUCT.md principle 3:
 * "One Resource model, four experiences"). A `type` discriminator selects which
 * type-specific field group applies; common fields (title, slug, summary,
 * category, tags, cover, author, SEO, related) are shared across all types.
 *
 * Public reads are limited to published resources; authenticated CMS users see
 * everything, including drafts and scheduled items.
 */
export const Resources: CollectionConfig = {
  slug: 'resources',
  labels: {
    singular: 'Resource',
    plural: 'Resources',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'category', 'status', 'publishedDate'],
    group: 'Content',
  },
  access: {
    // Everyone can read published resources; logged-in editors see all statuses.
    read: ({ req: { user } }) => {
      if (user) return true
      return { status: { equals: 'published' } }
    },
  },
  // Integration endpoint for the Content Generator (Markdown → article).
  endpoints: [
    {
      path: '/from-markdown',
      method: 'post',
      handler: fromMarkdownHandler,
    },
    {
      // Manual (re)translation of one resource's English content into Thai.
      path: '/:id/translate-to-thai',
      method: 'post',
      handler: translateToThaiHandler,
    },
  ],
  hooks: {
    // Stamp the publish date the first time a resource goes live, so listings
    // (which sort/limit by publishedDate) surface it. Applies to admin edits
    // and API writes alike; a date already set is respected.
    beforeChange: [
      ({ data }) => {
        if (data?.status === 'published' && !data.publishedDate) {
          data.publishedDate = new Date().toISOString()
        }
        return data
      },
    ],
  },
  fields: [
    // ---- Main column -------------------------------------------------------
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          'Dek / subtitle: the one-sentence lede shown under the title, also used as the card excerpt and default meta description.',
      },
    },
    {
      // English source markdown (set by the from-markdown endpoint). The Thai
      // translation step reads this to produce the Thai body. Hidden from editors.
      name: 'bodyMarkdown',
      type: 'textarea',
      admin: { hidden: true },
    },

    // ---- Type-specific fields, grouped in tabs ----------------------------
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Article',
          admin: { condition: (data) => data?.type === 'article' },
          fields: [
            {
              name: 'body',
              type: 'richText',
              localized: true,
              admin: {
                description:
                  'Rich body. Opens with a 2–3 sentence introduction (no heading), then 3–6 H2 sections (H3 only when a section has separate parts).',
              },
            },
            {
              name: 'references',
              type: 'array',
              labels: { singular: 'Reference', plural: 'References' },
              admin: { description: 'Structured reference list shown at the end of the article.' },
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'url', type: 'text', required: true },
              ],
            },
          ],
        },
        {
          label: 'Downloadable file',
          admin: { condition: (data) => data?.type === 'template' },
          fields: [
            {
              name: 'files',
              type: 'array',
              labels: { singular: 'File', plural: 'Files' },
              fields: [
                { name: 'file', type: 'upload', relationTo: 'media', required: true },
                {
                  name: 'format',
                  type: 'select',
                  options: ['Figma', 'PSD', 'PDF', 'SVG', 'AI', 'Sketch', 'ZIP', 'Other'],
                },
              ],
            },
            {
              name: 'fileSize',
              type: 'text',
              admin: { description: 'Human-readable, e.g. "2.4 MB".' },
            },
            {
              name: 'licence',
              type: 'text',
              admin: { description: 'Licence terms for the download.' },
            },
            {
              name: 'previewImages',
              type: 'array',
              fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
            },
            {
              name: 'gated',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Require an email before download. Default is ungated (free).',
              },
            },
          ],
        },
      ],
    },

    // ---- Sidebar -----------------------------------------------------------
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'article',
      options: [
        { label: 'Article / Tutorial', value: 'article' },
        { label: 'Downloadable file', value: 'template' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Draft = hidden from the public site; Published = live. Publishing is manual.',
      },
    },
    {
      // Sidebar button: (re)generate the Thai version from the English source.
      name: 'translateToThai',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/admin/TranslateToThaiButton#TranslateToThaiButton',
        },
      },
    },
    {
      name: 'publishedDate',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
      },
    },
    ...slugField('title'),
    {
      name: 'tags',
      type: 'select',
      hasMany: true,
      options: TAG_SELECT_OPTIONS,
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Select one or two tags (grouped by category). Order does not matter.',
        components: {
          Field: '/components/admin/TagSelector#TagSelector',
        },
      },
      validate: (value: unknown) => {
        const n = Array.isArray(value) ? value.length : value ? 1 : 0
        if (n < 1) return 'Select at least one tag.'
        if (n > 2) return 'Select at most two tags.'
        return true
      },
    },

    // ---- Cover / imagery ---------------------------------------------------
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Uploaded cover. Preferred once real assets exist.' },
    },
    {
      name: 'coverUrl',
      type: 'text',
      admin: {
        description:
          'External cover URL (placeholder Unsplash imagery). Used when no coverImage is set. With no cover at all, a default colour is shown. The aspect ratio comes from the uploaded image.',
      },
    },

    // ---- SEO ---------------------------------------------------------------
    {
      type: 'group',
      name: 'seo',
      label: 'SEO',
      admin: { description: 'Per-resource search metadata. Falls back to title/summary.' },
      fields: [
        { name: 'metaTitle', type: 'text', localized: true },
        { name: 'metaDescription', type: 'textarea', localized: true },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },

    // ---- Related -----------------------------------------------------------
    {
      name: 'related',
      type: 'relationship',
      relationTo: 'resources',
      hasMany: true,
      admin: { description: 'Related resources surfaced on the resource page.' },
    },
  ],
}
