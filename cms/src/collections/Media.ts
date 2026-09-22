import type { CollectionConfig } from 'payload'

import { mediaFromUrlHandler } from '../endpoints/mediaFromUrl'
import { toSlug } from '../fields/slug'
import { mediaFileRedirect } from '../lib/storage'


/**
 * The extension a file should carry, from what it actually is.
 *
 * `image/jpeg` is `.jpg` rather than `.jpeg` because that is what the rest of
 * this library is called, and a mixed shelf is a shelf you cannot pattern-match
 * by eye. Anything not on the list keeps whatever the incoming name ended in,
 * and a file that arrives with neither — the Article Studio case — simply has
 * none, which is better than inventing one that lies about the bytes.
 */
const EXTENSIONS: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'image/avif': '.avif',
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
}

function extensionFor(mimetype: string | undefined, name: string): string {
  const known = mimetype ? EXTENSIONS[mimetype.split(';')[0].trim().toLowerCase()] : undefined
  if (known) return known

  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot).toLowerCase() : ''
}

/**
 * The stem of the name, from the description — in ASCII, whatever it was
 * written in.
 *
 * THE FILENAME IS A PUBLIC ADDRESS, which is the fact that decides this. It was
 * briefly allowed to carry Thai, on the reasoning that a Thai description should
 * leave a Thai filename; measured, "ภาพหน้าปกบทความ.jpg" became
 * `%E0%B8%A0%E0%B8%B2%E0%B8%9E%E0%B8%AB…` in `url` — a hundred and twenty
 * characters of percent-encoding in every link an editor copies, every `<img
 * src>` in a sent newsletter and every share card. It loaded; it was unreadable.
 *
 * Nothing is lost by dropping it. The library lists the DESCRIPTION, not the
 * filename, so a Thai file still reads as Thai everywhere a person looks at it.
 * The name is what machines and URLs use, and there ASCII is the whole point.
 *
 * So: the slug when the description has any ASCII in it — "โลโก้ Designally"
 * still gives `designally` — and a dated name when it has none. That name says
 * less, but it is short, legible and unique (Payload increments a collision),
 * which is everything a filename owes.
 */
