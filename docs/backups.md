# Database backups

Every night at 02:00 Bangkok time, GitHub Actions backs up two databases to a
private Cloudflare R2 bucket:

| Database | Where it lives | Secret |
|---|---|---|
| `hub`: the Knowledge Hub | Supabase | `HUB_BACKUP_DATABASE_URL` |
| `survey`: the Survey platform | Neon | `SURVEY_BACKUP_DATABASE_URL` |

Each run dumps the database, uploads the dump, then **restores it into a
scratch Postgres** and checks a key table came back with rows. A green run
means the backup is proven to restore, not just that it exists.

- Workflow: `.github/workflows/db-backup.yml`
- Script: `.github/scripts/db-backup.sh`

## What is kept

```
daily/hub/2026-09-25.dump     one per night, kept 30 days
monthly/hub/2026-09.dump      the 1st of each month, kept 1 year
```

R2 lifecycle rules delete old files, not the workflow. Files are `pg_dump`
custom format (compressed).

## One-time setup

### 1. Cloudflare: bucket and token

1. **R2 → Create bucket** named `designally-db-backups`. Do **not** connect a
   custom domain or turn on public access. These files hold user accounts
   and subscriber emails. They must never be in the media bucket, which
   `img.designally.co` serves to the public.
2. In the bucket, go to **Settings → Object lifecycle rules** and add two rules:
   - prefix `daily/`: delete objects 30 days after upload
   - prefix `monthly/`: delete objects 365 days after upload
3. **R2 → Manage API tokens → Create token**: "Object Read & Write", applied
   to **that bucket only**. Keep the Access Key ID and Secret Access Key.

### 2. GitHub: secrets

Repo **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `R2_BACKUP_ACCOUNT_ID` | Cloudflare account ID (R2 overview page) |
| `R2_BACKUP_BUCKET` | `designally-db-backups` |
| `R2_BACKUP_ACCESS_KEY_ID` | from step 1.3 |
| `R2_BACKUP_SECRET_ACCESS_KEY` | from step 1.3 |

The two database secrets are **not** the apps' own connection strings. Both
apps connect through a transaction pooler. pg_dump there would leak its
session settings onto the connection a live app gets next. The helper
rewrites each one (Supabase session pooler on :5432, Neon's direct endpoint,
password percent-encoded) and pipes it straight in, so the password is never
shown:

```bash
python3 .github/scripts/backup-db-url.py hub cms/.env.production.local | gh secret set HUB_BACKUP_DATABASE_URL
```

```bash
python3 .github/scripts/backup-db-url.py survey ../designally-platform/.env.vercel | gh secret set SURVEY_BACKUP_DATABASE_URL
```

For Survey, first check that `.env.vercel` still points at the database the
NAS uses. The `DATABASE_URL` in the Portainer `survey` stack is the source of
truth.

### 3. First run

**Actions → Database backup → Run workflow**, tick "Also write this run to
monthly/", run. Both jobs should go green, and the bucket should hold
`daily/` and `monthly/` files for each database.

## When it fails

- GitHub emails a failed scheduled run to whoever last changed the workflow's
  schedule. Each database is its own job, so one failing never stops the
  other.
- **The restore check failed but the upload passed:** the night's dump is
  already in R2. The failure means it could not be proven to restore. Look at
  the "Prove it restores" log before trusting that file.
- **Hub dump fails with a connection error:** the Supabase project may be
  paused, or its password was reset. Re-run the helper above after any
  password change.
- **The repo is public:** GitHub switches off scheduled workflows after 60 days
  without a commit and emails a warning first. Re-enable it on the Actions tab.

## Restoring

Restore into a **new, empty** database first and check it there. Never
restore straight over production.

```bash
aws s3 cp s3://designally-db-backups/daily/hub/2026-09-25.dump . --endpoint-url https://<account-id>.r2.cloudflarestorage.com --region auto
```

(Or download the file from the bucket page in the Cloudflare dashboard.)

```bash
pg_restore --no-owner --no-privileges --dbname="<target database URL>" 2026-09-25.dump
```

The Hub dump holds only the `public` schema: Payload's tables, its migration
history and its users. Supabase's own schemas are not included. Media files
are not in any dump. They live in R2 under `hub/`.

## Not covered

- **Article Studio's database.** It is in the Designally Supabase org on the
  Pro plan, which keeps its own daily backups. To add it here anyway, add a
  matrix entry and a secret the same way.
- **Media files.** R2 already stores them; there is no second copy.
