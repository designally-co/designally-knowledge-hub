import type { GlobalConfig } from 'payload'

import { availableModels } from '../lib/availableModels'
import { DEFAULT_TRANSLATE_MODEL, MODEL_ID } from '../lib/translateModels'

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
  endpoints: [
    {
      /* GET /api/globals/settings/models — the models the dropdown offers,
         from Anthropic's live list (lib/availableModels). Signed-in only, like
         the setting itself. */
      path: '/models',
      method: 'get',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Unauthorized.' }, { status: 401 })
        return Response.json({ models: await availableModels() })
      },
    },
  ],
  fields: [
    {
      name: 'translateModel',
      /* TEXT, NOT A SELECT. A select is a Postgres enum, which refuses any
         model it was not created with — so a model Anthropic released after
         the migration could be shown but never saved. The choices now come
         from Anthropic's list at runtime; the shape of the id is checked here. */
      type: 'text',
      label: 'Thai translation model',
      validate: (value: string | null | undefined) =>
        !value || MODEL_ID.test(value) ? true : 'That is not a Claude model id.',
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
