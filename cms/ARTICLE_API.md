# Article API — contract for the Content Generator

How an external system creates and publishes **articles** in the Designally
Knowledge Hub (Payload CMS). Articles are rows in the `resources` collection with
`type: "article"`.

- **Base URL (dev):** `http://localhost:3000`
- **Content-Type:** `application/json`

There are two ways to create an article:

1. **`POST {BASE_URL}/api/resources/from-markdown` — RECOMMENDED for the Content
   Generator.** Send the body as **Markdown** (`bodyMarkdown`); the Hub converts it
   to Lexical server-side. Returns `{ id, slug, url, status }`. See §4a.
2. `POST {BASE_URL}/api/resources` — the raw Payload endpoint. Requires the body as
   Lexical JSON (§4b). Returns `{ doc: { id, slug, ... }, message }`.

Use the returned `slug`/`url` for the public link: `{BASE_URL}/articles/{slug}`.

---

## 1. Authentication

The `users` collection is auth-enabled. Two options for machine-to-machine posting:

**A. API key (recommended).** Requires enabling `useAPIKey` on the Users collection
(one-line change — ask the Hub team). Then generate a key for a "Content Generator"
user in the admin and send:

```
Authorization: users API-Key <THE_KEY>
```

**B. Login token.** `POST /api/users/login` with `{ email, password }` → returns a
`token`. Send it as `Authorization: JWT <token>` on subsequent requests.

Without auth you can only *read* published content, not create.

---

## 2. Field reference (type = "article")

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | string | **yes** | Must be `"article"`. |
| `title` | string | **yes** | The H1. |
| `tags` | string[] | **yes** | **1–2** values, exact strings from the taxonomy in §3. |
| `status` | `"draft"` \| `"published"` | no (default `"draft"`) | Send `"published"` to make it live. |
| `summary` | string | no (recommended) | The dek/subtitle — one sentence. Also the card excerpt + default meta description. |
| `body` | object (Lexical) | no (recommended) | Rich text. See §4. |
| `references` | `{ label, url }[]` | no | Link list shown at the end of the article. |
| `publishedDate` | ISO 8601 string | no | e.g. `"2026-07-24T09:00:00.000Z"`. Drives ordering + the displayed date. |
| `slug` | string | no | Auto-generated from `title` if omitted. Must be unique. |
| `coverUrl` | string | no | External cover image URL. |
| `coverImage` | number (media id) | no | Uploaded cover; upload to `POST /api/media` first, then pass its id. Takes precedence over `coverUrl`. |
| `seo` | `{ metaTitle?, metaDescription?, ogImage? }` | no | Falls back to title/summary. |
| `related` | number[] (resource ids) | no | Related articles. |

