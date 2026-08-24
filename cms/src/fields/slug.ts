import type { Field } from 'payload'

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^\w\s-]/g, '') // strip punctuation
    .replace(/[\s_-]+/g, '-') // collapse whitespace/underscores to a single dash
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes

/**
 * A URL slug that auto-derives from `sourceField` on create/update when left
 * blank, but can be overridden by an editor. Returns an array so it can be
 * spread into a collection's `fields`.
 */
export const slugField = (sourceField = 'title'): Field[] => [
  {
    name: 'slug',
    type: 'text',
    index: true,
    unique: true,
    admin: {
      position: 'sidebar',
      description: 'Auto-filled from the title. Used in the URL.',
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => {
          if (typeof value === 'string' && value.length > 0) return toSlug(value)
          const source = data?.[sourceField]
          if (typeof source === 'string' && source.length > 0) return toSlug(source)
          return value
        },
      ],
    },
  },
]
