/**
 * Dev helper: create (or update) a dedicated "Content Generator" service user
 * with an API key, so the Content Generator can post articles. Prints the key.
 *
 * Run:  node --env-file=.env --import tsx ./src/scripts/setupHubApiKey.ts
 */
import { randomBytes } from 'crypto'

import { getPayload } from 'payload'

import config from './../payload.config'

const EMAIL = 'content-generator@designally.co'

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
    await payload.create({
      collection: 'users',
      data: {
        email: EMAIL,
        name: 'Content Generator',
        password: randomBytes(18).toString('hex'),
        enableAPIKey: true,
        apiKey,
      },
    })
  }

  payload.logger.info(`✅ Service user ${EMAIL} ready.`)
  payload.logger.info(`API key: ${apiKey}`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
