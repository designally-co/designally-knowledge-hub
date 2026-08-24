import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    // Hides the "API" tab beside "Edit". It is a read-only JSON viewer for
    // developers and nothing an editor needs; despite the name this gates the
    // tab AND its route, not just the URL shown inside it.
    //
    // This does NOT affect the REST API itself. Content Studio still posts to
    // /api/articles/from-markdown, translation still runs through
    // /api/articles/:id/translate-to-thai, and the public site still reads
    // through Payload as before. Only the admin's viewer for it is gone.
    hideAPIURL: true,
    // See the note on Media: ungrouped collections sort above grouped ones, so
    // "Account" is what keeps Users last rather than first.
    group: 'Account',
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
