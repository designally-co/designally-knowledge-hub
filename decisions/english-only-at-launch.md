---
title: The Hub launches in English only, with the Thai language switch hidden
app: knowledge-hub
decided: 2026-10-14
author: ai
sources:
  - https://github.com/designally-co/designally-knowledge-hub/blob/fbbba978963473dfc1f96743f6353f9542078276/cms/src/lib/i18n.ts?plain=1#L15-L24
  - https://github.com/designally-co/designally-knowledge-hub/blob/fbbba978963473dfc1f96743f6353f9542078276/cms/src/app/(frontend)/[lang]/layout.tsx?plain=1#L56-L69
  - Buk, 2026-10-14
---

## Context

The Hub is built for two languages: English without a prefix, Thai under `/th`, and a language switch in the header, the mobile menu and the footer. The Hub was about to go live, but the Thai copy was not ready.

## Decision

The Hub is released in English only. P Aek asked for the Thai language switch to be hidden (Buk, 2026-10-14).

How it was built (chosen by the AI in this session): one list, `PUBLIC_LOCALES` in `cms/src/lib/i18n.ts`, names the languages visitors are offered, and it holds only English. With one language the switch is not drawn anywhere, and the sitemap lists English pages only. Thai pages still open under `/th`, so the team can read the Thai copy while it is written, but nothing links to them and each one tells search engines not to index it (`noindex, nofollow`). When the Thai copy is ready, adding `th` back to the list turns the switch, the sitemap entries and indexing on again.

## Why

The Thai copy was not ready at launch (Buk, 2026-10-14).
