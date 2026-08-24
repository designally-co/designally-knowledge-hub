import type { CollectionConfig } from 'payload'

import { fromMarkdownHandler } from '../endpoints/fromMarkdown'
import { translateToThaiHandler } from '../endpoints/translateToThai'
import { slugField } from '../fields/slug'
import { TAG_SELECT_OPTIONS } from '../lib/tags'
import {
  publishedOrEditor,
  railHeading,
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
          'Open with 2–3 sentences, then 3–6 H2 sections.',
      },
    },
    {
      name: 'references',
      type: 'array',
      labels: { singular: 'Reference', plural: 'References' },
      admin: { description: 'Sources, listed at the end.' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'related',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      admin: { description: 'Shown at the foot of the article.' },
    },
    // Last in the column, because it is the part of the page that falls back on
    // its own: with nothing filled in, the title and summary above stand in for
    // it. Position is the whole of the hierarchy here.
    //
    // It is NOT wrapped in a `collapsible` to give it a fold. That was tried:
    // Payload 3.86 renders a collapsible containing a named group completely
    // empty — no inputs, nothing to expand — verified in a clean tab, so it was
    // not stale dev state. The alternative, collapsing the group by unnaming
    // it, would move `seo.metaTitle` and its two siblings to the top level.
    // That is a migration, in exchange for a fold.
    seoField,

    // ---- The rail ----------------------------------------------------------
    // Grouped by the question each answers. Order is the order the questions
    // get asked: is it going out, where does it belong, what does it look like.
    railHeading('railPublishing', 'Publishing'),
    statusField,
    publishedDateField,
    ...slugField('title'),

    railHeading('railFiling', 'Filing'),
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
        description: 'One tag per article; it sets the category.',
        components: {
          Field: '/components/admin/TagSelector#TagSelector',
          Cell: '/components/admin/ListCells#TagCell',
        },
      },
    },

    // ---- Cover / imagery ---------------------------------------------------
    // In the rail, not the main column. A cover is not part of the text and was
    // sitting between the references and the SEO group, which is neither where
    // you write it nor where you look for it.
    // One section, not two fields. Uploading, choosing from the library and
    // pasting a URL are three ways to answer one question, and stacked as two
    // separate labelled fields with a description each they took 278px of rail
    // to ask it. The "Cover" heading above names the whole thing, so
    // `coverImage` carries no visible label of its own (it keeps one for a
    // screen reader — see custom.scss) and `coverUrl` is relabelled to read as
    // the third option rather than as a second subject.
    railHeading('railCover', 'Cover'),
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'coverUrl',
      type: 'text',
      label: 'Or paste a URL',
      admin: {
        position: 'sidebar',
        description: 'Used only when no image is set.',
      },
    },

    // Last in the rail: an action, not a property of the document. Everything
    // above describes what the article is; this one does something to it.
    translateToThaiField,

    // NOTE: there are deliberately no "Thai" and "Summary" columns here.
    // Content Studio translates and writes the dek as part of publishing, so
    // for the articles that arrive that way both are filled by the time anyone
    // opens this list — two columns that would read "Yes / Yes" down every row
    // and cost width on all of them. The dashboard still watches for both,
    // because an article written by hand in this admin has neither done for it,
    // and those sections hide themselves when there is nothing to report.
  ],
}
