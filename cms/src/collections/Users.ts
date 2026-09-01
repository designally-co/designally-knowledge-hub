import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  /*
   * Accounts are provisioned by signing in, not by hand.
   *
   * Since the admin became Google-only there is no password form, so an
   * account made in here with an address outside designally.co could never be
   * used: nothing to type a password into, and the Google callback matches on
   * email so it would never adopt the row either. It would look like a real
   * account and be a dead one. Closing `create` removes that trap.
   *
   * The callback still creates users, because it passes `overrideAccess: true`
   * — this only stops a person doing it through the admin. Deleting stays
   * open, which is what tidying up an old account needs.
   */
  access: {
    create: () => false,
  },
  admin: {
    useAsTitle: 'email',
    description:
      'Created automatically on first Designally Google sign-in.',
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
  },
  // API-key auth so the Content Generator can post articles. Enable the key
  // per-user in the admin, then send:
  //   Authorization: users API-Key <key>
  //
  // This is a SEPARATE strategy from the password one refused below, and from
  // the cookie one Google sign-in uses. Blocking password login does not touch
  // it: the key is matched by `apiKeyIndex`, with no session and no person.
  auth: {
    useAPIKey: true,
  },
  hooks: {
    /*
     * There is no password way in. A Designally Google account is the only way
     * to reach this CMS, so `POST /api/users/login` — which stayed answerable
     * after the form was hidden — is refused outright.
     *
     * A HOOK, not `disableLocalStrategy`. Payload registers its JWT cookie
     * strategy only when the local strategy is enabled:
     *
     *     if (!collection.auth.disableLocalStrategy && !jwtStrategyEnabled)
     *                                     — payload/dist/index.js
     *
     * and Google sign-in issues a Payload cookie that exactly that strategy
     * reads back. Disabling local auth would therefore lock everyone out,
     * Google included. This hook runs inside the login OPERATION, which the
     * Google callback never calls — it signs its token directly — so SSO is
     * untouched while the password door is shut.
     *
     * KNOWN CONSEQUENCE: this removes the break-glass path. If the OAuth client
     * is ever misconfigured in production, recovery is a redeploy with this
     * hook removed, or a change in the database — not a password login.
     */
    beforeLogin: [
      () => {
        throw new APIError('Sign in with your Designally Google account.', 403)
      },
    ],
  },
  fields: [
    // Email added by default
    {
      // RENDERS NOTHING IN THE RAIL. It portals Save into the header band and a
      // heading into Payload's settings block, and marks the body so
      // AccountView.css can reach a screen that has no class of its own. A `ui`
      // field is the only slot Payload offers on the account route.
      name: 'accountView',
      type: 'ui',
      admin: {
        disableListColumn: true,
        position: 'sidebar',
        components: { Field: '/components/admin/AccountView#AccountView' },
      },
    },
    {
      // Says what the API key is for, beside the API key. It is the credential
      // Content Studio publishes with, and regenerating it stops that product
      // working until the new one is pasted in.
      name: 'apiKeyNote',
      type: 'ui',
      admin: {
        disableListColumn: true,
        position: 'sidebar',
        components: { Field: '/components/admin/AccountView#ApiKeyNote' },
      },
    },
    {
      // Last modified and Created, in the rail. They were a strip of type
      // across the top of the page, in the bar this screen no longer has — the
      // same move the article overview made, with the same component.
      name: 'documentMeta',
      type: 'ui',
      admin: {
        disableListColumn: true,
        position: 'sidebar',
        components: { Field: '/components/admin/DocActions#DocMeta' },
      },
    },
    {
      // Sign out, on the account screen rather than in the nav. It renders only
      // on your OWN user document — see SignOut.
      name: 'signOut',
      type: 'ui',
      admin: {
        position: 'sidebar',
        disableListColumn: true,
        components: { Field: '/components/admin/SignOut#SignOut' },
      },
    },
  ],
  versions: false,
}
