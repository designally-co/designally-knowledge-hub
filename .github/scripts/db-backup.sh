#!/usr/bin/env bash
#
# Nightly database backup, one database per call. Run by
# .github/workflows/db-backup.yml; see docs/backups.md for setup and restore.
#
#   db-backup.sh dump     pg_dump → $BACKUP_FILE
#   db-backup.sh upload   $BACKUP_FILE → R2 daily/ (and monthly/ on the 1st)
#   db-backup.sh verify   restore $BACKUP_FILE into a scratch Postgres and
#                         check $CHECK_TABLE came back with rows
#
# Upload runs BEFORE verify on purpose: if the restore check itself breaks
# (a tooling problem, not a bad dump), the night's copy is already safe and the
# run still fails loudly.
set -euo pipefail

: "${DB:?DB is required (hub, survey)}"
: "${BACKUP_FILE:?BACKUP_FILE is required}"

fail() { echo "::error::$DB: $*" >&2; exit 1; }

cmd_dump() {
  [ -n "${DATABASE_URL:-}" ] || fail "its DATABASE_URL secret is not set"
  # DUMP_SCHEMA limits the dump to one schema. The Hub sets it to `public`:
  # Supabase keeps its own managed schemas (auth, storage, …) in the same
  # database, and they are neither ours to back up nor restorable elsewhere.
  pg_dump \
    --format=custom --compress=9 \
    --no-owner --no-privileges \
    ${DUMP_SCHEMA:+--schema="$DUMP_SCHEMA"} \
    --dbname="$DATABASE_URL" \
    --file="$BACKUP_FILE"
  [ -s "$BACKUP_FILE" ] || fail "pg_dump wrote an empty file"
  echo "$DB: dumped $(du -h "$BACKUP_FILE" | cut -f1)"
}

cmd_upload() {
  : "${R2_ACCOUNT_ID:?}" "${R2_BUCKET:?}" "${AWS_ACCESS_KEY_ID:?}" "${AWS_SECRET_ACCESS_KEY:?}"
  local endpoint="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
  local day month
  day=$(date -u +%Y-%m-%d)
  month=$(date -u +%Y-%m)

  # Two tiers, each pruned by its own R2 lifecycle rule (docs/backups.md):
  # daily/ keeps 30 days, monthly/ keeps a year.
  aws s3 cp "$BACKUP_FILE" "s3://${R2_BUCKET}/daily/${DB}/${day}.dump" \
    --endpoint-url "$endpoint" --region auto --only-show-errors
  echo "$DB: uploaded daily/${DB}/${day}.dump"

  if [ "$(date -u +%d)" = "01" ] || [ "${FORCE_MONTHLY:-}" = "1" ]; then
    aws s3 cp "$BACKUP_FILE" "s3://${R2_BUCKET}/monthly/${DB}/${month}.dump" \
      --endpoint-url "$endpoint" --region auto --only-show-errors
    echo "$DB: uploaded monthly/${DB}/${month}.dump"
  fi
}

cmd_verify() {
  : "${VERIFY_URL:?VERIFY_URL is required (the scratch Postgres)}" "${CHECK_TABLE:?}"
  local target="${VERIFY_URL%/*}/restore_check"

  psql -X -q -v ON_ERROR_STOP=1 "$VERIFY_URL" \
    -c "drop database if exists restore_check" \
    -c "create database restore_check"

  # A one-schema dump carries `CREATE SCHEMA public`; a whole-database dump
  # does not. The fresh database already has `public`, so make room only when
  # the dump is going to create it.
  if pg_restore --list "$BACKUP_FILE" | grep -q ' SCHEMA - public '; then
    psql -X -q -v ON_ERROR_STOP=1 "$target" -c "drop schema public cascade"
  fi

  pg_restore --no-owner --no-privileges --exit-on-error --dbname="$target" "$BACKUP_FILE"

  local tables rows
  tables=$(psql -XAt "$target" -c "select count(*) from information_schema.tables
    where table_schema not in ('pg_catalog', 'information_schema')")
  rows=$(psql -XAt "$target" -c "select count(*) from ${CHECK_TABLE}")
  echo "$DB: restored ${tables} tables; ${CHECK_TABLE} has ${rows} rows"
  [ "$rows" -gt 0 ] || fail "${CHECK_TABLE} restored empty"
}

case "${1:-}" in
  dump) cmd_dump ;;
  upload) cmd_upload ;;
  verify) cmd_verify ;;
  *) echo "usage: $0 dump|upload|verify" >&2; exit 2 ;;
esac
