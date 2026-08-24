import type { CollectionConfig, Field } from 'payload'

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
    description: 'Draft = hidden from the public site; Published = live. Publishing is manual.',
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
  },
}

/** Sidebar button: (re)generate the Thai version from the English source. */
export const translateToThaiField: Field = {
  name: 'translateToThai',
  type: 'ui',
  admin: {
    position: 'sidebar',
    components: {
      Field: '/components/admin/TranslateToThaiButton#TranslateToThaiButton',
    },
  },
}

export const seoField: Field = {
  type: 'group',
  name: 'seo',
  label: 'SEO',
  admin: { description: 'Per-item search metadata. Falls back to title/summary.' },
  fields: [
    { name: 'metaTitle', type: 'text', localized: true },
    { name: 'metaDescription', type: 'textarea', localized: true },
    { name: 'ogImage', type: 'upload', relationTo: 'media' },
  ],
}

export const titleField: Field = {
  name: 'title',
  type: 'text',
  required: true,
  localized: true,
}

export const summaryField: Field = {
  name: 'summary',
  type: 'textarea',
  localized: true,
  admin: {
    description:
      'Dek / subtitle: the one-sentence lede shown under the title, also used as the card excerpt and default meta description.',
  },
}
