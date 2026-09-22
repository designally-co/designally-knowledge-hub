import type { CollectionConfig } from 'payload'
import { protectSubscriberConsent } from '../lib/subscriberConsent'

/**
 * People who asked to hear from us.
 *
 * WHY THE HUB HOLDS THEM RATHER THAN A MAIL PROVIDER. The form on the site was
 * inert — it prevented its own submit and did nothing — so every sign-up since
 * launch has been lost. Choosing a provider is a decision with a bill and an
 * account attached; keeping the list here is not, and it can be exported into
 * whichever provider wins later. The cost of waiting was a list of nobody.
 *
 * IT IS NOT A USER. Payload's `users` collection is who can sign in to the
 * admin; these are readers, they authenticate with nothing, and conflating the
 * two is how someone ends up with an admin account by subscribing to a
 * newsletter.
 *
 * READ ACCESS IS ADMINS ONLY. This is the one collection in the Hub holding
 * personal data of people who are not us, and the site itself never needs to
 * read it back. Sign-up and confirmation use trusted Local API calls; the
 * generic REST/GraphQL create route must not bypass email confirmation.
 */
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  disableBulkEdit: true,
  disableBulkDelete: true,
  disableDuplicate: true,
  admin: {
    useAsTitle: 'email',
    /*
     * THE LIST IS THE WHOLE SCREEN, as it is for Users. Nothing about a
     * subscriber can be edited: the address is the one they typed and
     * confirmed, the language and the page they signed up from record that
     * moment, and the status moves only when they confirm or leave. The one
     * exception — unsubscribing on their behalf — is a button, not a form.
     *
     * So the four facts worth scanning are columns, and the two that are not —
     * the sign-up path, and that button — open into the row. See
     * SubscriberCells.
     */
    defaultColumns: ['email', 'status', 'locale', 'signedUp'],
    hideAPIURL: true,
    // No `group`. It was "Audience", which put a second heading in the nav over
    // a group of one; the rail is a single list, as Content Studio's is, and
    // its order is the `collections` array in payload.config.
    description: 'Newsletter sign-ups and their subscription status.',
    components: {
      views: {
        // No document view: the route returns to the list. See
        // SubscribersRedirect.
        edit: {
          default: { Component: '/components/admin/SubscribersRedirect#SubscribersRedirect' },
        },
      },
    },
  },
  access: {
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    // An unsubscribe must retain the record that prevents future sending.
    // Erasure requests need a separate, deliberate privacy workflow.
    delete: () => false,
  },
  hooks: { beforeChange: [protectSubscriberConsent] },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      access: { update: () => false },
      admin: {
        readOnly: true,
        components: { Cell: '/components/admin/SubscriberCells#SubscriberEmailCell' },
      },
    },
    {
      name: 'locale',
      type: 'select',
      defaultValue: 'en',
      access: { update: () => false },
      options: [
        { label: 'English', value: 'en' },
        { label: 'ไทย (Thai)', value: 'th' },
      ],
      admin: { readOnly: true },
    },
    {
      /* NOT A COLUMN. A path per row crowds out the four facts the table is
         read for, and it is the one thing you look up about a single
         subscriber rather than scan down — so it is fetched by the row that
         opens. */
      name: 'source',
      type: 'text',
      access: { update: () => false },
      admin: { readOnly: true, disableListColumn: true },
    },
    {
      /* THE DATE, UNDER ITS OWN NAME. `createdAt` is when the row was written,
         which here is the moment the form was submitted — so the column says
         so. A `ui` field carries no value of its own; the cell reads
         `createdAt` off the row. See SubscriberCells. */
      name: 'signedUp',
      type: 'ui',
      label: 'Signed up',
      admin: {
        components: { Cell: '/components/admin/SubscriberCells#SubscriberSignedUpCell' },
      },
    },
    {
      /* WHY A STATUS AND NOT A DELETE. Someone who unsubscribes has told you
         something you must not forget — deleting the row loses that, and the
         next import would mail them again. */
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      admin: {
        readOnly: true,
        components: { Cell: '/components/admin/SubscriberCells#SubscriberStatusCell' },
      },
      options: [
        /* ASKED, BUT NOT YET PROVEN. The sign-up form records that someone
           typed this address; only the link in the confirmation email proves
           the person holding it agreed. `announce()` selects `subscribed`
           alone, so a pending row is never mailed a newsletter — it is a
           request, not a subscriber. */
        { label: 'Pending confirmation', value: 'pending' },
        { label: 'Subscribed', value: 'subscribed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
    },
  ],
  timestamps: true,
}