function stemFor(alt: string, mimetype: string | undefined): string {
  const ascii = toSlug(alt).slice(0, 80)
  if (ascii) return ascii

  const today = new Date().toISOString().slice(0, 10)
  return `${mimetype?.startsWith('image/') ? 'image' : 'file'}-${today}`
}


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
  hooks: {
    /*
     * THE FILE TAKES THE NAME OF THE THING IT IS.
     *
     * Files arrived called whatever their source called them — `cover-5.jpg`
     * from the last segment of a Content Studio URL, `IMG_4821.HEIC` from a
     * phone — and the library read as a list of serial numbers with the real
     * answer typed underneath. The description is that answer, and Content
     * Studio already sends one with every cover: `/api/media/from-url` refuses
     * a request without `alt`.
     *
     * ON CREATE ONLY, AND THAT IS THE WHOLE DESIGN. This is the one moment a
     * name is free: the object has not been written to R2, no derivative has
     * been cut, and nothing in the world points at it yet. A rename afterwards
     * is a different thing entirely — the adapter has no copy, the three
     * derivatives carry their own keys, and a newsletter that has already gone
     * out holds the old address in an `<img>` nobody can edit. So the name is
     * made right once rather than corrected later.
     *
     * THE EXTENSION COMES FROM THE FORMAT, NOT FROM THE OLD NAME — because
     * quite often there is no old name to take it from. An Article Studio cover
     * arrives as `/api/images/e5be14ed-a705-49b4-8aa3-5d827a2ef0bc`: a UUID with
     * no extension at all, which is what the Hub was calling the file. The
     * mimetype is the fact that survives every doorway — `from-url` reads it off
     * the response, an upload carries it from the picker — so it decides, and
     * the incoming name is only consulted when it happens to agree.
     */
    beforeOperation: [
      ({ args, operation }) => {
        if (operation !== 'create') return args

        const file = args.req?.file
        if (!file?.name) return args

        const extension = extensionFor(file.mimetype, file.name)
        const alt = typeof args.data?.alt === 'string' ? args.data.alt.trim() : ''

        if (alt) {
          file.name = `${stemFor(alt, file.mimetype)}${extension}`
          return args
        }

        /* NO DESCRIPTION, BUT STILL NOT A BARE ID. Nothing here can invent what
           the picture shows, so the name it came with stands — except that a
           name with no extension on it is not a filename, and that is exactly
           what arrives from Article Studio. Two files called
           `e5be14ed-…` and `a7f3c9e1-…` at least become openable ones. */
        if (extension && !file.name.toLowerCase().endsWith(extension)) {
          const dot = file.name.lastIndexOf('.')
          if (dot <= 0) file.name = `${file.name}${extension}`
        }

        return args
      },
    ],
  },
  endpoints: [
    /* Upload by URL, because a multipart upload cannot exceed Vercel's 4.5MB
       request body and generated covers now do. See endpoints/mediaFromUrl. */
    {
      path: '/from-url',
      method: 'post',
      handler: mediaFromUrlHandler,
    },
  ],
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
    // A library of files is browsed as cards, not read as rows (custom.scss),
    // so there is one column: the picture and what it is called. Credit said "—"
    // on every row, and the date is not what anyone opens this screen to find;
    // both are still on the document and in the column picker.
    defaultColumns: ['alt'],
    components: {
      beforeListTable: [
        // The phone's search: a disc on the header's line that opens into the
        // line. See SearchBar.tsx.
        '/components/admin/SearchBar#SearchBar',
      ],
    },
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
           * undescribed image, and that is checked on the article: `coverImage`
           * refuses to save without one (see Articles). */
          name: 'alt',
          /* THE FIELD IS `alt` AND THE WORD IS "Description". The name stays —
             every article cover reads it through the media relation, and
             renaming it is a migration for a word. The label is what an editor
             sees, and "Alt" is a piece of HTML: the cover well asks you to
             describe the picture, the list says a file needs a description, and
             this is the same request in the same words. It also fixes the
             search, which Payload builds from the label: "Search by Alt". */
          label: 'Description',
          type: 'text',
          /*
           * THE FILENAME IS THE DEFAULT DESCRIPTION.
           *
           * The library used to mark every undescribed file in red and wait for
           * someone to come back and write something. Most never got one, so the
           * mark was permanent decoration on a shelf of files whose names —
           * `studio-desk-with-type-specimens.jpg` — already said what they were.
           *
           * WITHOUT THE EXTENSION. `Google_Sans,Roboto.zip` describes itself as
           * "Google_Sans,Roboto"; `.zip` is how the file is packed, which the
           * picture on the card already says and no description should have to.
           *
           * Read, not written: the stored value stays empty until an editor
           * writes one, so this covers the files already here as well as the
           * next upload, and nothing has to be migrated. Anything that asks for
           * the description gets an answer — the card, the cover well, and the
           * article's own check.
           *
           * IT DOES SOFTEN THE ARTICLE'S CHECK. A cover with no description is
           * refused there, and now no file has none, so the refusal cannot fire.
           *
           * WHICH MATTERS IN ONE PLACE. On the page itself every image is
           * `alt=""` on purpose — a hero sits under its own headline, a card's
           * picture inside a link that already says the title — but the share
           * card reads this field into `og:image:alt`. So an undescribed file
           * now shares as its own name, which is a weak alternative text where a
           * written one would be a good one. It is the better of the two answers
           * available (the field was empty before), and the moment that is worth
           * more than the convenience, this fallback should give way to asking
           * the editor again.
           */
          hooks: {
            afterRead: [
              ({ data, value }) => {
                if (typeof value === 'string' && value.trim()) return value
                const filename = typeof data?.filename === 'string' ? data.filename : ''
                // Only a real extension: a trailing `.zip`, never the dot in a
                // name that simply has one.
                return filename.replace(/\.[A-Za-z0-9]{1,8}$/, '') || filename || value
              },
            ],
          },
          admin: {
            /* SHORT ENOUGH TO READ IN THE GLANCE IT GETS. It ran to two full
               sentences under a one-line field — "What the picture shows, for
               someone who cannot see it. Needed before it can go on a page." —
               which is a paragraph explaining a box you have already understood.
               Both facts survive: who it is for, and that it gates publishing. */
            description: 'For readers who can\'t see it. Defaults to the filename.',
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
            /* THE PARENTHESES ARE THE CONTENT, not a decoration added in CSS.
               It reads beside the label rather than under the field — "Credit
               (optional)" is one thing to read, where a label, a box and a
               word underneath it was three — and the brackets have to be in the
               string for a screen reader to hear them and a translator to keep
               them. See the credit field's rule in custom.scss. */
            description: '(optional)',
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
    /* NO META ROW AT THE FOOT. When it held a modified date and a created one
       it was a block of its own; with only the date it arrived, it was a fourth
       fact about the file standing apart from the other three in a different
       type. It is the fourth pair in MediaFacts now. Articles and resources
       keep theirs — a rail is where a document's provenance belongs. */
  ],
  upload: {
    staticDir: 'media',
    /* `/api/media/file/<name>` — the address files had before the move to R2,
       still in sent newsletters and link previews. It redirects to R2; files
       are served by Cloudflare and never come through here. See lib/storage. */
    handlers: [mediaFileRedirect],
    mimeTypes: [
      'image/*',
      'application/pdf',
      'image/svg+xml',
      'application/zip',
      'application/x-zip-compressed',
    ],
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
