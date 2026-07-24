/**
 * One-off migration: after switching the `tags` field from an array to a
 * hasMany select, the old `resources_tags` table is dropped/recreated by the
 * schema push (losing its rows). This restores the tags from a backup TSV
 * captured beforehand (parent_id|tag, one per line) via payload.update.
 *
 * Run:  TAGS_BACKUP=/path/to/tags-backup.tsv \
 *       node --env-file=.env --import tsx ./src/scripts/restoreTags.ts
 */
import { readFileSync } from 'fs'

import { getPayload } from 'payload'

import config from './../payload.config'

const run = async () => {
  // Initialising Payload runs the dev schema push (drops/recreates resources_tags).
  const payload = await getPayload({ config })

  const path = process.env.TAGS_BACKUP
  if (!path) throw new Error('TAGS_BACKUP env var (path to the backup TSV) is required')

  const byId = new Map<number, string[]>()
  for (const line of readFileSync(path, 'utf8').trim().split('\n')) {
    if (!line) continue
    const sep = line.indexOf('|')
    const id = Number(line.slice(0, sep))
    const tag = line.slice(sep + 1)
    if (!byId.has(id)) byId.set(id, [])
    byId.get(id)!.push(tag)
  }

  let n = 0
  for (const [id, tags] of byId) {
    await payload.update({ collection: 'resources', id, data: { tags } })
    n++
  }

  payload.logger.info(`✅ Restored tags for ${n} resources.`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
