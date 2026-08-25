---
target: the Payload admin
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-08-25T09-03-38Z
slug: cms-src-components-admin
---
Method: dual-agent (A: design review · B: detector + browser evidence), run isolated and in parallel. Ordering note: B completed first, so its evidence reached the synthesis context before A's. A ran in its own agent and could not see B's output, so A's judgment is unanchored as intended — but the parent's reading order was not the ideal one, and that is stated rather than implied away.

Surface: the Payload CMS admin (`cms/src/components/admin`), live at `http://localhost:3001/admin`. Mode: **Operate**.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | The editor never says whether this article *has* Thai. "Translate to Thai" reads identically whether Thai is absent, present, or hand-corrected. No unsaved-changes indicator, no history, no confirmation that Save reached the public site. |
| 2 | Match System / Real World | 2 | The CMS files under **Design / Design with AI**; the site publishes **Case Studies / Workflows** (`lib/i18n.ts:415`). One field is "Deck", "summary" and "dek" depending where you read. Users list prints `true` under "Enable API Key"; the kebab offers "Paste Field". |
| 3 | User Control and Freedom | 1 | No `versions`/`drafts` on any collection — zero undo anywhere. "Translate to Thai" overwrites a locale with no confirmation, then `window.location.reload()` at `TranslateToThaiButton.tsx:31` discards unsaved English edits. RelatedPicker panel has no Esc and no outside-click close. |
| 4 | Consistency and Standards | 2 | Articles rail: Status+Date → Tag → Slug → Translate. Resources rail: Status → Translate → Date → Slug → Category. Same five roles, reshuffled, same person, same week. Articles' Tag cell gets a colour dot and sub-label; Resources' Category cell is plain text. |
| 5 | Error Prevention | 2 | `/articles/create` inherits the sticky locale — it opens *creating in ไทย* with nothing warning that English, the declared source, will be empty. `fileSize` is typed by hand for a fact the upload already knows. Good where it exists: no clear-button on a required tag, `publishedDate` hidden while draft, `Users.create` disabled. |
| 6 | Recognition Rather Than Recall | 2 | The Cover block renders an **empty dropzone on an article that has a cover** — while RelatedPicker two fields below renders that same image as a thumbnail. Thai locale shows no English source. Tag tabs hide 24 of 34 options with no counts. |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts, no saved views, no "next in queue", Per Page fixed at 10 over a 23-and-growing library, and search is title-only (no `listSearchableFields`) so a phrase from a deck finds nothing. |
| 8 | Aesthetic and Minimalist Design | 3 | Real restraint — hairlines not shadows, one accent, settled states in grey, and the authored source is **100% clean** on the deterministic slop scan. Undercut by the dashboard printing the same six titles three times, and a column spending itself on a "Published" chip repeated 23 times. |
| 9 | Error Recovery | 2 | On the create form the Tag field fires two near-identical reds at once — `#c73f29` "Not filed yet" above the options, `#d32830` "This field is required" below. The invalid-fields toast lists names that aren't links, and nothing focuses the first invalid field. |
| 10 | Help and Documentation | 3 | Field descriptions are unusually good and specific. The six named SSO failure reasons in `GoogleSignIn.tsx:18-25` are better error copy than most commercial products ship. What's missing is *what happens next* — nothing says where the article you just published can be seen. |
| **Total** | | **20/40** | **Acceptable — bottom of the band** |

All ten heuristics apply; this is an Operate surface, so 7 and 10 are scored rather than waived.

## Design Specificity Verdict

**LLM assessment.** Strongly authored in intent, half-applied in execution. The dashboard is not Payload's collection grid — it is a triage queue built on real product rules, and the code proves the decisions were argued rather than defaulted: the distinct-`Set` headline at `Dashboard.tsx:177-185` exists because summing produced "46 waiting" over a 23-article library; the Tag field became a real radio group because the data model says exactly-one; the Thai and Summary columns were *deleted* with the reason written down.

