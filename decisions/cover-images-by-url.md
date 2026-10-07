---
title: Article Studio gives the Hub a link to the cover image, and the Hub fetches the file itself
app: knowledge-hub
decided:
author: ai
sources:
  - https://github.com/designally-co/designally-knowledge-hub/blob/a22f97d31dc19063c7504467c96952444bd5a933/PRODUCT.md?plain=1#L68
  - https://github.com/designally-co/article-studio/blob/5bc702305580cf12fde90ed7e19ea2ca137da7f9/INTEGRATION.md?plain=1#L299
---

## Context

The Hub ran on Vercel, which refuses request bodies over 4.5 MB before the Hub's code runs. Generated covers grew past that.

## Decision

Article Studio sends the cover's URL to the Hub's /api/media/from-url endpoint, and the Hub downloads the file into its own media library. A direct upload remains only as the fallback for local development.

## Why

Vercel's 4.5 MB request-body limit. Letting the Hub own the file also gives it real image sizes and its responsive versions.
