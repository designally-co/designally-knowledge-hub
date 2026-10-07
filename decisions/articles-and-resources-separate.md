---
title: Articles and resources are two separate collections, not one Resource type
app: knowledge-hub
decided:
author: ai
sources:
  - https://github.com/designally-co/designally-knowledge-hub/blob/a22f97d31dc19063c7504467c96952444bd5a933/PRODUCT.md?plain=1#L44
---

## Context

The product plan described a single Resource concept with a type field covering articles, templates, videos, courses and tools.

## Decision

Build Articles and Resources as two separate Payload collections.

## Why

Once written down, their fields barely overlapped: an article has a body, a reading time and one tag; a resource has files, formats, a licence and a file size. One collection would have been a type field plus two sets of fields hidden depending on the type.