Where it stops being specific is the seam between the authored layer and everything Payload brought. The design system was applied to the four surfaces someone chose to rewrite and abandoned everywhere else. `/admin/collections/media` is a **text table of a media library**, filed by alt text — a string written for screen readers — with no thumbnails. Users shows "Enable API Key" containing the literal word `true`. "Updated At" and "Created At" are camel-case split by Payload, sitting one column from "Status" and "Tag" which a person named.

The deeper miss: **the design describes the product but doesn't serve its actual scene.** Articles arrive from Content Studio already written, translated and summarised; a person opens one to check it and push it live. That scene needs three things this admin does not have — a way to *see the article* (no `admin.preview`, no `livePreview`, no view-on-site link anywhere), a way to *see the English while writing the Thai*, and a way to *undo* (no collection enables `versions` or `drafts`). Meanwhile enormous care went into the exact ring colour of a radio button. The craft is real and pointed at the wrong 20%.

**Deterministic scan.** The bundled detector found **zero** findings in authored admin source — `cms/src/components/admin` and the wider `cms/src/components` both exit 0 with an empty array, as do `custom.scss` and every authored `.css` file scanned individually. A control scan widened to `cms/src` returned exit 2 with one hit (`layout-transition`, `styles/layout.css:461`) on the *public site*, confirming the detector was not silently no-op'ing. For a 1,096-line override sheet and five custom components, a clean static pass is a genuine result.

The runtime overlay is where the findings live. Injected on four pages: `/admin` **5**, `/admin/collections/articles` **7**, the article editor **36**, `/admin/collections/media` **7**. The overwhelming majority are Payload's and Lexical's own markup — 30 of the editor's hits are `transition: margin` on `LexicalEditorTheme__*` classes shipped inside Payload's rich-text package. Two trace directly to authored code, both in the same file: `TranslateToThaiButton.tsx:44` (`fontSize: '0.7rem'` = 10.5px at `opacity: 0.6`) and `:66` (`0.72rem` = 10.8px at `opacity: 0.65`), caught as `undersized-ui-text` and `tiny-text` against an 11px floor. That file is also the one custom component that ignores the token system it sits beside — inline styles and stock Payload classes.

One structural runtime hit is worth more than its severity suggests: `first-viewport-column-overflow` on the editor — one column opens the page running **320% of the viewport** while its sibling fits in 95%. That is the same defect A reached from the other direction as a chunking failure (7 blocks in the main column).

**Where the two agree, independently.** The Save button: A read the rule out of `custom.scss:51-58` and measured 3.24:1; B measured 3.24:1 across 73 text pairs without seeing A. Both landed on the unnamed rich-text field. Both landed on undersized authored targets.

**Where the detector caught what the review missed.** Three things, all real:
- **No skip link.** The first Tab lands on `nav-toggler`; **22 Tab presses** are needed before the first dashboard content link takes focus, and the sidebar is re-traversed on every page.
- **The editor has no rendered `h1`.** `custom.scss:818-820` sets `display: none` on `doc-header__title` (with a documented reason — it duplicated the Title field and read "[Untitled]" on create). The consequence measured: no h1 on the page, and the article's body `h2`s share one flat outline with the form's `h3` field-group headings.
- **Five controls on `/admin` have no measurable boundary at all** — neither border nor fill against the page ground.

And one thing the detector credited that the review didn't: **every one of 25 controls reached by real Tab keypresses showed a visible focus ring** at `2px` offset `2px`, measuring **12.63:1** against the ground. That is not a given, and it should not be lost in the noise.

**Visual overlays.** Injection succeeded — preflight confirmed a `<script>` both attached and executed — and overlays were rendered on all four pages via a background live server on port 8400, which was stopped and verified closed. The tab has since been closed, so **no overlay is currently visible in your browser**; the console findings are reported above rather than on screen.

**False positives, named.** `layout-transition` ×30 and `tight-leading` ×3 are Lexical's default editor theme. `clipped-overflow-container` on `aside.nav` (all four pages) is Payload's own sidebar. `repeated-container-text` "— English" ×5 is Payload's localized-field suffix — repetition by design of the localization UI, though five identical suffixes in one form is a fair observation wearing the wrong label. `input.tag-opt__input` at 1×1 ×10 are visually-hidden radios inside their own `<label>`; the real target is the 61×24 pill — the pill's 24px height is a genuine finding, the 1×1 is not. Payload's own chrome (sort headers, paginator, row checkboxes, nav links) accounts for most of the undersized-target count.

