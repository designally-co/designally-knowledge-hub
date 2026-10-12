---
title: The Hub's tables live in the Postgres schema hub, not public
app: knowledge-hub
decided: 2026-10-12
author: ai
sources:
  - "Buk, 2026-10-09 (P Aek decided that every Supabase project is combined into Project Friday, the company's one project)"
  - "Buk, 2026-10-12 (asked to move the Knowledge Hub after Article Studio, in the same phases)"
  - cms/src/payload.config.ts
  - cms/deploy/move-to-schema-hub.sql
  - docs/deploy-nas.md
---

## Context

The Hub had its own Supabase project, with its 19 tables and 9 enum types in `public`. It is moving into Project Friday, which already holds other apps' tables and HR and payroll data. The brain and Article Studio moved there first, each into its own schema (`brain`, `studio`), with a database user that reaches that schema only.

## Decision

The Hub's tables and enum types live in the schema `hub`. The code already supported it: `payload.config.ts` passes `DB_SCHEMA` to Payload's `schemaName`, and the stack file now passes `DB_SCHEMA` to the container. The move is a one-off SQL file run by hand in one transaction (`cms/deploy/move-to-schema-hub.sql`), not a Payload migration, because Payload's own history table moves with the rest and a migration could not record itself. The setting and the tables change at the same moment: Payload looks for both its tables and its enum types in the schema it is given. Three steps, as for Article Studio: this change; then the move in the Hub's own project; then copying `hub` into Project Friday, where the Hub connects as its own user.

## Why

One schema per app keeps the names apart inside the one shared project (`users`, for one, is also Article Studio's), and lets the Hub connect as a database user that can reach `hub` and nothing else. Before the move it connected as `postgres`, which inside Friday could have read payroll. The copy into Friday was done on 2026-10-12, after a rehearsal into a throwaway database, with every table compared afterwards; the Hub now connects as `hub_app`. Moving the tables in the Hub's own project first proved the change against the real data before the data changed project.
