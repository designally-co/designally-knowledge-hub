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
// into the admin, which must exist in `admin/importMap.js`. Because S3 is only
// configured in production (env-gated above), a map generated locally would omit
// it and the whole admin would render blank in prod. The `build` script runs
// `payload generate:importmap` first (with prod env), so the map can't drift.
const storagePlugins = s3Configured
  ? [
      s3Storage({
        collections: { media: true },
        bucket: process.env.S3_BUCKET as string,
        config: {
          endpoint: process.env.S3_ENDPOINT as string,
          region: process.env.S3_REGION || 'auto',
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
          },
          forcePathStyle: true,
        },
      }),
    ]
  : []

// Origins allowed to call the REST/GraphQL API from the browser. The Vite
// frontend runs on 5173 in dev; set FRONTEND_URL to the deployed origin in prod.
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— Designally Hub',
    },
  },
  collections: [Resources, Media, Users],
  editor: lexicalEditor(),
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
