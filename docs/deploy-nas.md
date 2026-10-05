# The Knowledge Hub on the Designally NAS

How the Hub moves from Vercel to the Designally NAS (Portainer, Caddy, images
from GHCR), with Vercel kept as the fallback. It follows the same runbook as
Article Studio and Survey, which moved on 15 and 16 September 2026.

**This document and the pull request that adds it change nothing in production.**
Every step marked **Ake approves** is a gate from the infrastructure runbook,
and nothing past it happens without that approval: deploying, DNS or Caddy,
Portainer access, database transfer or restore, entering or rotating secrets,
and deleting or resetting data.

No value of any secret appears here, and none should ever be added: not in this
file, the compose file, a pull request, a ticket or a chat.

---

## 1. What runs where

| Part | Today | After cutover |
|---|---|---|
| App | Vercel, `sin1`, deploys every push to `main` | Container `knowledge-hub` on the NAS, behind Caddy on `caddy_default`, deploys a release tag |
| Public URL | `https://hub.designally.co` | Unchanged |
| Vercel URL | `https://designally-knowledge-hub.vercel.app` | Kept, as the fallback (§9) |
| Database | Supabase Postgres | Unchanged. The NAS uses the session pooler (§4) |
| Media | Cloudflare R2, `hub/` prefix, `img.designally.co` | Unchanged |
| Newsletter | Resend, sent when an article is published | Unchanged |
| Analytics | Cloudflare Web Analytics | Unchanged; the token is baked into the image |
| Scheduler | none | none. The Hub has no cron |
| Backups | nightly `pg_dump` to R2 (`docs/backups.md`) | Unchanged. Vercel is a standby app, not a backup |

---

## 2. The image

`cms/Dockerfile`: linux/amd64, Node 22 on Alpine, Next.js standalone, run as
an unprivileged user. `.github/workflows/release.yml` builds and tests it on
every pull request that touches `cms/`, and publishes it only from a
`release-*` tag on a commit that is on `main`:

```bash
git tag release-YYYY-MM-DD <commit on main>
git push origin release-YYYY-MM-DD
```

The run summary gives the image (`ghcr.io/designally-co/designally-knowledge-hub:sha-<full commit>`),
its digest and the commit. There is no `latest`.

Four things are particular to the Hub:

- **The image is built without a database.** CI cannot have production's, so
  the pages Next pre-renders (homepage, about, contact, newsletter and the
  sitemap, in both languages) come out empty. `cms/deploy/start.mjs` starts the
  server and then re-renders each of those pages from the live database. It
  logs one line: `[warm] refreshed 10 of 10 pre-rendered pages from the database`.
  Anything less names the pages that failed. The ISR cache lives inside the
  container, so every new container starts this way.
- **English pages need `skipProxyUrlNormalize`** (`cms/next.config.ts`).
  Without it the English rewrite loops on the standalone server and every
  English page is a 500. The comment there explains why. CI checks that the
  pages answer 200.
- **Media goes to R2 because `MEDIA_STORAGE=r2`**, not because of Vercel
  (`cms/src/lib/storage.ts`). If R2 is missing, `/api/health` answers 500 and
  the container shows as unhealthy. It does not quietly save uploads to its own
  disk.
- **Sign-in follows the proxy.** Caddy names the reader's address in
  `X-Forwarded-Host`/`-Proto`, and `originFrom` uses it, so Google is sent back
  to `https://hub.designally.co`, not `0.0.0.0:3000`.

---

## 3. The stack

`cms/deploy/compose.production.yml` is the Portainer stack: container
`knowledge-hub`, no published ports, on the external `caddy_default` network,
health-checked on `/api/health`, with logs capped at 3 × 10 MB.

Caddy route, to append the way Article Studio's was (helper container, back up,
validate, reload, never restart):

```
hub.designally.co {
	reverse_proxy knowledge-hub:3000
}
```

---

## 4. Runtime variables

Copied from Vercel's Production environment, except where noted. Entered in
Portainer as stack variables.

