import fs from 'fs'; import pg from 'pg'
const env = fs.readFileSync('.env.production.local','utf8')
const uri = (env.match(/^DATABASE_URI="?([^"\n]+)"?/m)||[])[1]
const c = new pg.Client({ connectionString: uri, ssl:{rejectUnauthorized:false} })
await c.connect()
const deadline = Date.now() + 20*60*1000
let last = null
while (Date.now() < deadline) {
  const r = await c.query(`select status, newsletter_sent_at from articles where id = 40`)
  const row = r.rows[0]
  if (!row) { console.log('article 40 no longer exists'); break }
  const state = `${row.status}/${row.newsletter_sent_at ?? 'null'}`
  if (state !== last) { console.log(`article 40 → status=${row.status} sentAt=${row.newsletter_sent_at ?? 'null'}`); last = state }
  if (row.newsletter_sent_at) { console.log('STAMPED — the send succeeded'); break }
  await new Promise(r => setTimeout(r, 15000))
}
await c.end()
