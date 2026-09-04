import type { CollectionConfig } from 'payload'

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
 * read it back — it only ever appends. `create` is open because the endpoint
 * that writes here is public by nature; everything else is closed.
 */
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'locale', 'source', 'createdAt'],
    group: 'Audience',
    description: 'People who signed up for the newsletter. Export before a send.',
  },
  access: {
    /* The public form posts here through `/api/subscribe`, which validates
       first. Payload's own create is left open for that path rather than
       widened case by case. */
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Where the newsletter goes. One row per address.' },
    },
    {
      name: 'locale',
      type: 'select',
      defaultValue: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'ไทย (Thai)', value: 'th' },
      ],
      admin: {
        position: 'sidebar',
        description: 'The language they were reading when they signed up.',
      },
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'The page the form was on. Says which writing earns sign-ups.',
      },
    },
    {
      /* WHY A STATUS AND NOT A DELETE. Someone who unsubscribes has told you
         something you must not forget — deleting the row loses that, and the
         next import would mail them again. */
      name: 'status',
      type: 'select',
      defaultValue: 'subscribed',
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
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
