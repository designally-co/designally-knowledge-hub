---
title: The Hub's production database changes only through Payload migrations
app: knowledge-hub
decided:
author: ai
sources:
  - https://github.com/designally-co/designally-knowledge-hub/blob/a22f97d31dc19063c7504467c96952444bd5a933/PRODUCT.md?plain=1#L67
  - https://github.com/designally-co/designally-knowledge-hub/blob/a22f97d31dc19063c7504467c96952444bd5a933/cms/src/payload.config.ts?plain=1#L57
---

## Context

Payload's push option syncs the database to the code automatically. It was set on everywhere, but production never actually received new columns that way. On 4 September 2026 a field that existed in the code but not in the production database turned every read of articles and resources into an error, and the site went down.

## Decision

Push runs only outside production (NODE_ENV not production). Production changes shape only through a migration file.

## Why

A field added to the config without a migration silently never reaches production. A migration is a file someone can read before it runs.
