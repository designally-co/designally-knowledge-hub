# Database backups

**This repo no longer backs up any database (since 2026-10-14).** Both
databases it used to back up live in Project Friday now: the Hub's (schema
`hub`, since 2026-10-12) and the Survey app's (schema `survey`, since
2026-10-14). Friday's own nightly backup covers them: every non-Supabase
schema, encrypted with the key holder's public key, restore proven every
night (designally-brain repo, workflow "Friday backup", `docs/backups.md`
there). The job that ran here (`db-backup.yml`, with `db-backup.sh` and
`backup-db-url.py`) was removed on 2026-10-14; why is in
`decisions/database-backup-by-project-friday.md`.

## What is still in the bucket

The last dumps this job made stay in the private R2 bucket
`designally-db-backups` until its lifecycle rules delete them:

```
daily/hub/       daily/survey/       one per night, deleted 30 days after upload
monthly/hub/     monthly/survey/     the 1st of each month, deleted after a year
```

They are `pg_dump` custom format, **not encrypted**, and hold user accounts,
subscriber e-mails and survey answers. The Hub's dumps from before
2026-10-12 hold the `public` schema; later ones hold `hub`. The Survey's hold
the whole Neon database, its tables in `public` (the last one was made the
night before they moved to `survey`).

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

The Hub dump holds only the `hub` schema (it was `public` until 2026-10-12, when
the tables moved: `docs/deploy-nas.md` §5a): Payload's tables, its enum types,
its migration history and its users. Supabase's own schemas are not included. Media files
are not in any dump. They live in R2 under `hub/`.

## Not covered

- **Media files.** R2 already stores them under `hub/`; there is no second copy.
