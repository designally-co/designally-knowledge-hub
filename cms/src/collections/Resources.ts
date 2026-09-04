import type { CollectionConfig } from 'payload'

import { translateToThaiHandler } from '../endpoints/translateToThai'
import { slugField } from '../fields/slug'
import { newsletterOnPublish, newsletterSentField } from './newsletterOnPublish'
import {
  RESOURCE_CATEGORY_OPTIONS,
  RESOURCE_FORMATS,
  RESOURCE_PRESETS,
  isResourceCategory,
} from '../lib/resourceCategories'
import {
  localeGuardField,
  publishedOrEditor,
  publishedDateField,
  seoField,
  stampPublishedDate,
  statusField,
  titleField,
  translateToThaiField,
} from './shared'

/**
 * Resources — downloadable files: templates, fonts, ebooks, wallpapers, icons.
 * Articles are not resources; they live in their own collection.
 *
 * Two things are deliberately absent.
 *
 * There are no image fields. A resource's artwork comes from its category
 * preset (`lib/resourceCategories`), so the grid stays visually consistent and
 * nobody has to source a picture for a font. Category is therefore required and
 * single-valued: it picks the artwork, so a resource cannot have two.
 *
 * And there is no gating. Downloads are free; the file is a plain link.
 *
 * Format is not a category. It is held per file below, so one resource can ship
 * a Figma file and a PDF without being duplicated or forced to pick a side.
 */