## Overall Impression

The parts of this admin that were designed are better than most commercial CMS work, and the reasoning is written into the code where the next person will find it. The `TagSelector` abandoned `aria-pressed` toggles for real radios *because the markup was lying about cardinality*, then computed that a hairline ring measures 1.56:1 against WCAG 1.4.11's 3:1 floor and moved to ink-4 at 4.13:1 — and left the working. That is craft.

The problem is scope, not taste. Four surfaces got that attention; Media, Users, document chrome, validation, pagination and the entire publish/preview/undo path are unmodified Payload wearing a Designally paint job. And the single biggest opportunity is not on the list of things that were polished: **this CMS has no way to look at the article.** No preview, no view-on-site, no English-beside-Thai. For a product whose actual job is *review and release* rather than authoring, that is the loop, and it is missing.

## What's Working

**The dashboard's numbers are honest, and the honesty is designed.** Three separate decisions protect it: sections appear in fixed editorial urgency so a slow week doesn't reorder the page; the "Needs a summary" link carries *both* halves of its rule so the dashboard count and the list count can never disagree; the headline is a `Set` union rather than a sum. Most dashboards are decorated numbers — this one was built by someone who understood that one wrong number discredits every other number on the page.

**The accessibility reasoning in `TagSelector` beats the accessibility work in most shipped products** — and the measured focus indicators back it up at 12.63:1 across every control tested by real keyboard traversal.

**Deletions are argued as carefully as additions.** Thai and Summary columns removed with the reason stated; the tag's clear button removed because on a required field it only ever produced an unsaveable document from a control that looked like tidying up. Subtraction with a written rationale is the rarest thing in this review — and the clean static scan is its evidence.

## Priority Issues

**[P0] "Translate to Thai" is destructive, unconfirmed, and eats unsaved work**

- *Why it matters:* `TranslateToThaiButton.tsx:31` fires `window.location.reload()` 700ms after success. No collection enables `versions`, and Payload v3's leave-guard is router-based rather than `beforeunload`-based — so unsaved English edits vanish with no prompt. The button also regenerates Thai unconditionally, silently replacing a human-corrected Thai deck, and reads the same whether Thai is absent, present or hand-edited. It is the only irreversible action not behind a menu, in a CMS with no undo, in a bilingual product where Thai quality is the entire reason a human is in the loop.
- *Fix:* Gate on `useForm().modified` and refuse while dirty. Replace the reload with a router refresh so form state survives. When Thai exists, relabel to "Re-translate" and confirm, naming what will be replaced. Show "Thai last generated 12 Jun 2026" / "No Thai yet" above the button so state is visible *before* the click.
- *Command:* `/impeccable harden`

**[P1] Locale is an application mode, not a property of the document**

- *Why it matters:* One root cause, three failures. (a) Reviewing Thai means switching the global locale and holding English paragraphs in memory — in ไทย the breadcrumb reads "Articles / 23" and every localized field is blank with no source on screen. (b) `/articles/create` inherits the sticky preference and silently opens in Thai; the resulting article is invisible to the English site *and* absent from the dashboard's "Thai missing" bucket, so it fails where nothing can catch it. (c) In Thai, Cover, Status, Date, Tag and Slug stay editable and look identical to Thai-only fields — changing the Tag there changes both languages, and the only signal is the presence or absence of a small "— ไทย" suffix. Absence is not a signal.
- *Fix:* Move locale into the document as an EN | TH switch above the title, with English visible beside Thai for review. Failing that: force create to `defaultLocale`, and mark shared fields explicitly.
- *Command:* `/impeccable harden`

**[P1] You cannot see the article anywhere in the CMS**

