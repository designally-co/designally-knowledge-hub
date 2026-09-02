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
    /* TWO LAYERS: manage the article, or write it.
     *
     * `default` is where the list lands you and it is the article as published,
     * read-only, with the status, the tag, the slug, the SEO and the actions
     * around it. `write` is the writing surface — title, deck, cover, body, and
     * nothing else. Both render the SAME `DefaultEditView` over the same form,
     * so there is one Save, one set of validation and one document; which fields
     * each layer shows is presentation. See ArticleViews.tsx.
     *
     * Articles only. A resource is a file with a description attached — there is
     * no long-form text there to keep a caret out of, so it keeps its one page. */
    components: {
      // Records which page and filter you were on, so the back control in the
      // document header can return you to it. Renders nothing.
      beforeListTable: [
        '/components/admin/ListReturn#RememberList',
        // The language pair, on a collection that actually has localized
        // fields. It used to be one global control in the nav.
        '/components/admin/LocaleSwitch#LocaleSwitch',
      ],
      views: {
        edit: {
          default: {
            Component: '/components/admin/ArticleViews#ArticleOverview',
            // Renders nothing: it makes the breadcrumb's "Articles" return to
            // the page of the list you left. See ListReturn.
            actions: ['/components/admin/ListReturn#ReturnToPlace'],
            tab: { href: '', label: 'Overview' },
          },
          write: {
            Component: '/components/admin/ArticleViews#ArticleWrite',
            path: '/write',
            tab: { href: '/write', label: 'Edit' },
          },
        },
      },
    },
    /* FIXED, NOT A STARTING POINT. The column picker is gone from the list (see
       custom.scss), so this is the table rather than its default — five columns
       chosen once for everyone instead of a per-user arrangement nobody
       maintains.

       Reading order: what it is, where it is filed, whether it is live, and
       when it went out. The tag comes before the status because filing is the
       question you ask of a row you do not recognise, and "Published" is the
       answer you already expect.

       "Last edited" was here and is gone: on a library where almost everything
       is published, it repeated the publish date a column to its left and paid
       a column's width to do it. */
    defaultColumns: ['title', 'tag', 'status', 'publishedDate'],
    // About articles and nothing else. It used to close with "Downloadable files
    // belong in Resources" — a signpost to another collection, printed under the
    // heading of the one you already chose from the nav.
    description: 'Guides, tutorials and opinion, each filed under a single tag.',

    /* SEARCH IS THE TITLE, AND ONLY THE TITLE. `listSearchableFields` was set to
       title, deck, slug and the markdown source — the last of those because
       Content Studio stores each article's full text there, so a phrase from
       the middle of a piece would find it. It is unset again by decision: a
       search that matches on body text returns rows whose titles do not contain
       what you typed, and on a list you scan by headline that reads as a wrong
       answer. Payload searches `useAsTitle` when this is absent. */

    /* Ten was Payload's default, never a decision, over a library meant to
       grow. `limit` is stored per user in `CollectionPreferences`, so this
       governs the first visit and anyone who never touched the control — it
       does not override a choice already made. */
    pagination: {
      defaultLimit: 25,
      limits: [10, 25, 50, 100],
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
    {
      // The article as published, read-only — the overview's main column. Sits
      // FIRST among the content fields because on that layer it stands in for
      // all of them; the writing surface hides it and shows the real ones.
      name: 'articleRead',
      type: 'ui',
      admin: {
        // A `ui` field is a component, not data. Payload still offers it in the
        // column picker, where choosing it would render this component inside a
        // table cell — "Article Read" tried to put a whole article in one.
        disableListColumn: true,
        components: { Field: '/components/admin/ArticleRead#ArticleRead' },
      },
    },
    {
      // The shared title field, with a control that WRAPS. At 34px on the
      // writing surface an `<input>` scrolls the headline off the sheet; this
      // renders a textarea over the same string. Articles only — a resource's
      // title is a form field, not a headline. See ArticleTitle.
      ...titleField,
      admin: {
        ...titleField.admin,
        components: {
          Field: '/components/admin/ArticleTitle#ArticleTitle',
          // In the list, the title column carries the cover beside the name —
          // a row is recognised rather than read. See ArticleRowTitle.
          Cell: '/components/admin/ListCells#ArticleRowTitle',
        },
      },
    },
    summaryField,
    {
      // English source markdown (set by the from-markdown endpoint). The Thai
      // translation step reads this to produce the Thai body. Hidden from editors.
      name: 'bodyMarkdown',
      type: 'textarea',
      admin: {
        hidden: true,
        // It carried a `label: 'Body'` for a while, purely to keep the search
        // placeholder from reading "Body Markdown". Search is the title alone
        // now, so the placeholder never names it and the label had no reader.
        disableListColumn: true,
      },
    },

    /* ---- the cover, as one box ---------------------------------------------
     *
     * THE BOX IS THE CONSTANT AND THE CONTENT SWAPS. Empty, it holds the two
     * ways to fill it; filled, the picture takes the box over at the same size
     * and the controls wait underneath until Remove. Nothing moves, because the
     * frame's height comes from its 4/3 ratio rather than from whatever is
     * inside it — and 4/3 is the public card's crop, so the box is showing the
     * crop that ships.
     *
     * WHY THE ROWS. These three fields have to be layered on top of one another,
     * and as plain siblings they are three separate blocks in the document with
     * no shared container to stack them in. A `row` gives them one. It is
     * PRESENTATIONAL ONLY — unlike `group`, it does not nest the data — so
     * `coverImage` and `coverUrl` stay exactly where they are in the API and in
     * every existing document. The inner row keeps the two controls beside each
     * other on their own layer instead of stacking them on each other.
     *
     * The cover is in the main column, not the rail: it is part of the article,
     * it is the largest thing on the published page, and at rail width there is
     * nowhere to actually look at it. */
    {
      type: 'row',
      admin: { className: 'da-cover' },
      fields: [
        {
          // The picture layer. Renders nothing when there is no cover, so the
          // controls beneath ARE the empty state.
          name: 'coverPreview',
          type: 'ui',
          admin: {
        // A `ui` field is a component, not data. Payload still offers it in the
        // column picker, where choosing it would render this component inside a
        // table cell — "Article Read" tried to put a whole article in one.
        disableListColumn: true,
            components: { Field: '/components/admin/CoverPreview#CoverPreview' },
          },
        },
        {
          type: 'row',
          admin: { className: 'da-cover__ways' },
          fields: [
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Cover image',
              /*
               * THE ACCESSIBILITY GATE, MOVED TO WHERE IT BITES.
               *
               * A description used to be required of the FILE, at the moment it
               * entered the library — which is why putting a picture on an
               * article opened a second document with its own Save, and why
               * landing a batch of files was impossible. It bought nothing: a
               * described file can still be left out of every page, and the
               * thing WCAG 2.1 AA actually asks is that a published image
               * carries a text alternative.
               *
               * So the file arrives undescribed and this refuses to let it onto
               * a page that way. The cover well asks for the description in
               * place (see CoverPreview) and the library lists what is still
               * waiting (see MediaCells); this is the backstop under both, and
               * it holds for the REST API too, not just the admin.
               *
               * Server-side only, by necessity — it reads the media document —
               * so the guard is the honest one: with no `payload` to ask, do not
               * pretend to have checked.
               */
              validate: async (value: unknown, options: unknown) => {
                if (!value) return true
                const req = (options as { req?: { payload?: unknown } })?.req
                const payload = req?.payload as
                  | { findByID: (args: Record<string, unknown>) => Promise<{ alt?: string | null }> }
                  | undefined
                if (!payload) return true

                const id =
                  typeof value === 'object' && value !== null
                    ? (value as { id?: number | string }).id
                    : (value as number | string)
                if (id === undefined || id === null) return true

                try {
                  const media = await payload.findByID({ collection: 'media', depth: 0, id })
                  if (media?.alt?.trim()) return true
                } catch {
                  /* A cover pointing at a file that is gone is a different
                     fault, and not one to report as a missing description. */
                  return true
                }

                return 'Describe the cover image before saving — a published picture needs a text alternative.'
              },
            },
            {
              // No description. It read "Used only when no image is set." — a
              // rule the preview states only when it applies, and states more
              // precisely, as "chosen over the URL below".
              name: 'coverUrl',
              type: 'text',
              label: 'Or paste a URL',
            },
          ],
        },
      ],
    },
    {
      // No description. It read "Open with 2\u20133 sentences, then 3\u20136 H2
      // sections." \u2014 house style for a writer who has written here before, and
      // a standing instruction printed above the article every time afterwards.
      // The writing surface has no labels on the title, the deck or the body;
      // a note explaining how to write is the one piece of chrome left on it.
      name: 'body',
      type: 'richText',
      localized: true,
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
    seoField,

    // ---- The rail ----------------------------------------------------------
    // Panels, one question each. Status and its date are one question asked in
    // two parts, so they share a row; the tag and the slug stand alone. There
    // are no section headings: with one field to a panel the field's own label
    // is the heading, and a second one above it just repeats the word.
    {
      // RENDERS NOTHING HERE. It is mounted in the rail because a `ui` field is
      // the only slot Payload offers inside the document's FORM, and Save, the
      // dirty state and the slug all come from form context — but it portals
      // itself into the header band, where the article's verbs now live. The
      // rail is left holding only what the article IS.
      name: 'articleActions',
      type: 'ui',
      admin: {
        // A `ui` field is a component, not data. Payload still offers it in the
        // column picker, where choosing it would render this component inside a
        // table cell — "Article Read" tried to put a whole article in one.
        disableListColumn: true,
        position: 'sidebar',
        components: { Field: '/components/admin/DocActions#ArticleActions' },
      },
    },
    /* THE TAG COMES BEFORE THE STATUS, in the rail and in the list, and it has to
       be moved HERE to do it. `defaultColumns` chooses which columns appear; the
       ORDER follows the fields array — measured, Payload rewrote a preference
       set to `title, tag, status…` back into `title, status, tag…`, which is
       schema order. Reordering the column list alone could never have held.

       Filing is the question you ask of a row you do not recognise; "Published"
       is the answer you already expect. */
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
          // The list keeps its cell — a colour dot and the category beneath the
          // tag is worth having when scanning 30 rows. The EDITOR is a plain
          // select: react-select searches 34 options, which beats three tabs
          // hiding 24 of them behind a control that had to be taught arrow keys.
          Cell: '/components/admin/ListCells#TagCell',
        },
      },
    },
    {
      type: 'row',
      admin: { position: 'sidebar' },
      fields: [statusField, publishedDateField],
    },
    ...slugField('title'),

    // An action rather than a property: everything above describes what the
    // article is, this one does something to it.
    translateToThaiField,

    {
      // Last modified and Created, at the foot of the rail. They used to be the
      // widest thing in the document control bar; that bar is gone from the
      // overview, and provenance belongs at the end of the column rather than
      // at the top of the screen.
      name: 'documentMeta',
      type: 'ui',
      admin: {
        // A `ui` field is a component, not data. Payload still offers it in the
        // column picker, where choosing it would render this component inside a
        // table cell — "Article Read" tried to put a whole article in one.
        disableListColumn: true,
        position: 'sidebar',
        components: { Field: '/components/admin/DocActions#DocMeta' },
      },
    },
    // NOTE: there are deliberately no "Thai" and "Summary" columns in the list.
    // Content Studio translates and writes the dek as part of publishing, so
    // for the articles that arrive that way both are filled by the time anyone
    // opens it \u2014 two columns that would read "Yes / Yes" down every row and
    // cost width on all of them. The dashboard still watches for both, because
    // an article written by hand here has neither done for it, and those
    // sections hide themselves when there is nothing to report.
  ],
}
