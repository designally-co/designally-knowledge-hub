// Reads the /api/health body the Hub image answered in CI, and fails the job
// unless it describes a container that is fit to release.
//
// Usage: node .github/scripts/check-hub-health.mjs <health.json> <expected full commit>
//
// Health output is secret-free by design. This still prints only the fields it
// checks, so the job log carries nothing it does not need.
import { readFileSync } from 'node:fs'

const [file, expectedCommit] = process.argv.slice(2)
const health = JSON.parse(readFileSync(file, 'utf8'))

const checks = [
  ['answers ok', health.ok === true],
  ['reports the commit it was built from', Boolean(expectedCommit) && health.commitSha === expectedCommit],
  ['knows it is the NAS build', health.host === 'nas'],
  ['database answered', health.database?.ok === true],
  // CI has no R2 and does not set MEDIA_STORAGE. The workflow proves
  // separately that MEDIA_STORAGE=r2 without R2 is refused.
  ['media storage is local without MEDIA_STORAGE', health.mediaStorage?.backend === 'local'],
]

for (const [name, passed] of checks) console.log(`${passed ? 'pass' : 'FAIL'}  ${name}`)
console.log(
  JSON.stringify(
    {
      ok: health.ok,
      host: health.host,
      commitSha: health.commitSha,
      database: health.database,
      mediaStorage: health.mediaStorage,
    },
    null,
    2,
  ),
)

if (checks.some(([, passed]) => !passed)) process.exit(1)
