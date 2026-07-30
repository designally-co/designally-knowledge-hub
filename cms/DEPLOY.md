# Deploying the Knowledge Hub to Vercel

The Hub is a Payload CMS + Next.js app living in **`cms/`** (the repo root is the
legacy Vite app — it is NOT deployed). Deploying is env-only: no code changes
between local dev (SQLite + local media) and production (Postgres + R2).

## Option: use Supabase for everything

Supabase is Postgres **and** its Storage is S3-compatible, so the Hub can run
entirely on Supabase (same service the Content Generator uses) — no Neon, no R2.

- **Database:** set `DATABASE_URI` to the Supabase **session pooler** connection
  (`…pooler.supabase.com:5432`). The transaction pooler (`:6543`) can't run the
  on-boot schema sync.
- **Media:** point the `S3_*` vars at Supabase Storage's S3 endpoint
  (`https://<ref>.supabase.co/storage/v1/s3`) instead of R2. See `.env.example`.
- **⚠️ Isolate from the Content Generator.** The Hub and the generator must not
  share tables. Either use a **separate Supabase project** for the Hub (cleanest),
  or the **same project with a dedicated schema**: run
  `create schema if not exists "hub";` in the SQL editor and set `DB_SCHEMA=hub`.
  Without isolation, the Hub's `push` on boot could **drop the generator's tables**.

If you go this route, replace "Neon" with the Supabase session-pooler string and
"R2" with the Supabase S3 vars throughout the steps below.

## 1. Provision services

**Neon (Postgres):**
- Create a project/database.
- Copy the **pooled** connection string (Neon → Connection Details → "Pooled
  connection"). Serverless functions need the pooler.
- It looks like: `postgresql://USER:PASSWORD@ep-xxxx-pooler.<region>.aws.neon.tech/dbname?sslmode=require`

**Cloudflare R2 (media/object storage) — required.**
Vercel is serverless/ephemeral, so the local `cms/media/` folder does NOT persist —
uploaded cover images would vanish. Media must go to R2.
- Create a bucket (e.g. `designally-hub-media`).
- Create an R2 API token (Account → R2 → Manage API Tokens).
- Note: bucket name, account endpoint, access key id, secret.

## 2. Create the Vercel project

- Import the GitHub repo `digigang/designally-knowledge-hub`.
- **Root Directory: `cms`** ← critical. The Next/Payload app is in `cms/`, not the repo root.
- Framework preset: **Next.js** (auto-detected). Build/Install commands: defaults.
- Node.js version: **20.x or newer**.
- Region: match/neighbour the generator (`sin1`) and the Neon region for low latency.

## 3. Environment variables (Vercel → Settings → Environment Variables)

| Var | Value |
|-----|-------|
| `PAYLOAD_SECRET` | random 32-byte hex — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DATABASE_URI` | the Neon **pooled** `postgresql://…?sslmode=require` string |
| `FRONTEND_URL` | the Hub's own production URL (e.g. `https://hub.designally.co`) |
| `PAYLOAD_PUBLIC_SERVER_URL` | same production URL |
| `S3_BUCKET` | `designally-hub-media` |
| `S3_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `S3_REGION` | `auto` |
| `S3_ACCESS_KEY_ID` | R2 access key id |
| `S3_SECRET_ACCESS_KEY` | R2 secret |

The DB adapter switches on the `DATABASE_URI` scheme (`postgres://` → Postgres),
and R2 turns on when the `S3_*` vars are present — no code change. See
`src/payload.config.ts`.

## 4. First deploy & schema

- Deploy. On first boot the Postgres adapter **auto-creates the schema**
  (`push: true` in `src/payload.config.ts`) — a fresh Neon DB gets its tables
  automatically. (Later, for zero-cold-start-cost schema changes, switch to
  Payload migrations: `payload migrate:create` + run `payload migrate` at release.)
- Open `https://<your-hub>/admin` → **create the first admin user**.

## 5. Create the Content Generator's API key (in production)

The local dev API key does NOT exist in the production DB. In the prod admin:
- Create a user, e.g. `content-generator@designally.co`.
- Enable **API Key** on that user and copy the generated key.
- That key is the generator's production `HUB_API_KEY`.

(Or run the helper against Neon:
`DATABASE_URI=<neon> node --env-file=.env --import tsx ./src/scripts/setupHubApiKey.ts`.)

## 6. Content

The production DB starts empty. Author content in the prod admin, or publish from
the Content Generator. (Local dev content does NOT migrate; the seed uses
placeholder data.)

## 7. Wire up the Content Generator (after the Hub is live)

In the **generator's** Vercel project env:
- `HUB_BASE_URL` = the Hub's production URL
- `HUB_API_KEY` = the production API key from step 5

Then merge `publish-taxonomy` → `main` in `content-studio` so its production build
includes the "Publish to Knowledge Hub" feature.

## Gotchas checklist

- [ ] Vercel **Root Directory = `cms`** (not the repo root).
- [ ] `DATABASE_URI` uses the Neon **pooled** endpoint.
- [ ] All five `S3_*` vars set (else covers are lost on serverless).
- [ ] `PAYLOAD_SECRET` set and stable (changing it invalidates sessions/keys).
- [ ] First admin user + Content-Generator API-key user created in prod.
- [ ] `FRONTEND_URL` / `PAYLOAD_PUBLIC_SERVER_URL` = the real prod origin.
