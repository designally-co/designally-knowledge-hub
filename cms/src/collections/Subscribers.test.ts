import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { buildConfig, getPayload, type Payload } from 'payload'
import { Subscribers } from './Subscribers'

let payload: Payload
let directory: string
let count = 0
const admin = { id: 1, collection: 'users' as const, email: 'admin@example.com' }

before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'subscriber-consent-'))
  payload = await getPayload({
    config: buildConfig({
      secret: 'isolated-subscriber-policy-tests-only',
      db: sqliteAdapter({ client: { url: `file:${path.join(directory, 'test.db')}` } }),
      collections: [Subscribers],
      typescript: { autoGenerate: false },
    }),
  })
})

after(async () => {
  await payload?.destroy()
  if (directory) await rm(directory, { recursive: true, force: true })
})

const pending = () => payload.create({
  collection: 'subscribers',
  data: { email: `person-${++count}@example.com`, locale: 'en', source: '/newsletter' },
})

test('anonymous and admin callers cannot bypass sign-up with generic create', async () => {
  for (const user of [undefined, admin]) {
    await assert.rejects(payload.create({
      collection: 'subscribers', overrideAccess: false, user,
      data: { email: 'injected@example.com', status: 'subscribed' },
    }))
  }
})

test('trusted sign-ups default to pending; even privileged creation cannot start subscribed', async () => {
  assert.equal((await pending()).status, 'pending')
  await assert.rejects(payload.create({
    collection: 'subscribers', data: { email: 'unconfirmed@example.com', status: 'subscribed' },
  }))
})

test('admin cannot change the consent address or sign-up provenance', async () => {
  const person = await pending()
  const updated = await payload.update({
    collection: 'subscribers', id: person.id, overrideAccess: false, user: admin,
    data: { email: 'someone-else@example.com', locale: 'th', source: '/invented' },
  })
  assert.equal(updated.email, person.email)
  assert.equal(updated.locale, 'en')
  assert.equal(updated.source, '/newsletter')
})

test('admin may unsubscribe but cannot confirm, reactivate, or reset to pending', async () => {
  const person = await pending()
  await assert.rejects(payload.update({
    collection: 'subscribers', id: person.id, overrideAccess: false, user: admin,
    data: { status: 'subscribed' },
  }))
  const stopped = await payload.update({
    collection: 'subscribers', id: person.id, overrideAccess: false, user: admin,
    data: { status: 'unsubscribed' },
  })
  assert.equal(stopped.status, 'unsubscribed')
  for (const status of ['pending', 'subscribed'] as const) {
    await assert.rejects(payload.update({
      collection: 'subscribers', id: person.id, overrideAccess: false, user: admin, data: { status },
    }))
  }
})

test('admin cannot erase an opt-out record; anonymous updates are refused', async () => {
  const person = await pending()
  await assert.rejects(payload.delete({ collection: 'subscribers', id: person.id, overrideAccess: false, user: admin }))
  await assert.rejects(payload.update({ collection: 'subscribers', id: person.id, overrideAccess: false, data: { status: 'subscribed' } }))
  assert.ok(await payload.findByID({ collection: 'subscribers', id: person.id }))
})

test('trusted confirmation, unsubscribe, and fresh sign-up flows still work', async () => {
  const person = await pending()
  for (const status of ['subscribed', 'unsubscribed', 'pending', 'subscribed'] as const) {
    const updated = await payload.update({ collection: 'subscribers', id: person.id, data: { status } })
    assert.equal(updated.status, status)
  }
})
