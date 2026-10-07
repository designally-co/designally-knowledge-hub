---
title: The Knowledge Hub runs on the Designally NAS, with Vercel kept as the rollback
app: knowledge-hub
decided:
author: ai
sources:
  - https://github.com/designally-co/designally-knowledge-hub/blob/a22f97d31dc19063c7504467c96952444bd5a933/docs/deploy-nas.md?plain=1#L1
  - Buk, 2026-10-07 (the Hub is on the NAS and the rollback stays on Vercel)
---

## Context

The Hub first ran on Vercel. Article Studio and the Survey app had already moved to the NAS on 15 and 16 September 2026.

## Decision

Production runs as a Docker container on the NAS, behind Caddy, released by tagging a commit on main. The Vercel deployment stays as the rollback.

## Why

