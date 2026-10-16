---
title: Public article cards and tags fetch only the fields they render
app: knowledge-hub
decided: 2026-10-16
author: ai
sources:
  - Nick, 2026-10-16 (fix Hub and Article Studio database traffic and verify they keep working)
  - https://github.com/designally-co/designally-knowledge-hub/blob/dac11d200bda348dcd863481952cd8325b7103af/cms/src/lib/resources.ts
---

## Context

The public card and tag helpers retrieved complete article documents and discarded most fields afterwards. Live query statistics inspected on 2026-10-16 showed tens of thousands of article rows returned, including Markdown and rich-text locales. Extracting a small view model after the read does not reduce database-to-app traffic.

## Decision

Use explicit card-field projections for recent, related, tag/category and paginated article listings. Tag helpers select only the tag; the related-article lookup selects only its tag and chosen relations. Omit pagination counts where the helper does not consume them. Keep counts for paginated listings and keep full content/references on article detail reads. Preserve media population, localization, published-only filters, ordering and existing page revalidation. Validate with real Payload reads over temporary synthetic bilingual data, covers, drafts and related articles.

## Why

Nick requested both identified bandwidth fixes while preserving the live apps. The measured published set produced roughly 1.05 MB with complete fields versus roughly 25 KB with metadata and localized titles. Explicit field selection removes unused bodies before transfer without deleting content or changing the reader interface.
