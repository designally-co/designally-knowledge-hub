---
title: The Hub's database is backed up by Project Friday's backup; this repo's backup job is retired
app: knowledge-hub
decided: 2026-10-14
author: ai
sources:
  - "Buk, 2026-10-14 (agreed to remove the Hub from this repo's nightly backup before the old project is deleted)"
  - "Buk, 2026-10-14 (asked to do the survey's clean-up the same day it moved into Project Friday)"
  - docs/backups.md
  - "https://github.com/designally-co/designally-brain/blob/main/docs/backups.md"
---

## Context

This repo's nightly job backed up the Hub's database, then still in its own Supabase project, together with the Survey app's. On 2026-10-12 the Hub's database moved into Project Friday (schema `hub`). After that the job still read the old project, which nothing used any more, and P Aek wanted the old projects deleted, after which the job would have failed every night.

## Decision

The Hub entry is removed from `.github/workflows/db-backup.yml`; the job now backs up only the Survey app's database. The Hub's data is in Project Friday's nightly backup (designally-brain, workflow "Friday backup"), which dumps every non-Supabase schema, `hub` included. The Hub's last dumps made here stay in the bucket until the lifecycle rules remove them. The same day the Survey app's database moved into Project Friday too (schema `survey`), so the job had nothing left to back up: the workflow and its two scripts were removed (last version: https://github.com/designally-co/designally-knowledge-hub/blob/b6deec9a310b2e55e22c1a24cd45e0d5d35ca9c6/.github/workflows/db-backup.yml). The Survey's last dumps made here stay in the bucket the same way.

## Why

Friday's backup already holds the same data, encrypted with the key holder's public key, with a restore check every night (250 tables restored, 0 missing, on 2026-10-14). This repo's dumps were not encrypted and hold subscriber e-mails, so keeping a second, weaker copy of a database that no longer changes there brought nothing, and the job would have broken once the old project was gone.
