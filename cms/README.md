# Designally Knowledge Hub — CMS / Backend

The backend for the Hub, built on **[Payload CMS](https://payloadcms.com) 3.86**
(Node/TypeScript). It provides:

- The unified **Resource** content model (PRD §7.1 — one model, four+ types).
- An auto-generated **REST + GraphQL API** the frontend reads from.
- A non-technical **admin UI** for authoring (the PRD's "publish without a
  developer" requirement) at `/admin`.
- A **media library**, drafts/status, per-resource SEO fields, and access control.

This is a code-owned CMS: the schema lives in this repo as TypeScript, not in a
third-party service.

## Stack

| Piece      | Local dev (zero setup)                | Production                          |
| ---------- | ------------------------------------- | ---------------------------------- |
| CMS / API  | Payload 3.86 on Next.js 16 (App Router) | same                             |
| Database   | SQLite (`@payloadcms/db-sqlite`)      | **Postgres** (Neon), same schema   |
| File storage | local `cms/media/` folder           | **Cloudflare R2** (S3-compatible)  |
| Rich text  | Lexical (`@payloadcms/richtext-lexical`) | same                            |
| Images     | `sharp` (responsive derivatives)      | same                               |

### Dev ↔ production is env-only (no code change)

[`src/payload.config.ts`](src/payload.config.ts) picks the database adapter from
the `DATABASE_URI` **scheme** and enables object storage when the `S3_*` vars are
present:

- `DATABASE_URI=file:…` → SQLite; `DATABASE_URI=postgres://…` → Postgres.
- `S3_*` unset → uploads go to `cms/media/`; `S3_*` set → uploads go to R2.

So going live is: point `DATABASE_URI` at Neon and fill in the R2 `S3_*` vars in
`.env` (all documented in [`.env.example`](.env.example)). Nothing in the content
model, collections, or admin changes.

**Why this scales.** Articles are database rows (a few KB each — 100k articles is
a few hundred MB, trivial for Postgres). Uploaded files live in R2, which is
effectively unlimited. Traffic spikes are absorbed by static generation + CDN on
the frontend, independent of library size.

## Getting started

```bash
cd cms
cp .env.example .env          # then set PAYLOAD_SECRET to a long random string
npm install
npm run seed                  # loads sample content from ../src/data.js
npm run dev                   # http://localhost:3000  (admin at /admin)
```

On first visit to **http://localhost:3000/admin** you create the first admin
user. `npm run seed` is idempotent — it clears and reloads the seeded
collections, so it is safe to re-run.

## Scripts

| Script                       | Purpose                                              |
| ---------------------------- | ---------------------------------------------------- |
| `npm run dev`                | Dev server (admin UI + REST + GraphQL) on :3000      |
| `npm run seed`               | Seed categories/authors/resources from `../src/data.js` |
| `npm run generate:types`     | Regenerate `src/payload-types.ts` from the schema    |
| `npm run generate:importmap` | Regenerate the admin import map after schema changes |
| `npm run build` / `start`    | Production build / serve                             |

## Content model

One **`resources`** collection with a `type` discriminator, plus taxonomy and
media collections.

### `resources`

Shared fields: `title`, `slug` (auto from title), `summary`, `type`, `status`
(draft / scheduled / published), `publishedDate`, `category` (→ `categories`),
`tags` (free-form), `author` (→ `authors`), cover fields, `seo`
(metaTitle / metaDescription / ogImage), and `related` (→ `resources`).

Type-specific fields appear as conditional tabs driven by `type`:

| `type`     | Extra fields                                                        |
| ---------- | ------------------------------------------------------------------- |
| `article`  | `body` (rich text), `readTime`                                      |
| `template` | `files[]` (+ format), `fileSize`, `licence`, `previewImages[]`, `gated` |
| `video`    | `embedUrl`, `duration`, `collection` (→ course), `order`            |
| `course`   | `overview`, `level`, `lessons[]` (→ videos)                         |
| `tool`     | `toolUrl`, `logo`, `pricing`                                        |

**Cover imagery.** Alongside an uploaded `coverImage`, resources keep
`coverUrl` / `coverTint` / `coverRatio` text fields so the existing frontend's
placeholder Unsplash covers render unchanged until real assets are uploaded.

### Other collections

- **`categories`** — the curated topic taxonomy (`title`, `slug`, `featured`,
  `description`). Seeded from `topics` in `../src/data.js`; `featuredTopics`
  become `featured: true`.
- **`authors`** — bylines (`name`, `slug`, `bio`, `avatar`, `role`).
- **`media`** — uploads (covers, previews, logos, downloadable files) with
  responsive image sizes.
- **`users`** — CMS logins (Payload auth).

### Access control

Public API reads return **published** resources only; authenticated CMS users
see every status (drafts and scheduled included). See the `read` access
function in [`src/collections/Resources.ts`](src/collections/Resources.ts).

## API

Base URL in dev: `http://localhost:3000`. CORS is scoped to `FRONTEND_URL`
(default `http://localhost:5173`, the Vite app) plus `:3000`.

```bash
# REST
GET /api/resources?where[type][equals]=article&limit=10&depth=1
GET /api/resources?where[category.slug][equals]=case-study
GET /api/resources/:id
GET /api/categories?where[featured][equals]=true

# GraphQL
POST /api/graphql       # playground at /api/graphql-playground
```

## Seed data

[`src/seed.ts`](src/seed.ts) imports `BE_DATA` from
[`src/seed-data.js`](src/seed-data.js) — the single source of truth for the
sample library. It maps editorial cards → `article` resources and the resource
kit → `template` resources (all `published`). Videos, courses and tools have no
placeholder data yet, so those types seed empty.

Current seed: **34 categories, 29 resources** (23 articles + 6 templates).

## Not in this pass

Per the agreed scope, this first backend pass delivers the **data model + API +
seed**. Deferred to later passes: newsletter capture, email-gated download flow,
wiring the Vite frontend to fetch from this API (and the SSR/SSG migration the
SEO launch-gate needs), and production DB/hosting.
