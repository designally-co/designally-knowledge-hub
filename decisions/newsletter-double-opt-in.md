---
title: Newsletter sign-up uses double opt-in, and unsubscribed rows are never deleted
app: knowledge-hub
decided:
author: ai
sources:
  - https://github.com/designally-co/designally-knowledge-hub/blob/a22f97d31dc19063c7504467c96952444bd5a933/PRODUCT.md?plain=1#L61
  - https://github.com/designally-co/designally-knowledge-hub/blob/a22f97d31dc19063c7504467c96952444bd5a933/PRODUCT.md?plain=1#L63
  - https://github.com/designally-co/designally-knowledge-hub/blob/a22f97d31dc19063c7504467c96952444bd5a933/PRODUCT.md?plain=1#L73
---

## Context

Marketing-email consent (GDPR and CCPA) was one of the launch gates.

## Decision

Signing up creates a pending subscriber and sends a confirmation email; only the link in it joins the list. Every email has an unsubscribe link and a List-Unsubscribe header. An unsubscribed row is kept. Bots are stopped by a hidden honeypot field, not a CAPTCHA.

## Why

Double opt-in and the unsubscribe links meet the consent requirement. The unsubscribed row is kept because it is the only record that someone asked not to be mailed. The docs say the honeypot instead of a CAPTCHA was deliberate but do not say why.
