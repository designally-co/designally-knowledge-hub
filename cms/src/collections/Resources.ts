import type { CollectionConfig } from 'payload'

import { translateToThaiHandler } from '../endpoints/translateToThai'
import { slugField } from '../fields/slug'
import {
  RESOURCE_CATEGORY_OPTIONS,
  RESOURCE_FORMATS,
  RESOURCE_PRESETS,
  isResourceCategory,
} from '../lib/resourceCategories'
import {
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
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedDate'],
    group: 'Content',
    description: 'Downloadable files. Written articles belong in Articles.',
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
  },
  fields: [
    // ---- Main column -------------------------------------------------------
    titleField,
    {
      // A resource has one piece of prose, not a dek and a body. There is no
      // summary field: the card shows title, category and formats, and this is
      // what the resource page prints.
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          'What is in the download and what it is for. Plain text — a few short paragraphs. Also used as the search description.',
      },
    },
    {
      name: 'files',
      type: 'array',
      labels: { singular: 'File', plural: 'Files' },
      admin: {
        description:
          'One entry per downloadable file. A resource can ship several formats — the card and page list them all.',
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

    // ---- Sidebar -----------------------------------------------------------
    statusField,
    translateToThaiField,
    publishedDateField,
    ...slugField('title'),
    {
      name: 'category',
      type: 'select',
      required: true,
      options: RESOURCE_CATEGORY_OPTIONS,
      admin: {
        position: 'sidebar',
        description: 'What this download is. Also decides the artwork and colour on the card.',
      },
    },
    {
      name: 'fileSize',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Human-readable total, e.g. "2.4 MB".',
      },
    },
    {
      name: 'licence',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Licence terms for the download, e.g. "Free for personal and commercial use".',
      },
    },

    seoField('The picture shown when this download is shared.'),
  ],
}

/** Typical formats for a category — used in admin help text and the seed. */
export function typicalFormatsFor(category: string): string {
  return isResourceCategory(category) ? RESOURCE_PRESETS[category].typicalFormats : ''
}
