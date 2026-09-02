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
    // The only collection that had no description. Says what belongs here and,
    // more usefully, where the files actually come from.
    description:
      'Images and files, most uploaded here by Content Studio.',
    // The picture first, then what it is, then when it arrived. Previously
    // unset, so the list showed every field plus both timestamps: Alt, Credit,
    // Updated At, Created At — four columns of words about files nobody could
    // see. Created At is dropped because for an uploaded asset it is the same
    // fact as Updated At in almost every row.
    /* The picture is IN the name's column now (see MediaRowTitle), so the
       separate preview column goes: a thumbnail and the words about it, read
       in one move, the way an article's row works. */
    defaultColumns: ['alt', 'credit', 'updatedAt'],
  },
  fields: [
    {
      /* The picture on its own. It is no longer a default column — the
         thumbnail moved into the name — but the field stays so anyone who wants
         the picture in a column of its own can add it from the column picker. */
      name: 'preview',
      type: 'ui',
      label: 'Preview',
      admin: {
        components: {
          Cell: '/components/admin/MediaCells#MediaPreviewCell',
        },
      },
    },
    /* THE TWO THINGS ANYONE TYPES HERE, IN ONE BOX. They were two panels with a
       seam between them, and the seam was claiming they are separate decisions
       — they are the same one, made about the same file, on a screen where
       everything else is the file itself. Same wrapper the resource's title and
       description use; see `da-intro` in custom.scss.

       A `row` is PRESENTATIONAL ONLY — unlike a group it does not nest the data
       — so `alt` and `credit` stay where they are in the API, which matters:
       every article cover reads `alt` through the media relation. */
    {
      type: 'row',
      admin: { className: 'da-intro' },
      fields: [
        {
          /* NO LONGER REQUIRED HERE, and required harder somewhere better.
           *
           * A file could not exist without a description, which sounds like the
           * accessible choice and was the opposite: it forced every way of
           * getting a picture into the system to become a FORM. Dropping a cover
           * on an article opened a document with its own Save; landing twenty
           * files in the library at once was impossible, because twenty files is
           * twenty forms.
           *
           * What actually matters is that nothing PUBLISHED carries an
           * undescribed image, and that is now checked where it can be checked
           * properly: `coverImage` on an article refuses to save without one
           * (see Articles), and this list says which files are still waiting.
           * A file can arrive undescribed; it cannot go on a page that way. */
          name: 'alt',
          type: 'text',
          admin: {
            description:
              'What the picture shows, for someone who cannot see it. Needed before it can go on a page.',
            components: {
              /* The picture in front of the name, and the row's link or — in a
                 drawer — its select button. See MediaRowTitle. */
              Cell: '/components/admin/MediaCells#MediaRowTitle',
            },
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
    },
    {
      /* Save and the ⋯ menu, portalled into the header band — the same control
       * the article and resource screens carry. It renders nothing where it
       * stands; a `ui` field simply has to live inside the form to reach form
       * context, and this collection has no rail to put it in.
       *
       * NO RAIL, DELIBERATELY. Two fields and a file do not divide into a
       * document and a column of decisions about it, and a 325px sidebar
       * holding two timestamps would be the account screen's mistake again. */
      name: 'mediaActions',
      type: 'ui',
      admin: {
        disableListColumn: true,
        components: { Field: '/components/admin/DocActions#MediaActions' },
      },
    },
    {
      /* Type, dimensions and size, each under its own word — replacing the one
         line Payload runs them together on. Portalled under the filename; see
         MediaFacts. */
      name: 'mediaFacts',
      type: 'ui',
      admin: {
        disableListColumn: true,
        components: { Field: '/components/admin/DocActions#MediaFacts' },
      },
    },
    {
      // The pair that used to be a strip of type across the top of the screen.
      name: 'documentMeta',
      type: 'ui',
      admin: {
        disableListColumn: true,
        components: { Field: '/components/admin/DocActions#DocMeta' },
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
