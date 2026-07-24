import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  // API-key auth (alongside email/password) so the Content Generator can post
  // articles. Enable the key per-user in the admin, then send:
  //   Authorization: users API-Key <key>
  auth: {
    useAPIKey: true,
  },
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
  versions: false,
}
