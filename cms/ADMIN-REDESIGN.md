# Admin redesign — plan

Status: proposal, awaiting approval. Nothing in here is built yet.
Scope: the Payload admin at `/admin`. The public site is not touched.

## What you decided

| | |
|---|---|
| Depth | Custom Payload components — a real redesign, not a restyle |
| Jobs | All four matter equally: review CG drafts, write by hand, curate resources, check Thai |
| Thai | Gets its own review surface, kept off the main path |
| Workflow | **No new state.** Draft and Published stay as they are |
| Look | Stay in the Designally system |
| Users | A small team, desktop |

Because all four jobs matter equally, this does not optimise one screen at the
expense of the others. The dashboard becomes the hub that routes to all four,
and each destination is designed for its own job.

## What the data can and cannot tell us

Both databases hold mock content. So **no count from either one is evidence**,
and nothing in this design is ranked by one.

What I measured, and then discarded:

| Measured | Why it is worthless |
|---|---|
| 23 of 29 articles missing a summary | An artefact of how the mock rows were made, not an editorial backlog |
| 0 articles missing a cover | Same — says nothing about real content |
| ~1 in 5 missing Thai | Same |

What survives, because it is a property of the schema and of Payload's
behaviour rather than of the rows:

- **A cover lives in one of two fields.** `coverImage` (an upload) or
  `coverUrl` (a string, which is what `from-markdown` sets). Any "missing
  cover" check must test **both**, whatever the content turns out to be.
  Testing only the upload field is wrong by construction.
- **Missing Thai is detectable with no schema change.** Payload's locale
  fallback returns the *English* title under `locale=th` when no translation
  exists, so an identical title across locales reliably means "untranslated".
- **Stale Thai is not detectable.** `updatedAt` is per document, not per
  locale, so nothing records that the English changed after the Thai was made.
  See Open decisions.

### What this means for the dashboard

Since the real distribution is unknown, every signal is written as a **rule**,
and the layout must survive any volume:

- Sections appear in a **fixed order of editorial urgency** — not ordered by
  how many rows each happens to have.
- A section with nothing in it **disappears**. An empty dashboard means
  "nothing needs you", not "here are four empty boxes".
- A section with a lot in it shows the first handful and links to the Articles
  list **already filtered**. Nothing tries to render five hundred rows.
- The same rules drive both the dashboard and the list's filters, so a count on
  one always agrees with the other.

That way the dashboard is correct on day one with 29 mock articles and still
correct later with real ones, whatever shape they take.

## The screens

### 1. Dashboard — "what needs you"

Today it is four cards that link to collections and say nothing. It becomes a
short, honest list of work, computed from data that already exists. In this
order, because this is the order the work matters in:

1. **Drafts waiting** — `status = draft`, which is where Content Studio's
   output lands. Unfinished and unpublished, so it blocks the most. Each row:
   title, when it arrived, its tag, straight into the editor.
2. **Thai missing** — published in English, silently English in Thai. Live and
   wrong, so it outranks merely incomplete.
3. **Incomplete** — published but missing a summary or a cover. Live and thin.
4. **Recently edited** — not a problem, just where you left off.

Each section: the first few rows, a count, and a link into the Articles list
filtered to exactly that rule. Empty sections are not rendered. Below it all,
quiet routes to Resources, Media and Users.

### 2. Navigation

- Order by what the work actually is: **Content** (Articles, Resources) first,
  then **Library** (Media), then Users last. Today Media and Users share top
  billing with the collections people actually open.
- **An active state.** Payload renders its nav links with nothing to hook one
  on — no `aria-current`, no active class — which is why the current theme has
  none. A custom Nav component fixes that; it is one of the two reasons this
  work needs components rather than CSS.

### 3. Articles list — a triage view

The generic table becomes a list where every row shows its state at a glance:

- Title, with the tag's own category colour beside it
- **Status** as a real chip, not a word in a column
- **TH** state: present / missing
- **Summary** present / missing
- Last edited

Sorting and filtering stay Payload's. The point is not more features, it is that
a row which needs attention should look different from one that does not.

### 4. Article editor — a hierarchy

Today every field has equal weight in one long column. Instead:

- **Masthead**: title and summary as the head of a document, not two more form
  rows. Summary is where the gap is, so it is given presence rather than being
  the third input down.
- **Body**: the dominant surface, at the system's reading size and measure.
- **A right rail**, grouped by what the group is for:
  *Publishing* (status, published date, slug) ·
  *Filing* (tag, cover) ·
  *Links* (references, related)
- The Thai action leaves the main column for the surface below.

### 5. Thai review — its own screen

A dedicated view, one click from the editor and invisible until you want it:
English on the left, read-only; Thai on the right, editable; retranslate per
document. This is the "real review surface" you chose, and keeping it off the
main path is what keeps the English path uncluttered.

### 6. Resources — a different shape

Resources are objects with files and covers, not text. A card grid rather than a
table, so the thing you are choosing between is actually visible.

## What this does not do

- No dark mode. The system is a light system and its dark Field is one screen's
  drama, not a second theme.
- No new workflow state, no new required fields, no migration.
- No change to `POST /api/articles/from-markdown`. Content Studio depends on
  that contract and it stays exactly as it is.
- Nothing on the public site.

## Risk, and how it is handled

Custom components must be registered in `admin/importMap.js`, and
`payload.config.ts` records what happens when that file is regenerated in an
environment where S3 is unconfigured: **the production admin renders blank with
no error to go on.**

- Regenerate the import map with the `S3_*` variables set, exactly as the
  config's comment instructs, and commit the result.
- Verify on a Vercel **preview deployment** before anything is promoted.
- Every component is additive: removing its entry from `admin.components`
  returns that screen to stock Payload. The CSS theme underneath is unchanged
  and remains the fallback.
- One commit per screen, so any single screen can be reverted alone.

## Order of work

1. Dashboard + nav (the hub, and the active state)
2. Articles list — triage
3. Article editor — hierarchy
4. Thai review surface
5. Resources grid

Each verified in the browser and measured for contrast before the next starts.

Rough effort: 1–2 days for 1–3, another day for 4–5.

## Decisions — settled

1. **No `thaiTranslatedAt`.** So: **zero schema change**, nothing to migrate.
   Thai shows as *missing* or *present*, and a translation that has gone out of
   date after an English edit will not be flagged. That limit is accepted, and
   the Thai review screen mitigates it — it puts the two languages side by side,
   which is where a drifted translation becomes visible to a human.

2. **A summary is required.** Editorially — *not* in the schema. The field stays
   optional in `shared.ts` because `POST /api/articles/from-markdown` declares
   `summary?` as optional, and flipping the field to `required: true` would
   reject the first Content Studio publish that omits one. That endpoint is a
   contract with another app and this work does not touch it.

   Instead the admin enforces it where a person can act on it: an article
   without a summary is listed under *Incomplete* on the dashboard, marked in
   the list, and the field is given real presence in the editor's masthead
   rather than sitting third in a column of inputs. If a hard block is wanted
   later it is a one-line field change plus a Content Studio update — but it
   should be that deliberate, not a side effect of this redesign.

3. **~50 articles a year — about one a week.** So **no bulk actions and no
   saved filters.** At that rate triage is a handful of rows at a time, and
   Payload's built-in selection covers the rare multi-select. This keeps the
   Articles list a presentation change rather than a new feature surface, which
   is less to build and less to break. Worth revisiting only if the rate rises
   by an order of magnitude.
