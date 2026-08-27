/**
 * Fails the build if the committed Payload import map is missing a client
 * component the production admin needs.
 *
 * Why this exists: the admin's import map is generated from whatever plugins are
 * active in the *generating* environment. S3 storage is env-gated and only
 * configured in production, so running `payload generate:importmap` on a machine
 * without the S3_* variables silently drops `S3ClientUploadHandler` — and the
 * production admin then renders completely blank, with no error anywhere. The
 * server still sends a correct page; the client just cannot build it.
 *
 * That has now happened twice (378a3ac fixed it, d564d23 reintroduced it), and
 * the note in payload.config.ts was not enough to stop it, because the failure
 * is invisible locally: dev regenerates the map on the fly, so the admin works
 * on localhost right up until it is deployed.
 *
 * To regenerate the map correctly, do it with S3 configured:
 *   S3_BUCKET=x S3_ENDPOINT=x S3_ACCESS_KEY_ID=x S3_SECRET_ACCESS_KEY=x \
 *     npm run generate:importmap
 * The values only need to be non-empty — they gate the plugin, they are not
 * contacted while generating.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const mapPath = resolve(here, '../src/app/(payload)/admin/importMap.js')

// Everything the admin needs at runtime. Checking only the S3 entry was not
// enough: a regeneration that half-completed once left a three-line map that
// still passed, having quietly dropped the rich-text editor and the tag field.
// If a component is required for the admin to work, it belongs in this list.
const REQUIRED = [
  {
    key: '@payloadcms/storage-s3/client#S3ClientUploadHandler',
    why: 's3Storage is enabled in production; without this the admin renders blank',
  },
  {
    key: '@payloadcms/richtext-lexical/rsc#RscEntryLexicalField',
    why: 'the article body is a richText field and cannot render without the Lexical editor',
  },
  {
    key: '/components/admin/TranslateToThaiButton#TranslateToThaiButton',
    why: 'the Translate to Thai button is mounted on both collections',
  },
  {
    key: '/components/admin/CoverPreview#CoverPreview',
    why: "the article's cover is only visible through this component",
  },
  {
    key: '/components/admin/LocaleGuard#LocaleGuard',
    why: 'without it, creating in the wrong locale gives no warning at all',
  },
  {
    key: '/components/admin/DashboardRedirect#DashboardRedirect',
    why: 'it replaces the admin landing view; missing, the dashboard is blank',
  },
]

// TagSelector was required here until the tag field became a plain select. A
// guard that lists a component nobody registers any more fails every build for
// a component that is gone on purpose — so entries come out of this list when
// the thing they protect comes out of the config.

let map
try {
  map = readFileSync(mapPath, 'utf8')
} catch {
  console.error(`\n  Cannot read the Payload import map at:\n    ${mapPath}\n`)
  process.exit(1)
}

const missing = REQUIRED.filter((entry) => !map.includes(entry.key))

if (missing.length > 0) {
  console.error('\n  Payload import map is missing required client components:\n')
  for (const entry of missing) {
    console.error(`    ${entry.key}`)
    console.error(`      ${entry.why}\n`)
  }
  console.error('  This was almost certainly caused by regenerating the map without the')
  console.error('  S3_* environment variables set. Regenerate it with them present:\n')
  console.error('    S3_BUCKET=x S3_ENDPOINT=x S3_ACCESS_KEY_ID=x S3_SECRET_ACCESS_KEY=x \\')
  console.error('      npm run generate:importmap\n')
  console.error('  then commit the result. Refusing to build a blank admin.\n')
  process.exit(1)
}

console.log('import map: required client components present')