- *Why it matters:* No `admin.preview`, no `livePreview`, no view-on-site link in `payload.config.ts` or any collection. To check her work the content manager copies the slug out of the rail and hand-builds the URL, then again with `/th`. Compounding it: the Cover block renders an **empty dropzone on an article that has a cover** (the image is in `coverUrl`), while RelatedPicker two fields below renders that same image as a thumbnail — proving it is renderable and the omission is a design gap, not a data one. And "Choose from existing" opens a Media library with **no pictures in it** — a text table filed by alt text. The cover is, per the code's own comment, "the largest thing on the published page".
- *Fix:* Add `admin.preview` and a persistent "View on site" (EN + TH). Render the effective cover inside the Cover block at the public `4/3` ratio, labelled by source, with Replace/Remove. Give Media a thumbnail grid or at minimum a preview `Cell`. Note the Related slot is `3/4` portrait while the public card is `4/3` landscape — every preview currently shows a crop the site will not use.
- *Command:* `/impeccable shape`

**[P1] The dashboard breaks its own promise within ten seconds**

- *Why it matters:* "Thai missing (23)", "Needs a summary (23)" and "Recently edited" render the same six titles in the same order — all four buckets filter one `-updatedAt` array, and Content Studio's output makes the work buckets near-congruent by construction. The second list reads as a rendering bug. Worse, the largest queue on the page ends in "17 more" as **plain text, not a link** (`Dashboard.tsx:229-231`, because the rule needs `fallbackLocale: 'none'`, which a list query string cannot express). The number the screen shouts loudest is the one you cannot open. A triage view you cannot act on is a report.
- *Fix:* Collapse to **one queue** with per-row reason chips — "No Thai", "No deck", "Draft" — so 23 articles appear once carrying 1–2 badges, with counts moving to a filter row. Cut "Recently edited" to items not already in the queue. Give "17 more" a destination via a custom list view or a virtual field.
- *Command:* `/impeccable distill`

**[P2] Measured accessibility debt, including a rule this codebase wrote and then broke**

- *Why it matters:* Both assessments independently measured the primary **Save** button at **3.24:1** — white on `--da-orange #ef6148`, 15px/600, needing 4.5:1. `custom.scss:51-58` states the rule itself ("never carries small text here") and offers `--da-orange-mark #c73f29` at 4.54:1; `custom.scss:245` then sets the primary button to the failing value. It is the most-clicked control in the product and it is the publish action. Alongside: **no skip link** (22 Tab presses to first content), the rich-text Body field has **no accessible name**, `TagSelector`'s `role="tablist"` has no keyboard implementation (no `onKeyDown`, no roving `tabIndex`) so arrow keys do nothing and 24 of 34 tags stay undiscoverable, four Related buttons share the accessible name "Add article", and authored targets sit under 44px (`da-sec__more` 18.3, quick-actions 19.7, tag tabs 24.4, Save 36.6). Three dashboard pairs pass at **4.54:1** — a 0.04 margin that any colour nudge flips.
- *Fix:* Move the primary fill to `--da-orange-mark #c73f29` (already blessed by the token comment) and raise the button to 44px. Add a skip link. Label the rich-text field. Implement roving `tabIndex` + arrow keys on the tablist, or drop `role="tab"` for plain buttons that don't promise a keyboard contract they don't honour.
- *Command:* `/impeccable audit`

## Persona Red Flags

**Alex (Impatient Power User).** Per Page fixed at **10** over 23 rows and resetting every visit — three pages to see the library, no saved view, no "drafts only" pin. No shortcut to Save, no "next article", no way to change Status without a mouse trip to the rail. **Search is title-only** — no `listSearchableFields` — so a phrase she remembers from a deck returns nothing. RelatedPicker caps silently at `limit: 200` then `.slice(0, 40)` with no "showing 40 of 137"; she'll type a title she knows exists and conclude search is broken. And at **1400px — a stock MacBook Pro — the entire left nav collapses behind a hamburger**, which makes the Dashboard's own stated rationale ("the sidebar is already the table of contents") false at the width she actually works at.

