import type { GlobalConfig } from 'payload'

import { DEFAULT_TRANSLATE_MODEL, TRANSLATE_MODELS } from '../lib/translateModels'

/**
 * Site-wide settings: one row, not one per person.
 *
 * NOT IN THE NAV. Its one field is edited from the account sheet, which the
 * people who run the Hub already open from the account menu
 * (components/admin/TranslationModel); a nav entry for a single dropdown would
 * be a screen holding one line.
 */
export const Settings: GlobalConfig = {
  slug: 'settings',
  admin: { hidden: true },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'translateModel',
      type: 'select',
      label: 'Thai translation model',
      options: TRANSLATE_MODELS.map(({ label, value }) => ({ label, value })),
      hooks: {
        /* Until someone picks one, the model is what it was before this
           setting existed: the TRANSLATE_MODEL env var, then the default. So
           the screen shows the model actually in use, and translate.ts reads
           the same answer. */
        afterRead: [({ value }) => value || process.env.TRANSLATE_MODEL || DEFAULT_TRANSLATE_MODEL],
      },
    },
  ],
}
