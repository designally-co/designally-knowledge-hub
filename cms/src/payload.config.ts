import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Articles } from './collections/Articles'
import { Resources } from './collections/Resources'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// ---------------------------------------------------------------------------
// Database — env-switchable, no code change between dev and production.
//   • Local dev:   DATABASE_URI=file:./designally-hub.db   → SQLite
//   • Production:  DATABASE_URI=postgres://…  (e.g. Neon)   → Postgres
// The adapter is chosen from the connection-string scheme.
// ---------------------------------------------------------------------------
const databaseURI = process.env.DATABASE_URI || 'file:./designally-hub.db'
const isPostgres = /^postgres(ql)?:\/\//i.test(databaseURI)

const db = isPostgres
  ? postgresAdapter({
      // NOTE: do NOT set pool.max to 1 here — Payload runs queries inside
      // transactions that hold a connection while needing another, so a
      // single-connection pool deadlocks and every query 500s. Leave the pool at
      // the driver default. (The intermittent post-deploy "error initializing
      // Payload" is transient pooler contention that clears on its own.)
      pool: { connectionString: databaseURI },
      // Isolate the Hub's tables in their own Postgres schema when set. REQUIRED
      // if you share one database with another app (e.g. the Content Generator
      // on Supabase) — otherwise `push` below could drop that app's tables.
      // Create it first: `create schema if not exists "<name>";`. Leave unset
      // when the Hub has its own database/project (uses the default `public`).
      ...(process.env.DB_SCHEMA ? { schemaName: process.env.DB_SCHEMA } : {}),
      // Auto-create / sync the schema on boot. Simplest path for this internal
      // CMS — a fresh DB gets its tables on first run, no migration files. Switch
      // to Payload migrations later for zero-risk / zero-cold-start schema syncs.
      push: true,
    })
  : sqliteAdapter({ client: { url: databaseURI } })

// ---------------------------------------------------------------------------
// File storage — env-switchable.
//   • Local dev:   no S3_* vars set → uploads saved to cms/media/ on disk.
//   • Production:  set S3_* vars    → uploads go to Cloudflare R2 (or any
//                  S3-compatible bucket). Object storage is effectively
//                  unlimited, so the media library scales without change.
// R2 needs a virtual/path-style endpoint and region "auto".
// ---------------------------------------------------------------------------
const s3Configured = Boolean(
  process.env.S3_BUCKET &&
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY,
)

// NOTE: enabling s3Storage injects the `S3ClientUploadHandler` client component
// into the admin, which must exist in the committed `admin/importMap.js`. Because
// S3 is only configured in production (env-gated above), a map generated with S3
// OFF would omit it and the admin would render blank in prod. So: regenerate the
// import map with the S3_* vars set (`S3_BUCKET=… … payload generate:importmap`)
// and COMMIT the result. The build intentionally does NOT regenerate the map
// (letting Vercel regenerate it risks dropping entries during its build) — the
// committed file is the single source of truth.
// The plugin is always in the config and switches itself off via `enabled`,
// rather than being omitted when S3 is unconfigured. That keeps the generated
// import map identical in every environment, which is the whole point: a map
// generated with the plugin absent omits its client component, and the
// production admin then renders blank with no error to go on.
const storagePlugins = [
  s3Storage({
    enabled: s3Configured,
    collections: { media: true },
    bucket: process.env.S3_BUCKET || '',
    config: {
      endpoint: process.env.S3_ENDPOINT || '',
      region: process.env.S3_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: true,
    },
  }),
]

