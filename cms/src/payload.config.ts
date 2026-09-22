import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Articles } from './collections/Articles'
import { Resources } from './collections/Resources'
import { Subscribers } from './collections/Subscribers'
import { mediaStoragePlugin } from './lib/storage'

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
      // DEVELOPMENT ONLY, WHICH IS WHAT IT ALWAYS WAS IN PRACTICE.
      //
      // This said `push: true` unconditionally, described as "a fresh DB gets
      // its tables on first run". Production never behaved that way: a column
      // added in the config simply never appeared in the live database, and the
      // first field that got SELECTED rather than merely declared — a date on
      // Articles and Resources — turned every read of both collections into a
      // 500. The proof it had been asleep for a while: `articles.tag` was still
      // NOT NULL there, several deploys after the config stopped saying so.
      //
      // So the flag now says what is true. Local SQLite keeps syncing itself on
      // boot; production changes shape only through a migration, which is a
      // file someone can read before it runs.
      push: process.env.NODE_ENV !== 'production',
    })
  : sqliteAdapter({ client: { url: databaseURI } })

// ---------------------------------------------------------------------------
// File storage — Cloudflare R2 under `hub/` on Vercel, required there; local
// disk everywhere else, development only. All of it is in `lib/storage`.
//
// It is Payload's own cloud-storage plugin with a small R2 adapter, rather than
// the S3 adapter it replaces, because that adapter uploads with no way to set
// Content-Disposition — so a resource's PDF would open in a tab instead of
// downloading. It also injects no admin component, so the import map no longer
// depends on which environment generated it.
// ---------------------------------------------------------------------------

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
  // The Hub's own domain. Vercel's variables name the deployment's `.vercel.app`
  // hostname, not a custom domain assigned to it, so a Hub reached at its real
  // address was not on its own allow-list: sign-in and reads worked, and the
  // first authenticated save came back "you are not allowed to perform this
  // action". Stated rather than derived because a config is built once, with no
  // request to read a host from — the same reason the localhost entries below
  // are written out.
  'https://hub.designally.co',
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
        // The studio's three faces, self-hosted through next/font and set on
        // the root as CSS variables. See AdminFonts.
        '/components/admin/AdminFonts#AdminFonts',
        '/components/admin/UploadNew#UploadNew',
        '/components/admin/DetailModals#DetailModals',
        // Accessible names for the controls Payload draws as bare glyphs — the
        // pager's arrows, a panel's ⋯, a select's × and ⌄. See A11yNames.
        '/components/admin/A11yNames#A11yNames',
        // Press and hold a row to choose several of them, on a phone where the
        // checkbox column is not worth its width. See RowSelect.
        '/components/admin/RowSelect#RowSelect',
        // On a phone, a document's top-left corner is a way back to its list
        // rather than the whole app's menu. See BackToList.
        '/components/admin/ListReturn#BackToList',
      ],
      // The whole navigation: Content Studio's side nav — the rail, its fold,
      // the phone drawer and its motion, the account menu — with the Hub's
      // destinations. It replaces Payload's nav rather than restyling it. See
      // SideNav.
      Nav: '/components/admin/SideNav#SideNav',
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
  /*
   * PAYLOAD'S OWN COPY, IN THIS ADMIN'S VOICE. An empty list said "No Results."
   * over "Either none exist or none match the filters you've specified above."
   * — a sentence about filters, pointing at a control that is above the list on
   * a desk and below it on a phone, in a product whose every
   * other line is plain ("Drafts are hidden from the site.", "One per article.
   * Sets the category."). Only the strings named here change; everything else
   * stays Payload's.
   */
  i18n: {
    translations: {
      en: {
        general: {
          noResultsFound: 'Nothing to show.',
          noResultsDescription: 'Either nothing has been added yet, or nothing matches your search.',
        },
      },
    },
  },
  collections: [Articles, Resources, Media, Subscribers, Users],
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
  plugins: [mediaStoragePlugin()],
})
