---
title: The Hub's database is backed up by Project Friday's backup, not by this repo's job
app: knowledge-hub
decided: 2026-10-14
author: ai
sources:
  - "Buk, 2026-10-14 (agreed to remove the Hub from this repo's nightly backup before the old project is deleted)"
  - .github/workflows/db-backup.yml
  - docs/backups.md
  - "https://github.com/designally-co/designally-brain/blob/main/docs/backups.md"
---

## Context

This repo's nightly job backed up the Hub's database, then still in its own Supabase project, together with the Survey app's. On 2026-10-12 the Hub's database moved into Project Friday (schema `hub`). After that the job still read the old project, which nothing used any more, and P Aek wanted the old projects deleted, after which the job would have failed every night.

## Decision

The Hub entry is removed from `.github/workflows/db-backup.yml`; the job now backs up only the Survey app's database. The Hub's data is in Project Friday's nightly backup (designally-brain, workflow "Friday backup"), which dumps every non-Supabase schema, `hub` included. The Hub's last dumps made here stay in the bucket until the lifecycle rules remove them.

## Why

Friday's backup already holds the same data, encrypted with the key holder's public key, with a restore check every night (250 tables restored, 0 missing, on 2026-10-14). This repo's dumps were not encrypted and hold subscriber e-mails, so keeping a second, weaker copy of a database that no longer changes there brought nothing, and the job would have broken once the old project was gone.
