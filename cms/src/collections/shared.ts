import type { CollectionConfig, Field, TextField } from 'payload'

/**
 * Fields and behaviour common to Articles and Resources.
 *
 * The two collections are deliberately separate — an article and a downloadable
 * file have almost nothing in common beyond a title — but publishing, slugs,
 * scheduling and SEO work identically for both, and that part should only exist
 * once. Anything genuinely shared lives here; anything type-specific stays in
 * the collection that owns it.
 */

/** Published items are public; signed-in editors see drafts too. */
export const publishedOrEditor: CollectionConfig['access'] = {
  read: ({ req: { user } }) => {
    if (user) return true
    return { status: { equals: 'published' } }
  },
}

/**
 * Stamp the publish date the first time something goes live, so listings — which
 * sort and limit by publishedDate — surface it. Applies to admin edits and API
 * writes alike; a date already set is respected.
 */
export const stampPublishedDate: NonNullable<CollectionConfig['hooks']>['beforeChange'] = [
  ({ data }) => {
    if (data?.status === 'published' && !data.publishedDate) {
      data.publishedDate = new Date().toISOString()
    }
    return data
  },
]

export const statusField: Field = {
  name: 'status',
  type: 'select',
  required: true,
  defaultValue: 'draft',
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
  ],
  admin: {
    position: 'sidebar',
    description: 'Draft is hidden from the public site.',
    components: {
      // Shared by Articles and Resources on purpose: "draft" should look the
      // same wherever it appears, or the reader has to learn two vocabularies.
      Cell: '/components/admin/ListCells#StatusCell',
    },
  },
}

export const publishedDateField: Field = {
  name: 'publishedDate',
  type: 'date',
  admin: {
    position: 'sidebar',
    date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
    // Hidden while the document is a draft. It is not required, and
    // `stampPublishedDate` above fills it in the moment status becomes
    // published — so on a draft it is an empty control asking for something
    // that will be answered for you.
    //
    // `condition` only governs whether the field is RENDERED; a value already
    // stored is kept, which matters for anything published, unpublished and
    // published again. The one thing it gives up is setting a date ahead of
    // time while still drafting, and there is no scheduled publishing here for
    // that to serve — the hook respects a date already set, so pre-dating is
    // still possible by publishing and then editing.
    condition: (data) => data?.status === 'published',
  },
}

/**
 * Banner at the top of a document saying which language you are editing in.
 *
 * Placed FIRST in the fields array on purpose: it warns about the locale, so it
 * has to appear above the fields the locale applies to. Renders nothing at all
 * in English, which is the case that needs no explanation.
 */
export const localeGuardField: Field = {
  name: 'localeGuard',
  type: 'ui',
  admin: {
        // A `ui` field is a component, not data. Payload still offers it in the
        // column picker, where choosing it would render this component inside a
        // table cell — "Article Read" tried to put a whole article in one.
        disableListColumn: true,
    components: {
      Field: '/components/admin/LocaleGuard#LocaleGuard',
    },
  },
}

/** Sidebar button: (re)generate the Thai version from the English source. */
export const translateToThaiField: Field = {
  name: 'translateToThai',
  type: 'ui',
  admin: {
        // A `ui` field is a component, not data. Payload still offers it in the
        // column picker, where choosing it would render this component inside a
        // table cell — "Article Read" tried to put a whole article in one.
        disableListColumn: true,
    position: 'sidebar',
    components: {
      Field: '/components/admin/TranslateToThaiButton#TranslateToThaiButton',
    },
  },
}

/**
 * Per-item search and share metadata.
 *
 * THE SHARE IMAGE IS THE COVER, and it is no longer asked for. The panel used
 * to end with an upload — "the cover above is used automatically, only set one
 * here if the share card needs a different picture" — for the case where the
 * two genuinely differ: a cover that is mostly texture, or one whose subject
 * sits where a 1.91:1 card crops.
 *
 * It was set on 0 of 22 articles and 0 of 6 resources. A field nobody has ever
 * filled is a question asked of every writer for the benefit of none, and the
 * fallback it existed to override was already doing the whole job. The share
 * card takes the cover; when the crop is wrong, the fix is the cover.
 *
 * A CONSTANT AGAIN. It was a function because the note under that upload had to
 * be true of two collections that differ — an article has a cover to fall back
 * to and a resource does not. With the upload gone there is nothing left that
 * differs, so there is no parameter.
 */
export const seoField: Field = {
  type: 'group',
  name: 'seo',
  label: 'SEO & sharing',
  admin: { description: 'Search results and share cards. Optional.' },
  fields: [
    { name: 'metaTitle', type: 'text', localized: true },
    { name: 'metaDescription', type: 'textarea', localized: true },
    {
      /* HIDDEN, NOT DELETED — the same call `fileSize` made, for the same
         reason. Both databases are pushed rather than migrated, and dropping a
         column that way stops on an interactive prompt, which hangs a boot. The
         field leaves the screen and the frontend stops reading it; the empty
         column stays where it is until there is a migration to take it. */
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Share image',
      admin: { hidden: true },
    },
  ],
}

/* Typed as `TextField`, not `Field`. Articles spread this to swap in their own
   control, and spreading the `Field` union widens it back to something no
   branch accepts. */
export const titleField: TextField = {
  name: 'title',
  type: 'text',
  required: true,
  localized: true,
  admin: {
    /* The label is hidden on the article's writing surface and the placeholder
       stands in its place, so an empty document still says what goes here. */
    placeholder: 'Title',
  },
}

export const summaryField: Field = {
  name: 'summary',
  type: 'textarea',
  localized: true,
  // "Deck" is what this is called in the trade and on the wireframe; the field
  // name stays `summary`, because renaming it would be a migration for a word.
  label: 'Deck',
  admin: {
    placeholder: 'One-sentence lede — also the card excerpt',
    description: 'One-sentence lede. Also the card excerpt.',
  },
}
