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
    /*
     * THE LIST IS THE WHOLE SCREEN. A user here is not a profile: the account
     * arrives through Google sign-in, its email is the Google account's and
     * editing it changes nothing anyone can sign in with, and a password can
     * never be used (see `beforeLogin` below). One thing is actually decided
     * about a user — whether they hold a key Content Studio publishes with —
     * and that is a switch, not a document.
     *
     * The table keeps the columns it had; only the last one changes. It printed
     * `enableAPIKey` as "true" — the raw value, and not the question anybody
     * asks of a row — and it is the switch now, which opens onto the key.
     */
    defaultColumns: ['email', 'updatedAt', 'createdAt', 'apiAccess'],
    components: {
      beforeListTable: [
        // The phone's search: a disc on the header's line that opens into the
        // line. See SearchBar.tsx.
        '/components/admin/SearchBar#SearchBar',
      ],
      views: {
        // The document view is gone; the route returns to the list. See
        // UsersRedirect.
        edit: {
          default: { Component: '/components/admin/UsersRedirect#UsersRedirect' },
        },
      },
    },
    // Ungrouped, like every collection: the nav is one list, ordered by the
    // `collections` array in payload.config, which puts Users last.
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
    /* DECLARED ONLY FOR ITS CELL. Payload adds `email` to every auth collection
       and links the first column of a list to the document; this collection's
       document is a redirect back to the list, so that link went nowhere. The
       field keeps Payload's own type and validation — this adds the cell that
       prints it as text. */
    {
      name: 'email',
      type: 'email',
      /*
       * THE ADDRESS CANNOT BE CHANGED — by anyone, through anything.
       *
       * It is not a setting, it is the account's identity: every account
       * arrives through Google sign-in, and the callback finds the account by
       * matching the Google address against this field. Rename it and the next
       * sign-in matches nothing and makes a second, empty account, while this
       * one — holding Content Studio's API key — can no longer be signed in to.
       *
       * FIELD ACCESS, NOT ONLY A READ-ONLY INPUT. `readOnly` stops the form;
       * `access.update` stops the REST API, the GraphQL API and any screen yet
       * to be written, because Payload strips a field the caller may not update
       * before it reaches the database. Creating still sets it — the Google
       * callback creates with `overrideAccess`, and create is closed to people
       * anyway (see `access` above).
       */
      access: {
        update: () => false,
      },
      admin: {
        readOnly: true,
        components: { Cell: '/components/admin/UserApiCell#UserEmailCell' },
      },
    },
    {
      // RENDERS NOTHING IN THE RAIL. It portals Save into the header band and a
      // heading into Payload's settings block, and marks the body so
      // AccountView.css can reach a screen that has no class of its own. A `ui`
      // field is the only slot Payload offers on the account route.
      name: 'accountView',
      type: 'ui',
      admin: {
        disableListColumn: true,
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
        components: { Field: '/components/admin/AccountView#ApiAccessPanel' },
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
        components: { Field: '/components/admin/AccountView#AccountMeta' },
      },
    },
    {
      /* API access, as a switch in the row. It stores nothing: `enableAPIKey`
         and `apiKey` are the auth fields Payload already keeps, and the cell
         writes to them through the REST API. Declared as a `ui` field because
         a column has to be a field, and this one is a control rather than a
         value.

         LAST IN THE ARRAY BECAUSE THAT IS LAST IN THE TABLE. `defaultColumns`
         chooses which columns appear; their ORDER follows the fields, and
         declared beside the email this one sat second. */
      name: 'apiAccess',
      type: 'ui',
      label: 'API access',
      admin: {
        components: { Cell: '/components/admin/UserApiCell#UserApiCell' },
      },
    },
  ],
  versions: false,
}