export const Resources: CollectionConfig = {
  slug: 'resources',
  labels: {
    singular: 'Resource',
    plural: 'Resources',
  },
  admin: {
    // Hides the "API" tab beside "Edit". It is a read-only JSON viewer for
    // developers and nothing an editor needs; despite the name this gates the
    // tab AND its route, not just the URL shown inside it.
    //
    // This does NOT affect the REST API itself. Content Studio still posts to
    // /api/articles/from-markdown, translation still runs through
    // /api/articles/:id/translate-to-thai, and the public site still reads
    // through Payload as before. Only the admin's viewer for it is gone.
    hideAPIURL: true,
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedDate'],
    // About resources and nothing else — the mirror of the line removed from
    // Articles. It closed with "Written articles belong in Articles", pointing
    // at another collection from under the heading of the one already chosen.
    description: 'Files to download, each filed under a single category.',

    /* No `listSearchableFields`: Articles searches by title alone and these are
       one person's two queues, so a list that searched its prose beside one
       that did not would be the kind of split that gets discovered mid-task. */

    pagination: {
      defaultLimit: 25,
      limits: [10, 25, 50, 100],
    },

    components: {
      beforeListTable: [
        '/components/admin/ListReturn#RememberList',
        // The language pair, on a collection that actually has localized
        // fields. It used to be one global control in the nav.
        '/components/admin/LocaleSwitch#LocaleSwitch',
      ],
      views: {
        edit: {
          default: {
            actions: ['/components/admin/ListReturn#ReturnToPlace'],
          },
        },
      },
    },
  },
  access: publishedOrEditor,
  endpoints: [
    {
      // Manual (re)translation of one resource's English copy into Thai.
      path: '/:id/translate-to-thai',
      method: 'post',
      handler: translateToThaiHandler,
    },
  ],
  hooks: {
    beforeChange: stampPublishedDate,
    /* Same announcement, same guards, different noun. A resource has no cover
       and no summary — its `description` is its only prose — so the email
       arrives as a title and a line rather than a picture. */
    afterChange: [
      newsletterOnPublish('resource', (doc) => ({
        kind: 'resource',
        title: String(doc.title ?? ''),
        summary: typeof doc.description === 'string' ? doc.description : undefined,
        path: `/resources/${String(doc.slug ?? '')}`,
      })),
    ],
  },
  fields: [
    // ---- Main column -------------------------------------------------------
    // See Articles: the locale banner goes above everything the locale affects.
    localeGuardField,

    /* WHAT IT IS CALLED AND WHAT IT IS, IN ONE BOX. They were two panels, and
       the seam between them was saying that the name and the sentence
       describing it are separate decisions — they are the same decision, made
       twice. Everything below is a different KIND of thing: the files, the
       terms, the metadata. This is the resource itself.

       A `row`, which is PRESENTATIONAL ONLY — unlike `group` it does not nest
       the data, so `title` and `description` stay exactly where they are in the
       API and in every existing document. The theme paints direct children of
       the sheet as panels, so wrapping them makes the row the panel and the two
       fields plain blocks inside it; `da-intro` stacks them (see custom.scss),
       since a row lays its fields out side by side by default. */
    {
      type: 'row',
      admin: { className: 'da-intro' },
      fields: [
        titleField,
        {
          // A resource has one piece of prose, not a dek and a body. There is no
          // summary field: the card shows title, category and formats, and this
          // is what the resource page prints.
          name: 'description',
          type: 'textarea',
          localized: true,
          admin: {
            // Was three sentences: what it is for, that it is plain text, that
            // it is a few short paragraphs, and that search reads it. The
            // textarea already says "plain text" by being one, and its height
            // says "short". What is left is the part that is not visible.
            description: 'What the download is for. Also used in search.',
          },
        },
      ],
    },

    {
      name: 'files',
      type: 'array',
      labels: { singular: 'File', plural: 'Files' },
      admin: {
        // "The card and page list them all" described the public site to
        // somebody filling in a form. What they need to know is that more than
        // one row is allowed.
        description: 'One entry per file — several formats are fine.',
      },
      fields: [
        { name: 'file', type: 'upload', relationTo: 'media', required: true },
        {
          name: 'format',
          type: 'select',
          required: true,
          options: [...RESOURCE_FORMATS],
        },
      ],
    },

    {
      // Beside the files, not in the rail. A licence is a fact ABOUT the
      // download — proximity puts it next to the thing it describes rather than
      // three panels away among the publishing controls.
      name: 'licence',
      type: 'text',
      admin: {
        description: 'E.g. "Free for personal and commercial use".',
      },
    },

    seoField,

    /* Retired: `fileSize` was a text box asking a person to total up bytes the
       upload had already measured, and it was empty on every resource in both
       databases. Hidden rather than deleted — dropping a column means a
       destructive migration, and Payload's schema push stops on an interactive
       prompt when one is pending, which hangs a boot. The resource page no
       longer prints a size. */
    {
      name: 'fileSize',
      type: 'text',
      admin: { hidden: true },
    },

    // ---- The rail ----------------------------------------------------------
    {
      // Save and the ⋯ menu, portalled into the header band — the same control
      // the article screen carries, from the same component. It is declared in
      // the rail because a `ui` field has to live somewhere inside the form to
      // reach form context; it renders nothing where it stands.
      name: 'resourceActions',
      type: 'ui',
      admin: {
        // A `ui` field is a component, not data, and Payload would otherwise
        // offer it in the column picker — where it would render a header bar
        // inside a table cell.
        disableListColumn: true,
        position: 'sidebar',
        components: { Field: '/components/admin/DocActions#ResourceActions' },
      },
    },

    // The same four questions as an article, asked in the same order: is it
    // live, where is it filed, what is its address, and one action at the end.
    // Status and its date are one question in two parts, so they share a row.
    {
      type: 'row',
      admin: { position: 'sidebar' },
      fields: [statusField, publishedDateField],
    },
    /* When the list was told. See collections/newsletterOnPublish. */
    newsletterSentField,
    {
      name: 'category',
      type: 'select',
      required: true,
      options: RESOURCE_CATEGORY_OPTIONS,
      admin: {
        position: 'sidebar',
        description: 'Sets the card\'s artwork and colour.',
      },
    },
    ...slugField('title'),

    // An action rather than a property, so it closes the rail — as on Articles.
    translateToThaiField,

    {
      // When it was last touched and when it was made. It was a strip of type
      // across the top of the screen, in Payload's control bar; that bar is
      // gone, and provenance belongs at the end of the column rather than above
      // the document.
      name: 'documentMeta',
      type: 'ui',
      admin: {
        disableListColumn: true,
        position: 'sidebar',
        components: { Field: '/components/admin/DocActions#DocMeta' },
      },
    },
  ],
}

/** Typical formats for a category — used in admin help text and the seed. */
export function typicalFormatsFor(category: string): string {
  return isResourceCategory(category) ? RESOURCE_PRESETS[category].typicalFormats : ''
}