| Variable | Notes |
|---|---|
| `IMAGE_TAG` | `sha-<full commit>` from the release summary |
| `DATABASE_URI` | The **session pooler**, `…pooler.supabase.com:5432`, not Vercel's 6543. Same user and password. The password has raw `@`/`!`, so it must be percent-encoded in the URL |
| `PAYLOAD_SECRET` | **Exactly** Vercel's. A new value signs everyone out, invalidates the Hub's API key for Article Studio, and breaks every unsubscribe and confirm link already sent |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | As Vercel |
| `ANTHROPIC_API_KEY` | As Vercel. `TRANSLATE_MODEL` is optional; the Account sheet setting wins |
| `RESEND_API_KEY`, `NEWSLETTER_FROM` | As Vercel. `NEWSLETTER_TEST_TO` stays empty |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | As Vercel |
| `MEDIA_FETCH_HOSTS` | Optional, as Vercel if it is set there |

Set in the compose file itself, not secret: `SITE_URL`,
`PAYLOAD_PUBLIC_SERVER_URL` and `FRONTEND_URL` (all `https://hub.designally.co`),
and `MEDIA_STORAGE=r2`.

Vercel marks some values Sensitive, which hides them. Article Studio's trial run
found that out the hard way: never reset the database password to recover one
while Vercel is live, because Vercel goes down until it is redeployed with the
new value.

---

## 5. Migrations

