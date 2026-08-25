import type { CollectionConfig } from 'payload'

import { fromMarkdownHandler } from '../endpoints/fromMarkdown'
import { translateToThaiHandler } from '../endpoints/translateToThai'
import { slugField } from '../fields/slug'
import { TAG_SELECT_OPTIONS } from '../lib/tags'
import {
  localeGuardField,
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
    // Hides the "API" tab beside "Edit". It is a read-only JSON viewer for
    // developers and nothing an editor needs; despite the name this gates the
    // tab AND its route, not just the URL shown inside it.
    //
    // This does NOT affect the REST API itself. Content Studio still posts to
    // /api/articles/from-markdown, translation still runs through
    // /api/articles/:id/translate-to-thai, and the public site still reads
    // through Payload as before. Only the admin's viewer for it is gone.
    hideAPIURL: true,
    // A triage order: what it is, whether it is live, where it is filed, when
    // it went out, and when it was last touched. Last edited closes the row
    // because it answers "where was I", not "what needs doing".
    defaultColumns: ['title', 'status', 'tag', 'publishedDate', 'updatedAt'],
    group: 'Content',
    description: 'Written editorial. Downloadable files belong in Resources.',
    /*
     * REVIEW IS WHAT YOU LAND ON; THE EDITOR IS THE SECOND TAB.
     *
     * Articles arrive from Content Studio already written, translated and
     * summarised, so the job is reading one and deciding — not authoring. The
     * editor was the landing screen for a job almost nobody does, while the job
     * people actually do (look at the article) the CMS could not do at all.
     *
     * `default` is the key Payload resolves for /collections/articles/:id, so
     * overriding it changes what opens. The stock editor is then re-mounted at
     * /edit with its own tab. `order` puts Review first in the tab bar; without
     * it the tabs sort by declaration and Edit leads.
     *
     * Note that `default` ALSO serves /collections/articles/create — Payload has
     * no separate key for it — so ReviewView detects the no-id case and renders
     * the editor itself. See the comment there.
     */
    components: {
      views: {
        edit: {
          default: {
            Component: '/components/admin/ReviewView#ReviewView',
            tab: { label: 'Review', order: 0 },
          },
          editForm: {
            path: '/edit',
            tab: { label: 'Edit', href: '/edit', order: 100 },
            Component: '/components/admin/EditFormView#EditFormView',
          },
        },
      },
    },
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
    // ---- The document ------------------------------------------------------
    // Reading order, and the order the article is made in: what it is called,
    // what it promises, what it looks like, what it says, where that came from,
    // what to read next, and how it is described to a search engine.
    //
    // Ahead of all of it: which language this is. It warns about the locale, so
    // it has to sit above the fields the locale applies to. Nothing renders in
    // English.
    localeGuardField,
    titleField,
    summaryField,
    {
      // English source markdown (set by the from-markdown endpoint). The Thai
      // translation step reads this to produce the Thai body. Hidden from editors.
      name: 'bodyMarkdown',
      type: 'textarea',
      admin: { hidden: true },
    },

    // The cover, in the main column. It was briefly in the rail on the argument
    // that it is not part of the text; it is part of the article, it is the
    // largest thing on the published page, and at rail width there is nowhere
    // to actually look at it. Uploading, choosing from the library and pasting
    // a URL stay one block — see the cover rules in custom.scss.
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover image',
    },
    {
      name: 'coverUrl',
      type: 'text',
      label: 'Or paste a URL',
      admin: { description: 'Used only when no image is set.' },
    },

    {
      name: 'body',
      type: 'richText',
      localized: true,
      admin: { description: 'Open with 2\u20133 sentences, then 3\u20136 H2 sections.' },
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
      // Four slots, shown as cards with their covers, because what you are
      // choosing between is articles rather than rows of text. Four is the
      // number the published page lays out.
      name: 'related',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      label: 'Related',
      admin: {
        description: 'Up to four, shown at the foot of the article.',
        components: {
          Field: '/components/admin/RelatedPicker#RelatedPicker',
        },
      },
    },
    // Last in the column: the part of the page that falls back on its own,
    // since with nothing filled in the title and deck above stand in for it.
    //
    // NOT wrapped in a `collapsible` to give it a fold. That was tried:
    // Payload 3.86 renders a collapsible containing a named group completely
    // empty \u2014 no inputs, nothing to expand \u2014 verified in a clean tab. The
    // alternative, collapsing the group by unnaming it, would move
    // `seo.metaTitle` and its two siblings to the top level. That is a
    // migration, in exchange for a fold.
    seoField(
      'The cover above is used automatically. Only set one here if the share card needs a different picture — a cover that is mostly texture, or one whose subject gets cropped out.',
    ),

    // ---- The rail ----------------------------------------------------------
    // Panels, one question each. Status and its date are one question asked in
    // two parts, so they share a row; the tag and the slug stand alone. There
    // are no section headings: with one field to a panel the field's own label
    // is the heading, and a second one above it just repeats the word.
    {
      type: 'row',
      admin: { position: 'sidebar' },
      fields: [statusField, publishedDateField],
    },
    {
      // Exactly one tag. The tag determines the article's category (each tag
      // belongs to exactly one), so a second tag would make the category
      // ambiguous \u2014 which is why this is a single value rather than a list.
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
    ...slugField('title'),

    // An action rather than a property: everything above describes what the
    // article is, this one does something to it.
    translateToThaiField,

    // NOTE: there are deliberately no "Thai" and "Summary" columns in the list.
    // Content Studio translates and writes the dek as part of publishing, so
    // for the articles that arrive that way both are filled by the time anyone
    // opens it \u2014 two columns that would read "Yes / Yes" down every row and
    // cost width on all of them. The dashboard still watches for both, because
    // an article written by hand here has neither done for it, and those
    // sections hide themselves when there is nothing to report.
  ],
}
