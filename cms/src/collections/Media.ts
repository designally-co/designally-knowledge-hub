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
    // Hides the "API" tab beside "Edit". It is a read-only JSON viewer for
    // developers and nothing an editor needs; despite the name this gates the
    // tab AND its route, not just the URL shown inside it.
    //
    // This does NOT affect the REST API itself. Content Studio still posts to
    // /api/articles/from-markdown, translation still runs through
    // /api/articles/:id/translate-to-thai, and the public site still reads
    // through Payload as before. Only the admin's viewer for it is gone.
    hideAPIURL: true,
    // Grouped so the sidebar can be ordered at all. Payload renders every
    // ungrouped collection ABOVE the grouped ones, which put Media and Users —
    // the two things opened least — above the two opened daily.
    group: 'Library',
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
