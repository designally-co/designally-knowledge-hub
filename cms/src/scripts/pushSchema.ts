/**
 * One-time: create/sync the Payload schema in a Postgres database.
 *
 * Production builds/runtime do NOT auto-create the schema (Payload's `push` is a
 * dev-only feature). Run this locally, pointed at your production Postgres
 * (e.g. Supabase), to create all tables before the first real deploy:
 *
 *   cd cms
 *   DATABASE_URI="postgresql://…session-pooler…:5432/postgres" \
 *   PAYLOAD_SECRET="<your prod secret>" \
 *   node --import tsx ./src/scripts/pushSchema.ts
 *
 * Initialising Payload here (not NODE_ENV=production) runs the schema push.
 * Re-run it any time the schema changes.
 */
import { getPayload } from 'payload'

import config from './../payload.config'

const run = async () => {
  const uri = process.env.DATABASE_URI ?? ''
  if (!/^postgres(ql)?:\/\//i.test(uri)) {
    throw new Error('DATABASE_URI must be a postgres:// connection string (your production DB).')
  }
  const payload = await getPayload({ config })
  payload.logger.info('✅ Schema created / synced. Tables are ready.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
