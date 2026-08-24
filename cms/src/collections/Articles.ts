import type { CollectionConfig } from 'payload'

import { fromMarkdownHandler } from '../endpoints/fromMarkdown'
import { translateToThaiHandler } from '../endpoints/translateToThai'
import { slugField } from '../fields/slug'
import { TAG_SELECT_OPTIONS } from '../lib/tags'
import {
  publishedOrEditor,
  publishedDateField,
  seoField,
  stampPublishedDate,
  statusField,
  summaryField,
  titleField,
  translateToThaiField,
} from './shared'

/**
 * Articles — written editorial: guides, tutorials, opinion.
 *
 * Filed by a single tag from the article taxonomy (`lib/tags`), which also
 * derives its category and drives the tag pages, the category sections and the
 * Topics cloud. Downloadable files are a different thing entirely and live in
 * the Resources collection; nothing is shared between the two taxonomies.
 *
 * Public reads are limited to published articles; authenticated CMS users see
 * everything, drafts included.
 */
export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: {
    singular: 'Article',
    plural: 'Articles',
  },
  admin: {
    useAsTitle: 'title',
    // A triage order: what it is, whether it is live, where it is filed, when
    // it went out, and when it was last touched. Last edited closes the row
    // because it answers "where was I", not "what needs doing".
    defaultColumns: ['title', 'status', 'tag', 'publishedDate', 'updatedAt'],
    group: 'Content',
    description: 'Written editorial. Downloadable files belong in Resources.',
  },
  access: publishedOrEditor,
  endpoints: [
    // Integration endpoint for the Content Generator (Markdown → article).
    {
      path: '/from-markdown',
      method: 'post',
      handler: fromMarkdownHandler,
    },
    {
      // Manual (re)translation of one article's English content into Thai.
      path: '/:id/translate-to-thai',
      method: 'post',
      handler: translateToThaiHandler,
    },
  ],
  hooks: {
    beforeChange: stampPublishedDate,
  },
  fields: [
    // ---- Main column -------------------------------------------------------
    titleField,
    summaryField,
    {
      // English source markdown (set by the from-markdown endpoint). The Thai
      // translation step reads this to produce the Thai body. Hidden from editors.
      name: 'bodyMarkdown',
      type: 'textarea',
      admin: { hidden: true },
    },
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

    // ---- Sidebar -----------------------------------------------------------
    statusField,
    translateToThaiField,
    publishedDateField,
    ...slugField('title'),
    {
      // Exactly one tag. The tag determines the article's category (each tag
      // belongs to exactly one), so a second tag would make the category
      // ambiguous — which is why this is a single value rather than a list.
      name: 'tag',
      type: 'select',
      options: TAG_SELECT_OPTIONS,
      required: true,
      admin: {
        position: 'sidebar',
        description: 'The one tag this article is filed under (grouped by category).',
        components: {
          Field: '/components/admin/TagSelector#TagSelector',
          Cell: '/components/admin/ListCells#TagCell',
        },
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

    seoField,

    {
      name: 'related',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      admin: { description: 'Related articles surfaced on the article page.' },
    },

    // NOTE: there are deliberately no "Thai" and "Summary" columns here.
    // Content Studio translates and writes the dek as part of publishing, so
    // for the articles that arrive that way both are filled by the time anyone
    // opens this list — two columns that would read "Yes / Yes" down every row
    // and cost width on all of them. The dashboard still watches for both,
    // because an article written by hand in this admin has neither done for it,
    // and those sections hide themselves when there is nothing to report.
  ],
}
