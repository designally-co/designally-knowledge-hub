import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import {
  RESOURCE_COLOR_NAMES,
  RESOURCE_GLYPHS,
  randomCover,
  resourceCategorySlug,
} from '../lib/resourceCategories'

/**
 * Resource categories — what a download is: Templates, Fonts, Ebooks & Guides…
 *
 * A COLLECTION, SO AN EDITOR CAN ADD ONE. The five categories were a fixed list
 * in code, and a resource that fitted none of them needed a deploy. Now the
 * resource form's Category field has Payload's own "add new" beside it: type a
 * name, save, and it is filed there.
 *
 * THE COVER IS DEALT, NOT DRAWN. A category is also its resources' artwork — a
 * colour and a glyph (lib/resourceCategories). Asking for both before a
 * category can exist would make adding one a design task; left empty, they are
 * picked at random from pairings no category has yet, and can be changed here
 * afterwards.
 *
 * Not in the admin's nav: categories are made where they are needed, on a
 * resource, and edited from the same field.
 */
export const ResourceCategories: CollectionConfig = {
  slug: 'resource-categories',
  labels: { singular: 'Category', plural: 'Categories' },
  admin: {
    useAsTitle: 'name',
    hideAPIURL: true,
    defaultColumns: ['name', 'color', 'glyph'],
    description: 'What a download is. Each category gives its resources their cover.',
  },
  access: {
    // The public site lists them; everything else is the default — signed in.
    read: () => true,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (typeof data.name === 'string') {
          data.name = data.name.trim()
          data.slug = resourceCategorySlug(data.name)
        }
        if (operation === 'create' && (!data.color || !data.glyph)) {
          const { docs } = await req.payload.find({
            collection: 'resource-categories',
            depth: 0,
            limit: 0,
            pagination: false,
            select: { color: true, glyph: true },
            req,
          })
          const cover = randomCover(docs)
          data.color ||= cover.color
          data.glyph ||= cover.glyph
        }
        return data
      },
    ],
    /* A resource must have a category, so one still in use cannot go — the
       database would refuse it anyway; this says why in words. */
    beforeDelete: [
      async ({ id, req }) => {
        const { totalDocs } = await req.payload.count({
          collection: 'resources',
          where: { category: { equals: id } },
          req,
        })
        if (totalDocs > 0) {
          throw new APIError(
            `This category is used by ${totalDocs} resource${totalDocs === 1 ? '' : 's'}. Move ${totalDocs === 1 ? 'it' : 'them'} to another category first.`,
            400,
            undefined,
            true,
          )
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'E.g. "Mockups". Shown on the cards and as a filter.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'color',
          type: 'select',
          options: RESOURCE_COLOR_NAMES.map((value) => ({
            label: value[0].toUpperCase() + value.slice(1),
            value,
          })),
          admin: { description: 'Left empty, one is picked at random.' },
        },
        {
          name: 'glyph',
          type: 'select',
          options: RESOURCE_GLYPHS.map((value) => ({
            label: value[0].toUpperCase() + value.slice(1),
            value,
          })),
          admin: { description: 'The shape on the cover. Random if left empty.' },
        },
      ],
    },
    {
      /* Save (and Cancel, in a sheet) — the admin hides Payload's own control
         strip everywhere, so a document that does not declare its bar cannot
         be saved from the drawer it is created in. See DocActions. */
      name: 'categoryActions',
      type: 'ui',
      admin: {
        disableListColumn: true,
        position: 'sidebar',
        components: { Field: '/components/admin/DocActions#CategoryActions' },
      },
    },
    {
      // Derived from the name on every save — the address of its filter,
      // `/resources?cat=<slug>`.
      name: 'slug',
      type: 'text',
      unique: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
