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
    // The only collection that had no description. Says what belongs here and,
    // more usefully, where the files actually come from.
    description:
      'Images and files. Most arrive automatically — Content Studio uploads each article’s cover here when it publishes.',
    // The picture first, then what it is, then when it arrived. Previously
    // unset, so the list showed every field plus both timestamps: Alt, Credit,
    // Updated At, Created At — four columns of words about files nobody could
    // see. Created At is dropped because for an uploaded asset it is the same
    // fact as Updated At in almost every row.
    /* `alt` FIRST, then the picture. Payload attaches the drawer's select
       button to whichever column comes first (`default-cell__first-cell`), and
       only its own DefaultCell receives the handler — so a custom cell in that
       slot leaves the row unselectable. Leading with the preview column was
       tried and did exactly that. The name leads; the thumbnail sits beside
       it. */
    defaultColumns: ['alt', 'preview', 'credit', 'updatedAt'],
  },
  fields: [
    {
      /* The picture, as its own column.
       *
       * NOT folded into `alt`, though that is the row's identity column and the
       * obvious home for it. A custom Cell there would silently break "Choose
       * from existing": Payload wires drawer selection inside its own
       * `DefaultCell` and hands a custom cell no `onClick` to call, so the
       * drawer would fill with pictures that cannot be picked. See MediaCells. */
      name: 'preview',
      type: 'ui',
      label: 'Preview',
      admin: {
        components: {
          Cell: '/components/admin/MediaCells#MediaPreviewCell',
        },
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alt text (required for accessibility / WCAG 2.1 AA).',
      },
    },
    {
      name: 'credit',
      type: 'text',
      admin: {
        description: 'Optional attribution for the asset.',
        components: {
          // Empty renders as an em dash rather than Payload's `<No Credit>`,
          // which is developer syntax shown to an editor.
          Cell: '/components/admin/MediaCells#QuietTextCell',
        },
      },
    },
  ],
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'application/pdf', 'image/svg+xml'],
    /* Point the admin at the 400px derivative it already generates, rather
       than the original. Unset, Payload falls back to the full-size file for
       every thumbnail it draws — so picking a cover from the library meant
       downloading a set of 1800px heroes to render them at 44px, in the list
       AND in the "Choose from existing" drawer. */
    adminThumbnail: 'thumbnail',
    imageSizes: [
      { name: 'card', width: 800, height: undefined, position: 'centre' },
      { name: 'hero', width: 1800, height: undefined, position: 'centre' },
      { name: 'thumbnail', width: 400, height: undefined, position: 'centre' },
    ],
  },
}
