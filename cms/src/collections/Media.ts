import type { CollectionConfig } from 'payload'

/**
 * Uploaded assets: cover images, preview images, tool logos, and downloadable
 * template files. Public read so the frontend can render/serve them. Images get
 * a small set of derivative sizes for responsive cards.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'alt',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Alt text (required for accessibility / WCAG 2.1 AA).' },
    },
    {
      name: 'credit',
      type: 'text',
      admin: { description: 'Optional attribution for the asset.' },
    },
  ],
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'application/pdf', 'image/svg+xml'],
    imageSizes: [
      { name: 'card', width: 800, height: undefined, position: 'centre' },
      { name: 'hero', width: 1800, height: undefined, position: 'centre' },
      { name: 'thumbnail', width: 400, height: undefined, position: 'centre' },
    ],
  },
}
