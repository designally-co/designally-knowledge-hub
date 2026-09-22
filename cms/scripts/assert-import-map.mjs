/**
 * Fails the build if the committed Payload import map is missing a client
 * component the production admin needs.
 *
 * Why this exists: the admin's import map is generated from whatever plugins are
 * active in the *generating* environment. The old S3 storage adapter was
 * env-gated and injected `S3ClientUploadHandler`, so a map generated without its
 * variables silently dropped it — and the production admin rendered completely
 * blank, with no error anywhere. That happened twice (378a3ac, d564d23).
 *
 * Media storage no longer injects any admin component (see lib/storage), so the
 * map is the same whichever environment generates it: `npm run
 * generate:importmap` needs no special variables. The guard stays because a
 * half-completed regeneration once left a three-line map that dropped the
 * rich-text editor, and that failure is just as invisible locally.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const mapPath = resolve(here, '../src/app/(payload)/admin/importMap.js')

// Everything the admin needs at runtime. If a component is required for the
// admin to work, it belongs in this list.
const REQUIRED = [
  {
    key: '/components/admin/SubscriberCells#SubscriberEmailCell',
    why: 'subscriber email is a list cell with an adjacent copy action',
  },
  {
    key: '/components/admin/SubscriberCells#SubscriberStatusCell',
    why: 'subscriber status expands the row with details and an unsubscribe action',
  },
  {
    key: '/components/admin/SubscribersRedirect#SubscribersRedirect',
    why: 'subscriber document routes return to the list instead of opening a modal',
  },
  {
    key: '/components/admin/DetailModals#DetailModals',
    why: 'media documents open over the list through this provider',
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
  {
    key: '/components/admin/SideNav#SideNav',
    why: "it is the admin's whole navigation; missing, Payload falls back to a nav this theme no longer styles",
  },
]

// TagSelector was required here until the tag field became a plain select, and
// S3ClientUploadHandler until storage moved off the S3 adapter. A guard that
// lists a component nobody registers any more fails every build for a component
// that is gone on purpose — so entries come out of this list when the thing
// they protect comes out of the config.

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
  console.error('  Regenerate it — `npm run generate:importmap` — check the diff, and')
  console.error('  commit the result. Refusing to build a blank admin.\n')
  process.exit(1)
}

console.log('import map: required client components present')
