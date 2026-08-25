/**
 * Dev helper: give a user an API key so the Content Generator can post
 * articles to a LOCAL Hub. Prints the key; put it in the CG's `.env.local` as
 * `HUB_API_KEY` (and restart the CG — Next reads env only at startup).
 *
 * Run:  node --env-file=.env --import tsx ./src/scripts/setupHubApiKey.ts
 *       …--import tsx ./src/scripts/setupHubApiKey.ts --email=someone@designally.co
 *
 * DEFAULTS TO THE SIGN-IN ACCOUNT, NOT A SEPARATE SERVICE USER. It used to
 * create `content-generator@designally.co`, matching how production was set up
 * at the time. Production now has one account — everyone arrives through Google
 * SSO, `Users.access.create` is closed, and the key lives on the same row that
 * people sign in with — so the old default made local behave unlike production
 * in exactly the area (auth) where that is most expensive to discover.
 *
 * Pass --email to target something else; the account must already exist, since
 * only the Google callback can create one.
 *
 * WHY THIS EXISTS AT ALL, when the admin has a checkbox for it: the local admin
 * is Google-only, and the OAuth client registers a redirect URI per port. Unless
 * `http://localhost:<port>/auth/google/callback` has been added to the client,
 * there is no way to sign in locally, and therefore no checkbox to tick.
 */
import { randomBytes } from 'crypto'

import { getPayload } from 'payload'

import config from './../payload.config'

const emailArg = process.argv.find((a) => a.startsWith('--email='))
const EMAIL = emailArg ? emailArg.slice('--email='.length) : 'website.team@designally.co'

const run = async () => {
  const payload = await getPayload({ config })
  const apiKey = `cg_${randomBytes(24).toString('hex')}`

  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: EMAIL } },
    limit: 1,
  })

  if (docs[0]) {
    await payload.update({
      collection: 'users',
      id: docs[0].id,
      data: { enableAPIKey: true, apiKey },
    })
  } else {
    // Deliberately not created here. `Users.access.create` is closed, and an
    // account made outside the Google callback could never be signed into —
    // it would look real and be a dead end. Sign in once, then rerun this.
    payload.logger.error(
      `No account ${EMAIL} in this database. Sign in once to create it, or pass --email for an account that exists.`,
    )
    process.exit(1)
  }

  payload.logger.info(`✅ Service user ${EMAIL} ready.`)
  payload.logger.info(`API key: ${apiKey}`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
