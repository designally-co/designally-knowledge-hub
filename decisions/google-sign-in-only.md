---
title: The Hub admin has Google sign-in for designally.co accounts only, and no roles
app: knowledge-hub
decided:
author: ai
sources:
  - https://github.com/designally-co/designally-knowledge-hub/blob/a22f97d31dc19063c7504467c96952444bd5a933/PRODUCT.md?plain=1#L71
  - https://github.com/designally-co/designally-knowledge-hub/blob/a22f97d31dc19063c7504467c96952444bd5a933/cms/CMS-GOOGLE-SSO.md?plain=1#L7
---

## Context

Payload comes with its own email and password login. Article Studio had already moved to Google sign-in.

## Decision

Sign-in to /admin is Google only, limited to designally.co. Password login is refused by a hook. Everyone who signs in is an admin. Article Studio still publishes with a separate users API key, which this does not affect.

## Why

The requirement was that the CMS is only for Designally admins signing in with Designally Google accounts, the same choice already made for Article Studio.