// Origins allowed to call the REST/GraphQL API from the browser AND to be
// trusted for cookie auth (CSRF). This MUST include the admin's own production
// origin, or Payload rejects authenticated writes from it ("you are not allowed
// to perform this action") even though reads/login work.
//
// Vercel exposes the deploy's own hostnames at runtime, so the admin works with
// zero manual env config; FRONTEND_URL/PAYLOAD_PUBLIC_SERVER_URL are still
// honoured for a custom domain.
const vercelOrigins = [
  process.env.VERCEL_PROJECT_PRODUCTION_URL, // stable prod domain, e.g. hub.vercel.app
  process.env.VERCEL_URL, // this deployment's URL
  process.env.VERCEL_BRANCH_URL, // branch/preview URL
]
  .filter(Boolean)
  .map((host) => `https://${host}`)

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.PAYLOAD_PUBLIC_SERVER_URL,
  'http://localhost:3000',
  // Next falls back here when port 3000 is occupied by the Content Generator.
  // Keep the fallback origin trusted so authenticated admin writes still pass
  // Payload's CSRF check in local development.
  'http://localhost:3001',
  ...vercelOrigins,
].filter(Boolean) as string[]

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      // "Upload new" in the media picker, and the file chooser it opens. A
      // provider because the button it works on is Payload's own, rendered into
      // a portal from a tree with no component of ours in it. See UploadNew.
      providers: [
        '/components/admin/UploadNew#UploadNew',
        // Accessible names for the controls Payload draws as bare glyphs — the
        // pager's arrows, a panel's ⋯, a select's × and ⌄. See A11yNames.
        '/components/admin/A11yNames#A11yNames',
      ],
      // The mark and "Knowledge Hub" at the head of the nav. It replaces
      // Payload's bare 34px disc, which had no accessible name. See NavBrand.
      beforeNavLinks: ['/components/admin/NavBrand#NavBrand'],
      // Language and account, at the foot of the nav. Both came down from the
      // top bar, which is now only the breadcrumb. See NavFooter.
      afterNavLinks: ['/components/admin/NavFooter#NavFooter'],
      // The whole sign-in screen — the platform's door, ported. `beforeLogin` is
      // the only slot Payload offers on that page, so the composition arrives
      // inside its card and SignIn.css takes the card apart around it. The
      // password form stays behind it:
      // until Google sign-in has been used against production, removing the
      // other way in would let a misconfigured OAuth client lock everyone out.
      beforeLogin: ['/components/admin/SignIn#SignIn'],
      views: {
        // `/admin` is a door, not a screen: it redirects to the articles list.
        // It used to render "What needs you" — a triage dashboard over drafts,
        // missing Thai and thin summaries — which was removed along with the
        // readiness rules behind it. The sidebar is the table of contents and
        // the list is where the work happens, so the CMS opens there.
        dashboard: {
          Component: '/components/admin/DashboardRedirect#DashboardRedirect',
        },
      },
    },
    meta: {
      titleSuffix: '— Designally Hub',
      // Payload injects its own light/dark favicons into the admin, so the tab
      // showed Payload's mark on a Designally product. `app/icon.png` covers
      // the public site automatically; the admin needs telling.
      icons: [{ rel: 'icon', type: 'image/png', url: '/icon.png' }],
    },
    // Payload's default renders "August 5th 2026, 5:30 PM", which wraps to two
    // lines in a list column and doubles the height of every row. Editorial
    // work is filed by day, never by minute, so the clock is noise here. Set
    // globally rather than per field so every date in the admin agrees.
    dateFormat: 'd MMM yyyy',
    // The Designally design system is a light system: the page is parchment,
    // the things on it are white, and depth comes from a hairline rather than
    // a shadow. It does have a dark Field, but the system reserves that for a
    // moment of drama on one screen — it is not a second theme for a whole
    // product, and there are no dark values issued for cards, inputs or tables
    // to be built from. Payload's dark mode inverts its own elevation ramp, so
    // leaving the toggle on shipped an admin whose sidebar went dark while the
    // document stayed light and the text disappeared into it.
    theme: 'light',
  },
  collections: [Articles, Resources, Media, Users],
  editor: lexicalEditor(),
  // Bilingual content: English is the source (authored/generated); Thai is a
  // translation. Localized fields store a value per locale; `fallback` shows the
  // English value until a Thai one exists. The admin gets a locale switcher.
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'ไทย (Thai)', code: 'th' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db,
  sharp,
  cors: allowedOrigins,
  csrf: allowedOrigins,
  plugins: [...storagePlugins],
})