**Sam (Accessibility-Dependent).** The **rich text editor has no accessible name** — the primary content field of the primary collection is unnamed to a screen reader. `role="tablist"` with no keyboard implementation: she hears "tab", presses Arrow Right per the ARIA pattern, nothing happens, and she never learns 24 more tags exist. Four buttons with the identical name "Add article" and no position-in-set. The RelatedPicker panel has no Esc, no outside-click close, and no focus move into its search box. Save fails AA at 3.24:1 in a 64×37px target. **No skip link — 22 Tabs to the first content link, re-traversed on every page.** `.tag-selector__tab:hover` is not wrapped in `@media (hover: hover)` unlike every other hover rule here, so on touch the hover state sticks after tap. Genuinely good news: every control tested showed a 12.63:1 focus ring.

**Nan (the Designally content manager — the real persona).** She cannot see the article, cannot review a translation against its source, and cannot tell which fields are shared across locales. The word for the thing changes depending where she looks — "Deck", "Needs a summary", "dek". **What she files is not what publishes:** she picks "Design", the site prints "Case Studies". And the one warm moment written for her can never fire — `Dashboard.tsx:175` renders "All clear, {firstName}" from `user.name`, while `Users.ts:77-80` defines **no fields at all**, so `name` is permanently undefined. On a fresh install the first screen the CMS ever shows is "All clear" over a **"Recently edited" heading with an empty list beneath it** — the work sections guard for empty at line 173; this one doesn't. There is no undo anywhere.

## Minor Observations

- `hasCover` at `Dashboard.tsx:82` is dead code — exported, never imported, with a comment admitting nothing surfaces it.
- `hideAPIURL: true` leaves a **lone "Edit" tab** above every document — a tab bar that cannot be used.
- The browser tab always reads "Editing - Article — Designally Hub", never which article; three open articles are indistinguishable and history is useless.
- Every dashboard row currently reads "20 days ago" — the relative-time column carries no information at all right now.
- `.da-dash__elsewhere a:first-child` takes the accent **by position, not meaning**; reorder the links and the emphasis moves.
- "Create New" vs "Write an article" — same action, two names, two visual weights.
- `<No Credit>` in the Media list is developer placeholder syntax shown to an editor.
- Media is the only collection with no `admin.description`; Resources has no `updatedAt` column while Articles does.
- **Zero media queries across 1,096 lines of `custom.scss`**, deliberately unlayered so it outranks Payload's layered rules at every width. Nothing is visibly broken today, but the override strategy has no width-awareness — and at ≤1024px the Tag radio grid reflows to full width, where it looks precisely like the multi-select chip cloud it was redesigned away from.
- Two reds 8° apart adjacent on one panel: `--da-orange-mark #c73f29` and `--da-critical #d32830`. On the create form both fire on the Tag panel at once.
- `--da-orange-mark` carries three meanings — work-waiting counts, "not filed yet", and the accent link. It is doing too much to signal anything.
- `Intl.RelativeTimeFormat('en-GB')` is hardcoded — defensible for an English admin, but an unstated assumption in a bilingual product.
- Tag list-cell dots measure **1.92:1 and 1.88:1 at 8px** — too pale to carry recognition while still costing rhythm in every row.

## Questions to Consider

1. **If Content Studio writes, translates and summarises, what is this admin actually for?** The screens are built for authoring — full rich-text, References array, SEO group — but ~50 articles a year arrive finished. If the real job is *review and release*, the primary screen isn't an editor: it's a read-view of the rendered article, English and Thai side by side, with one button.
2. **Why is Status a field and not an action?** `versions: { drafts: true }` gives Publish/Unpublish as real buttons, autosave, and version history — free undo, free "what changed", free scheduled publish. What was the argument against it, given there is currently no recovery path of any kind?
3. **What is a tag actually for?** 34 tags across 3 categories, where the tag's only load-bearing job is deriving a category. Why pay 34-option cognitive cost for a 3-option outcome?
4. **Should the CMS speak the site's vocabulary or the database's?** Every hour the Design/Case Studies gap stays open, someone learns the wrong name for a thing.
5. **What does the dashboard say on a good week?** Right now it can only report failure states. When everything is working, it's a headline over an empty list.
6. **The most careful thinking in this codebase went into a radio button's ring. What if the same attention had been aimed at the Media library?** That boundary isn't taste — it's where the sprint ended. Is it defensible?
