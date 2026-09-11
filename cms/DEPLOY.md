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
- **Media:** always Cloudflare R2 now (§1). The `S3_*` vars point at Supabase
  Storage's S3 endpoint only so files uploaded before the move keep loading —
  read-only. See `.env.example`.
- **⚠️ Isolate from the Content Generator.** The Hub and the generator must not
  share tables. Either use a **separate Supabase project** for the Hub (cleanest),
  or the **same project with a dedicated schema**: run
  `create schema if not exists "hub";` in the SQL editor and set `DB_SCHEMA=hub`.
  Without isolation, the Hub's `push` on boot could **drop the generator's tables**.

If you go this route, replace "Neon" with the Supabase session-pooler string
throughout the steps below.

## 1. Provision services

**Neon (Postgres):**
- Create a project/database.
- Copy the **pooled** connection string (Neon → Connection Details → "Pooled
  connection"). Serverless functions need the pooler.
- It looks like: `postgresql://USER:PASSWORD@ep-xxxx-pooler.<region>.aws.neon.tech/dbname?sslmode=require`

**Cloudflare R2 (media/object storage) — required.**
Vercel is serverless/ephemeral, so the local `cms/media/` folder does NOT persist —
uploaded cover images would vanish. On Vercel the build refuses to run without R2.
- The Hub shares the Content Generator's bucket, under the key prefix `hub/`
  (the generator's files are at the root, and the Hub never touches them).
- The bucket's custom domain (`https://img.designally.co`) is `R2_PUBLIC_URL`;
  Hub files are served from it directly, not through the Hub.
- Create an R2 API token (Account → R2 → Manage API Tokens), "Object Read &
  Write", scoped to the bucket.

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
| `R2_ACCOUNT_ID` | Cloudflare account id |
| `R2_ACCESS_KEY_ID` | R2 token access key id |
| `R2_SECRET_ACCESS_KEY` | R2 token secret |
| `R2_BUCKET_NAME` | the bucket name |
| `R2_PUBLIC_URL` | `https://img.designally.co` — https, no path, no trailing slash |
| `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Supabase Storage's S3 credentials — **read-only**, for files uploaded before the move to R2. Keep them while any such file is in use. |

The DB adapter switches on the `DATABASE_URI` scheme (`postgres://` → Postgres).
Storage is R2 on Vercel and local disk anywhere else — see `src/lib/storage.ts`.
All five `R2_*` must be set on Vercel; missing or partly set, the build fails
rather than deploying a Hub that cannot keep an upload.

## 4. Deploy & create the schema

Payload's `push` only runs in dev, so a **production DB does not get its tables
automatically**. The build is resilient (it returns empty data instead of
failing when the schema is missing), so the deploy itself succeeds — but you
must create the schema once before the admin/site work:

- **Create the schema** — run locally, pointed at your production Postgres:
  ```bash
  cd cms
  DATABASE_URI="<prod session-pooler url>" PAYLOAD_SECRET="<prod secret>" \
    node --import tsx ./src/scripts/pushSchema.ts
  ```
  Re-run it whenever the schema changes.
- Open `https://<your-hub>/admin` → **create the first admin user**.
- Published content appears on the public pages within the ISR window (~5 min)
  or on the next redeploy.

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
- [ ] All five `R2_*` vars set (else the build fails), and the `S3_*` vars kept
      for as long as media from before the move to R2 is in use.
- [ ] `PAYLOAD_SECRET` set and stable (changing it invalidates sessions/keys).
- [ ] First admin user + Content-Generator API-key user created in prod.
- [ ] `FRONTEND_URL` / `PAYLOAD_PUBLIC_SERVER_URL` = the real prod origin.