Nothing changes here. Schema changes go through Payload migrations, run from a
laptop against production **before** the code that needs them is deployed
anywhere (`VERCEL=0`, `y` on stdin; see the Hub's migration notes). The image
never migrates.

What is new is that two deployments read one database. Vercel deploys `main`
the moment it is pushed, and the NAS runs whatever release tag Portainer is
on. So "before the code deploys" now means before the merge to `main` *and*
before the release tag reaches the NAS.

---

## 6. Things that do not change

- **Google OAuth.** `https://hub.designally.co/auth/google/callback` is already
  registered. No new redirect URI.
- **Uploads.** The admin stages files in R2 under `hub/_incoming/`. Files over
  4 MB go straight from the browser to R2, which needs the bucket's CORS rule
  to allow `https://hub.designally.co`. It already does, because the origin
  doesn't change.
- **Article Studio.** It publishes to `HUB_BASE_URL`. Confirm that is
  `https://hub.designally.co` and not the `.vercel.app` address, or its
  publishes would keep landing on Vercel after cutover. Same database, so
  nothing would be lost, but it would not be testing the NAS.

---

## 7. Cutover, proposed

Each step waits for the one before it.

1. Merge this pull request. Vercel stays production and keeps deploying `main`.
2. Tag a release (§2). Record the image, digest and commit.
3. **Ake approves:** create the Portainer stack with `IMAGE_TAG` and the §4
   variables. Record the rollback point: the current Vercel production
   deployment and its commit, and the current `hub.designally.co` DNS record.
4. Start the stack. Check it inside the NAS, before any traffic:

   ```bash
   docker exec knowledge-hub wget -qO- http://127.0.0.1:3000/api/health
   docker logs knowledge-hub 2>&1 | grep '\[warm\]'
   ```

   Expect `ok: true`, `host: "nas"`, `commitSha` equal to the release commit,
   `database.articles` equal to Vercel's `/api/health`,
   `mediaStorage.backend: "r2"` with `ok: true`, nothing in `missing`, and
   `[warm] refreshed 10 of 10`.
5. **Ake approves:** the DNS change and then the Caddy route, **in that
   order**. Caddy proves the name with TLS-ALPN on 443 (port 80 isn't
   forwarded), which only works once DNS points at the NAS. A route reloaded
   before the record changes fails, backs off for up to 10 minutes, and has hit
   Let's Encrypt's "service busy" (Survey, 16 Sep 2026). So: CNAME
   `hub.designally.co` → `ddns.designally.co`, DNS only; then append the route
   and reload Caddy at once. Expect a minute or so of certificate errors
   between the two.
6. Check public health: `https://hub.designally.co/api/health` shows
   `host: "nas"` and the release commit.
7. Run the smoke suite (§10).
8. The agreed observation window.

---

## 8. Rollback

No data moves. Vercel and the NAS use the same database and the same bucket.

- **The NAS is unhealthy after routing.** Point the `hub.designally.co` CNAME
  back at the Vercel target recorded in step 3 (TTL about 300 s). Vercel never
  stopped running.
- **A bad release on the NAS.** Set `IMAGE_TAG` to the previous `sha-…` and
  update the stack.
- **A release that ran a migration.** Hub migrations are additive, so older
  code still runs against them. Rolling back past one still needs its own
  plan.

---

## 9. Vercel as the fallback

Vercel stays running, on the production database, deploying `main` — and
only `main`: `cms/vercel.json` switches off branch previews, which always
failed anyway (the Preview environment has no R2, and the build refuses to
run without it). Rollback is then one DNS change. Unlike Article Studio, the Hub has no cron
to switch off, and its Git deploys can stay connected.

What to keep in mind while both run:

- **Version skew.** Vercel will usually run newer code than the NAS: it gets
  every merge, the NAS only gets release tags. That is fine for a fallback, but
  §5 applies to both.
- **A second public copy.** `designally-knowledge-hub.vercel.app` serves the
  whole site. Its canonical address is `hub.designally.co` (Vercel's `SITE_URL`
  / `PAYLOAD_PUBLIC_SERVER_URL`; check both are set), but turning on Vercel's
  Deployment Protection is cleaner. It hides the copy from crawlers and stops
  the team editing through the old admin out of habit. Protection must come
  off again before a rollback.
- **Newsletters.** Whichever deployment handles a publish sends the email.
  `newsletterSentAt` stops the same article being announced twice, whichever
  side tries.
- **Connections.** Vercel uses the transaction pooler and the NAS the session
  pooler, on the same project. Payload's pool is 10 connections per process.
  Check Supabase's session-mode limit allows for it.

After sign-off, Vercel can become an internal clone, as Survey's will. It needs
its own database before it can be used for testing.

---

## 10. Acceptance

- `/api/health`: as in step 4, from outside.
- Homepage, an article, a resource and a category page, in English and in Thai.
- `/sitemap.xml` lists every published article on `https://hub.designally.co/…`.
- Sign in to `/admin` with Google.
- Upload an image over 4 MB in the admin and confirm its `img.designally.co/hub/…`
  URL opens.
- Publish a test draft from Article Studio (Draft, not Published, so no
  newsletter goes out), and confirm it arrives with its cover and Thai version.
- A page view shows in Cloudflare Web Analytics.
- Container memory after a few hours (`docker stats knowledge-hub`). The host
  has 4 GB and already runs Article Studio and Survey.

---

## 11. Open decisions for Ake

- [ ] **Cloudflare in front.** Today the Hub sits behind Vercel's CDN. On the
      NAS, every visitor reaches the office line directly. Proxying
      `hub.designally.co` through Cloudflare (orange cloud) would cache pages,
      hide the office IP and absorb spikes. But Caddy can't then use TLS-ALPN,
      so it would need a Cloudflare Origin certificate or the DNS challenge.
      Decide before cutover: it changes step 5.
- [ ] **Port 80.** Still not forwarded, which is why certificates depend on
      TLS-ALPN and why a bare `http://` address times out.
- [ ] **GHCR.** The `designally-knowledge-hub` package is new. Confirm
      Portainer's registry login can pull it with the first pull.
- [ ] **Secret entry.** Who copies the §4 values from Vercel into Portainer,
      and how.
- [ ] **Resources.** A memory limit for the container on the 4 GB host.
- [ ] **Vercel.** Deployment Protection while it is the fallback, and how long
      it stays one.
- [ ] **Window.** The maintenance window and the rollback deadline.
