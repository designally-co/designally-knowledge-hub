---
title: The Knowledge Hub's CMS is Payload, inside the same Next.js app as the public site
app: knowledge-hub
decided:
author: ai
sources:
  - https://github.com/designally-co/designally-knowledge-hub/blob/a22f97d31dc19063c7504467c96952444bd5a933/PRODUCT.md?plain=1#L77
  - https://github.com/designally-co/designally-knowledge-hub/blob/a22f97d31dc19063c7504467c96952444bd5a933/PRODUCT.md?plain=1#L65
  - https://github.com/designally-co/designally-knowledge-hub/blob/a22f97d31dc19063c7504467c96952444bd5a933/cms/README.md?plain=1#L1
---

## Context

The product plan needed a content system that editors can use without a developer, plus a public site that search engines can read.

## Decision

Use Payload CMS 3 on Next.js. One application serves both the admin (at /admin) and the public site, split by route group. There is no separate frontend project.

## Why

The Hub's docs say the CMS is code-owned: the content model lives in the repo as TypeScript, not in a third-party service, and Payload also gives a REST and GraphQL API and an admin UI for publishing without a developer. The docs do not record which other CMS options were compared.
