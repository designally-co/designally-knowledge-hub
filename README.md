# Designally Knowledge Hub

An editorial knowledge hub — public site and CMS in one Next.js app.

The whole application lives in **[`cms/`](cms/)**: a code-owned
[Payload CMS](https://payloadcms.com) backend (content model, REST + GraphQL API,
admin UI at `/admin`) plus the public site rendered from it with Next's SSG/ISR.
There is no separate frontend project.

See **[cms/README.md](cms/README.md)** for the stack, content model, and local
setup, and **[cms/DEPLOY.md](cms/DEPLOY.md)** for deployment.

## Getting started

```bash
cd cms
npm install
npm run dev     # http://localhost:3000        — public site
                # http://localhost:3000/admin  — admin UI
```

Everything runs from `cms/`, including `npm run seed`, which loads the
placeholder sample library from [cms/src/seed-data.js](cms/src/seed-data.js).

> **Deploying:** Vercel's **Root Directory must be `cms`**, not the repo root.

## Repo layout

```
cms/            the application (Payload CMS + Next.js public site)
PRD.md          product requirements
PRODUCT.md      product overview
```

## Placeholder assets

Two things are stand-ins until the real brand assets arrive:

- **Fonts** — Newsreader (serif) + Hanken Grotesk (sans) via Google Fonts.
- **Imagery** — the seeded sample content hotlinks Unsplash photographs as
  covers, and the headlines are invented. Swap all of it before anything ships
  publicly.
