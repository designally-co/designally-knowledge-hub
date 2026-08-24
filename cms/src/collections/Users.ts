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
      'Accounts are created automatically the first time someone signs in with a Designally Google account. There is nothing to add here by hand.',
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
    // Add more fields as needed
  ],
  versions: false,
}