**Do NOT send** (auto-managed or removed): `readTime` (auto-computed from `body`
word count), `coverTint`, `coverRatio` (removed — cover ratio comes from the
uploaded image's real dimensions), `category` (derived automatically from the tag).

---

## 3. Tag taxonomy (the ONLY valid `tags` values)

Pick **1 or 2**. The category is derived automatically from the tag, so you don't
send a category. Values must match exactly (case, spacing, slashes included).

**Design:** `Branding Systems` · `Visual Identity` · `UX/UI` · `Design Process` ·
`Grid Systems` · `Typography` · `Design Psychology` · `Case Study` ·
`Design Critique` · `Before / After`

**New Update:** `Industry Trends` · `New Technology` · `Marketing Shift` ·
`Consumer Behavior` · `Brand Launch` · `Product Update` · `Design Tools` ·
`Industry Report`

**Creative Things:** `Campaign Breakdown` · `Packaging` · `Motion` ·
`Creative Direction` · `Photography` · `Brand Film` · `Storytelling` ·
`Creative Review`

**Design with AI:** `AI Workflow` · `Strategy + AI` · `Research` · `Brand Audit` ·
`Productivity` · `Automation` · `AI Design` · `Future of Design`

Sending a value outside this list is rejected. Sending 0 or 3+ tags is rejected.

---

## 4a. Recommended: post Markdown (`/api/resources/from-markdown`)

The generator sends its Markdown body directly — no Lexical assembly needed.

```bash
curl -X POST "http://localhost:3000/api/resources/from-markdown" \
  -H "Content-Type: application/json" \
  -H "Authorization: users API-Key <THE_KEY>" \
  -d '{
    "title": "Publishing straight from the Content Generator",
    "tags": ["AI Workflow", "Automation"],
    "summary": "A one-sentence dek.",
    "status": "draft",
    "coverUrl": "https://…/cover.jpg",
    "bodyMarkdown": "Intro paragraph.\n\n## First section\n\nSome **bold** copy:\n\n- one\n- two\n\n[A link](https://designally.co)."
  }'
```

Returns `201` with `{ "id", "slug", "url", "status" }`. Same field rules as §2
(title + 1–2 tags required); the only difference is `bodyMarkdown` (Markdown
string) instead of `body` (Lexical). Standard Markdown + GFM is supported —
headings (`##`→h2, `###`→h3), `**bold**`, `*italic*`, `-`/`1.` lists, `[text](url)`
links. Verified end-to-end.

## 4b. Body format (Lexical rich text) — only for the raw `/api/resources` endpoint

`body` is a **Lexical editor state**: `{ "root": { ...root node } }`. The site
renders these node types (paragraph, heading h2/h3, bullet/number list, link, bold).
Recommended structure per the editorial model: open with a 2–3 sentence intro
paragraph (no heading), then 3–6 `h2` sections.

Node shapes (copy exactly; the constant props matter):

```jsonc
// text (leaf). format is a bitmask: 1=bold, 2=italic, 8=underline.
{ "type": "text", "text": "…", "format": 0, "style": "", "mode": "normal", "detail": 0, "version": 1 }

// paragraph
{ "type": "paragraph", "children": [ /* text nodes */ ],
  "direction": "ltr", "format": "", "indent": 0, "version": 1, "textFormat": 0, "textStyle": "" }

// heading — tag is "h2" or "h3"
{ "type": "heading", "tag": "h2", "children": [ /* text */ ],
  "direction": "ltr", "format": "", "indent": 0, "version": 1 }

// list — listType "bullet" (tag "ul") or "number" (tag "ol")
{ "type": "list", "listType": "bullet", "tag": "ul", "start": 1,
  "children": [ /* listitem nodes */ ],
  "direction": "ltr", "format": "", "indent": 0, "version": 1 }

// listitem
{ "type": "listitem", "value": 1, "children": [ /* text */ ],
  "direction": "ltr", "format": "", "indent": 0, "version": 1 }

// link (inline) — wraps text nodes
{ "type": "link", "fields": { "linkType": "custom", "url": "https://…", "newTab": true },
  "children": [ /* text */ ], "direction": "ltr", "format": "", "indent": 0, "version": 1 }

// root (top level)
{ "type": "root", "children": [ /* block nodes */ ], "direction": "ltr", "format": "", "indent": 0, "version": 1 }
```

### JS helper (drop into the Content Generator)

```js
const text = (t, bold = false) => ({ type: 'text', text: t, format: bold ? 1 : 0, style: '', mode: 'normal', detail: 0, version: 1 })
const p    = (t) => ({ type: 'paragraph', children: [text(t)], direction: 'ltr', format: '', indent: 0, version: 1, textFormat: 0, textStyle: '' })
const h2   = (t) => ({ type: 'heading', tag: 'h2', children: [text(t)], direction: 'ltr', format: '', indent: 0, version: 1 })
const ul   = (items) => ({ type: 'list', listType: 'bullet', tag: 'ul', start: 1,
  children: items.map((t, i) => ({ type: 'listitem', value: i + 1, children: [text(t)], direction: 'ltr', format: '', indent: 0, version: 1 })),
  direction: 'ltr', format: '', indent: 0, version: 1 })
const body = (blocks) => ({ root: { type: 'root', children: blocks, direction: 'ltr', format: '', indent: 0, version: 1 } })

// usage:
const articleBody = body([
  p('Intro paragraph, two or three sentences, no heading.'),
  h2('First section heading'),
  p('A paragraph.'),
  ul(['Point one', 'Point two']),
])
```

---

## 5. Complete example request

```bash
curl -X POST "http://localhost:3000/api/resources" \
  -H "Content-Type: application/json" \
  -H "Authorization: users API-Key <THE_KEY>" \
  -d '{
    "type": "article",
    "status": "published",
    "title": "How to run a logo review that ends in a decision",
    "summary": "A repeatable way to turn a room full of opinions into one clear call.",
    "tags": ["Design Critique", "Design Process"],
    "publishedDate": "2026-07-24T09:00:00.000Z",
    "coverUrl": "https://example.com/cover.jpg",
    "references": [
      { "label": "Further reading — running design reviews", "url": "https://example.com/reviews" }
    ],
    "body": {
      "root": {
        "type": "root", "direction": "ltr", "format": "", "indent": 0, "version": 1,
        "children": [
          { "type": "paragraph", "direction": "ltr", "format": "", "indent": 0, "version": 1, "textFormat": 0, "textStyle": "",
            "children": [ { "type": "text", "text": "Most logo reviews stall because nobody named the decision up front.", "format": 0, "style": "", "mode": "normal", "detail": 0, "version": 1 } ] },
          { "type": "heading", "tag": "h2", "direction": "ltr", "format": "", "indent": 0, "version": 1,
            "children": [ { "type": "text", "text": "Name the decision first", "format": 0, "style": "", "mode": "normal", "detail": 0, "version": 1 } ] }
        ]
      }
    }
  }'
```

---

## 6. Behaviour notes

- **Publishing:** only `status: "published"` is visible on the public site. Drafts
  are hidden from the public API.
- **Read time** is auto-calculated from the `body` word count and shown as
  "N min read". Don't send it.
- **Cover:** if neither `coverImage` nor `coverUrl` is set, the card/hero shows a
  default colour. Aspect ratio is taken from an uploaded `coverImage`'s real
  dimensions (external `coverUrl` gets a default portrait box).
- **Freshness:** pages are statically generated with ISR (revalidate ≈ 5 min). A
  newly published article's own page works immediately (rendered on first request);
  it appears in listings/carousel within the revalidate window.
- **Updates:** `PATCH /api/resources/{id}` with the same fields. **Delete:**
  `DELETE /api/resources/{id}`.
- **Uploading a cover file:** `POST /api/media` (multipart form-data, field `file`)
  → returns a media doc; pass its `id` as `coverImage`.
