# Branding Explained

An editorial-publication MVP built on the **Branding Explained Design System**
(imported from Claude Design). Warm-paper palette, editorial serif + grotesque
type, full-bleed section bands, and category-coded spot colours.

## Stack
- **Vite** + **React 18** (bundled — no CDN at runtime)
- **react-router-dom** — real routes with shareable URLs
- **lucide-react** — UI icons (only the used glyphs are imported)
- Design tokens in plain CSS (`tokens/`), consumed via `src/index.css`

## Backend
The CMS/API lives in [`cms/`](cms/) — a code-owned **Payload CMS** backend
implementing the unified Resource content model with a REST + GraphQL API and an
admin UI. It seeds from this app's `src/data.js`. See [cms/README.md](cms/README.md).
This first pass delivers the data model + API + seed; the frontend still reads its
local `src/data.js` and is wired to the API in a later pass.

## Getting started
```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production bundle → dist/
npm run preview    # serve the built bundle
```

## Routes
| Path                 | Page                                        |
| -------------------- | ------------------------------------------- |
| `/`                  | Home — full editorial homepage              |
| `/browse/:topic`     | Listing for a topic (nav / topic pills)     |
| `/article`           | Article reading view                        |
| `/subscribe`         | Newsletter signup (with success state)      |

## Project layout
```
index.html                  Vite entry
src/
  main.jsx                  React root + <BrowserRouter>
  App.jsx                   Routes + Header/Footer shell + scroll-to-top
  useNav.js                 bridges onNavigate(name,topic) → router paths
  data.js                   sample editorial content
  index.css                 imports tokens + global styles
  design-system/            the 8 reusable components + index.js barrel
    Button, IconButton, Icon, Tag, TopicPill,
    ArticleCard, ResourceCard, SectionHeading
  pages/                    Header, Footer, HomePage, ArticlePage,
                            IndexPage, SubscribePage
tokens/                     colors / typography / spacing / fonts (design tokens)
legacy/                     original CDN/Babel standalone (no build step) — reference
```

## Substitutions to confirm
The source design was a screenshot only, so two things are stand-ins and should
be swapped once the real brand assets arrive:
- **Fonts** — Newsreader (serif) + Hanken Grotesk (sans) via Google Fonts.
- **Imagery** — cards use brand-tinted placeholders; add real image URLs in
  `src/data.js` (each card accepts an `image` field).
