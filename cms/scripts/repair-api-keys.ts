/**
 * Repair a `users.api_key` that was stored without Payload's encryption.
 *
 * WHAT WENT WRONG
 * ---------------
 * Payload keeps an API key encrypted, as `iv(32 hex chars) + ciphertext(hex)`,
 * and decrypts it in an afterRead hook on the `apiKey` field. That hook runs on
 * every read of the collection — including the one the Google sign-in callback
 * makes to look up an account by email.
 *
 * If the column instead holds a raw key (a UUID, say), `Buffer.from(value.slice(0,32),
 * 'hex')` stops at the first non-hex character, hands `createDecipheriv` a short
 * buffer, and Node throws `Invalid initialization vector`. Every read of that
 * user then throws, which means:
 *
 *   • Google sign-in 500s — the callback cannot look the account up.
 *   • The admin's Users list and that user's edit view 500s.
 *
 * So it cannot be fixed from the admin: the screens needed to fix it are the
 * screens that break. It has to be repaired underneath, which is this script.
 *
 * Authentication by API key keeps working throughout, which is what makes the
 * fault so confusing — Payload matches a key by `apiKeyIndex`, an HMAC of the
 * plaintext, and never decrypts to do it. Content Studio publishes happily
 * while nobody can sign in.
 *
 * WHAT THIS DOES
 * --------------
 * For each user with an API key, it tries to decrypt. On success it leaves the
 * row alone. On failure it treats the stored value as plaintext, encrypts it
 * properly, and writes it back through the database layer so the field hooks
 * do not encrypt a second time.
 *
 * `apiKeyIndex` is deliberately untouched. It is derived from the plaintext,
 * which does not change here — so any key already in use (Content Studio's
 * HUB_API_KEY) keeps working, and no environment variable needs updating.
 *
 * RUN IT
 * ------
 *   # against production — take DATABASE_URI from the Vercel project
 *   DATABASE_URI='postgres://…' PAYLOAD_SECRET='…' \
 *     npx tsx cms/scripts/repair-api-keys.ts
 *
 * PAYLOAD_SECRET must be the same one production runs with, or the re-encrypted
 * value will be unreadable there. Pass `--dry-run` to report without writing.
 */
import { getPayload } from 'payload'

const DRY_RUN = process.argv.includes('--dry-run')

/*
 * NODE_ENV IS SET BEFORE THE CONFIG IS LOADED, AND THAT ORDER MATTERS.
 *
 * The Postgres adapter is configured with `push: true`, which syncs the schema
 * from local code on connect — and it is gated on `NODE_ENV !== 'production'`:
 *
 *     process.env.NODE_ENV !== 'production' && … && this.push !== false
 *                       — @payloadcms/db-postgres/connect
 *
 * This script is run from a laptop, where NODE_ENV is unset, against the
 * PRODUCTION database. Left alone it would push whatever schema the local
 * checkout describes onto production as a side effect of a read-and-fix
 * script. Setting the variable first turns the push off; the config is then
 * imported dynamically so it reads the value rather than the default.
 */
// Cast: Next's types declare NODE_ENV read-only, which is a lie at runtime.
;(process.env as Record<string, string>).NODE_ENV = 'production'

const run = async () => {
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  // The database layer, not payload.find(): find() runs the afterRead hook that
  // is throwing, so it cannot be used to look at the very rows that are broken.
  const rows = await payload.db.find({
    collection: 'users',
    limit: 100,
    pagination: false,
    // Field hooks do not run at this level, so the value arrives as stored.
    req: undefined as never,
  })

  let broken = 0
  let repaired = 0

  for (const row of rows.docs as { id: number | string; email?: string; apiKey?: string | null }[]) {
    const stored = row.apiKey
    if (!stored) continue

    let ok = true
    try {
      payload.decrypt(stored)
    } catch {
      ok = false
    }

    if (ok) {
      console.log(`ok       ${row.email ?? row.id} — key decrypts`)
      continue
    }

    broken += 1
    console.log(`BROKEN   ${row.email ?? row.id} — stored value is not encrypted`)

    if (DRY_RUN) {
      console.log('         (dry run — not written)')
      continue
    }

    // The stored value IS the plaintext key, so encrypting it in place keeps
    // the key itself identical and leaves apiKeyIndex correct.
    const encrypted = payload.encrypt(stored)
    await payload.db.updateOne({
      collection: 'users',
      id: row.id,
      data: { apiKey: encrypted },
      req: undefined as never,
    })

    // Prove it, rather than assume it.
    const check = payload.decrypt(encrypted)
    if (check !== stored) throw new Error(`re-encryption did not round-trip for ${row.email ?? row.id}`)
    console.log('         repaired — key unchanged, now stored encrypted')
    repaired += 1
  }

  console.log(`\n${rows.docs.length} users, ${broken} broken, ${repaired} repaired.`)
  process.exit(0)
}

run().catch((err) => {
  console.error('FAILED:', err instanceof Error ? err.message : err)
  process.exit(1)
})
