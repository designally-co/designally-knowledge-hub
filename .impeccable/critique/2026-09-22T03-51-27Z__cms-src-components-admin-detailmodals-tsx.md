---
target: the popup media modal
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-09-22T03-51-27Z
slug: cms-src-components-admin-detailmodals-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence)

Target: the media document drawer in the Payload admin — `cms/src/components/admin/DetailModals.tsx`, `DocActions.tsx`, and the `$sheet` / `$doc` / `$mediaDoc` sections of `custom.scss`.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Save renders at full brand orange with `opacity: 1` while `disabled=true`; the only tell is `cursor: not-allowed` |
| 2 | Match System / Real World | 3 | Strong nouns (Description, JPEG, 205 KB), but the ✕ exit says "Stay on this page" in a drawer where no page is being left |
| 3 | User Control and Freedom | 2 | Escape does nothing after a mouse-open: focus never enters the dialog, so the native cancel never fires |
| 4 | Consistency and Standards | 1 | Three exits, two different confirmation dialogs with different headings, bodies and button labels |
| 5 | Error Prevention | 2 | The ⋯ delete is exemplary; the unconfirmed "Remove file" trash sits 7px from the crop tool, on the photo |
| 6 | Recognition Rather Than Recall | 2 | Three 36×36 icon-only discs labelled by tooltip alone — and there is no hover on the phone this admin is used from |
| 7 | Flexibility and Efficiency | 2 | No next/previous; describing 12 files is 12 open-type-save-close cycles, each ending with focus on `<body>` |
| 8 | Aesthetic and Minimalist Design | 3 | Genuinely restrained, but five type sizes for ~12 strings and the largest text on the sheet is `cover-5.jpg` |
| 9 | Error Recovery | 2 | Description carries no required or error state; the list's red "Needs description" is not echoed here |
| 10 | Help and Documentation | 3 | "For readers who can't see it. Needed to publish." is model microcopy; nothing says what Apply Changes does to the original |
| **Total** | | **22/40** | **Acceptable — significant work needed** |

No heuristic was scored n/a.

## Design Specificity Verdict

**Strongly authored at the surface; generic in the interaction contract.**

No other CMS could use this composition unchanged. Payload's drawer header is clipped away, `alt` is relabelled "Description" while keeping the API name, `"205KB - 1200x900 - image/jpeg"` is rebuilt as three labelled facts, the derivative picker is replaced by a lightbox, `[Untitled]` becomes the filename, and the delete warning is written in the product's own nouns.

But everything the user *does* is still Payload's: the dialog's accessible name is the literal string `doc-drawer_media_0_6__r_0_`, focus never enters the sheet, Escape is inert until you click inside, and the exit copy is boilerplate. The chrome was rewritten; the contract was not. Every priority issue below lives in that gap.

**Deterministic scan:** `detect.mjs` over `DetailModals.tsx` and `DocActions.tsx` returned `[]`, exit 0. Verified as a genuine pass rather than a skipped file: `.tsx` is in the scannable set, and a canary file with a deliberate violation returned exit 2. The detector's ~65 rules are static slop-pattern heuristics — none test contrast, hit-target size, focus management or ARIA, which is why the browser pass found what it did.

**Visual overlays:** not available. The admin is session-authenticated and no same-origin injection path exists, so no user-visible overlay was produced; hard measurements were taken through the page instead.

## Overall Impression

The visible craft here is real and unusual — this is a team that deleted a vendor's header because it duplicated a field an inch below, and wrote down why. The delete confirmation is better than most shipped CMSs. But the drawer is a dialog that a keyboard cannot escape and a screen reader cannot name, and every control in it is under the 44px floor on a surface the product brief says is used from a phone as often as a desk. The single biggest opportunity: the list already knows which files need a description — make the drawer know it too, and the whole screen turns from a document form into a queue.

## What's Working

1. **The delete confirmation is designed, not defaulted.** It names the consequence in product nouns ("a cover, a card, a download"), uses a critical red that is deliberately *not* the brand accent so destructive never reads as primary, confirms inside the menu it was invoked from, and lands the keyboard on "Keep". The code records that Enter-on-open would otherwise have deleted the document.

2. **`MediaFacts` replaces a parse with a read.** TYPE / JPEG, DIMENSIONS / 1200 × 900, SIZE / 205 KB — three labelled pairs scannable in one fixation, where Payload made every reader re-parse one string.

3. **The focus-visible system is thorough.** A blanket rule covers all eleven controls in the drawer with a 2px accent ring at 2px offset; under real Tab presses every control reports `:focus-visible`. Reduced motion is handled on both sheets — the 0.18s open animation touches only opacity and a 3% scale, with `animation: none` alternatives.

## Priority Issues

**[P0] The drawer is not a dialog for anyone using a keyboard or a screen reader**
Opening it leaves focus on the row link behind the sheet; Escape then does nothing, twice; Tab from there walks the *list underneath*. Payload's trap only engages once focus is already inside — verified working in both directions after a Tab, which is exactly the entry that never happens. `aria-modal="true"` is set but `:modal` is false: the dialog uses the `open` attribute rather than `showModal()`, so the background is not in the top layer, `body` is not inert, and nothing is `aria-hidden`. The accessible name is the slug `doc-drawer_media_0_6__r_0_` — the correct heading exists, visually hidden and in the accessibility tree, but has no `id` and `aria-label` outranks it anyway.
*Fix:* focus `input[name="alt"]` when the drawer opens; give the clipped `<h2>` an id and point `aria-labelledby` at it; mark `.template-default__wrap` inert while open; give the full-viewport `.drawer__close` backdrop `tabindex="-1"` — it is currently a 1630×1299 invisible button announced as "Close" and the first stop in the cycle.
*Command:* `/impeccable harden`

**[P0] Three exits, two confirmation dialogs, and the destructive button is Save's exact colour**
`DetailCloseGuard` matches `button?.id === close-drawer__<slug>`, and the only element with that id is the backdrop. The visible ✕ has no id, so it falls through to Payload's own "Leave without saving / Stay on this page / Leave anyway" — a different heading, body and pair of labels from the "Discard unsaved changes? / Keep editing / Discard changes" that Escape and the backdrop produce. In both, the destructive button computes to `rgb(239, 97, 72)` with white text: byte-identical to Save, in Save's position.
*Fix:* match the header close button in the same guard so one dialog owns all three exits; suppress Payload's; restyle the destructive choice in the critical red already used two clicks away.
*Command:* `/impeccable clarify`

**[P1] Every control is under the 44px floor, and the mobile layout does not change that**
Measured at 1440×900 and unchanged at 375×812: close ✕ 36×36, expand 36×36, crop 36×36, trash 36×36, ⋯ 36×36, Save 61.8×36, copy-filename 24×24. The three preview discs sit 7px apart *on the photo*, and the outermost — easiest to hit by thumb — is the unconfirmed "Remove file". The sizes are hard-coded pixel constants, so neither the 15px root nor a coarse-pointer query reaches them.
*Fix:* raise the discs to 44×44 under `(pointer: coarse)` at minimum, widen the gap, and move "Remove file" into the ⋯ menu where destructive verbs already live and already confirm.
*Command:* `/impeccable adapt`

**[P1] The drawer never mentions the thing it was opened to fix**
The list marks undescribed files "Needs description" in red. Inside, Description is an empty box visually identical to the empty optional Credit box below it, with no required state, no error state and no focus. The errand is forgotten at the threshold.
*Fix:* when `alt` is empty on a saved document, carry the list's own red onto the label, promote the help text to the request, and open with focus in that field.
*Command:* `/impeccable onboard`

**[P2] The picture gets 48% of the space, and the field it sits above does not look like a field**
The preview well is 556×200; a 1200×900 image renders at 266×200, leaving 145px of empty grey on each side — the height cap constrains the image while the well keeps full width. Below it, the Description input is `#F0F0EF` on a `#F8F8F7` panel with a transparent border: **1.07:1**, where WCAG 1.4.11 asks 3:1 of a control boundary. And alt text — a sentence — is authored in a single-line input showing about 30 characters on mobile.
*Fix:* let the well shrink to the image's width, or fill it; give both inputs a real border at ≥3:1; make Description a 2–3 row auto-growing textarea.
*Command:* `/impeccable layout`

## Persona Red Flags

**Alex — the Designally content manager, power user, phone as often as desk.** Escape does nothing after a mouse-open; she presses it twice and reaches for the mouse. Save arrives in full brand orange and inert, and clicking it produces no response of any kind. There is no next/previous, so "describe the twelve files Content Studio dropped overnight" is twelve open-click-type-save-close cycles, each ending with focus dumped on `<body>`. One keystroke separates two different wordings of the same question, so she will eventually read neither.

**Sam — screen reader and keyboard only.** Blocking. The drawer opens silently, focus stays in the list, `role` is absent so `aria-modal` is inert, and the name announced is a slug. Tab walks the list underneath the open sheet. Escape does not close it. Once inside, the cycle includes a full-viewport invisible button announced as "Close", the visual disc order (⤢ ✎ 🗑) does not match the tab order (✎ 🗑 ⤢) — WCAG 2.4.3 — the copy button announces as "Copy URL Copy URL", the help text is never announced because no input has `aria-describedby`, the crop modal's heading is `display: none` so that dialog has no accessible name at all, and `action-save` and `nav-toggler` each appear twice as ids on the page.

**Casey — distracted, one thumb, mobile.** Save is 62×36 and ⋯ is 36×36, 7px apart, bottom-right, below the floor and in the zone the thumb reaches by feel. The three preview discs are 36×36 at 7px pitch on the photo, with the unconfirmed trash on the outside edge. Tooltips are the only labelling on those discs and there is no hover on a phone. `.da-bar` is `position: static`, so Save scrolls with the content — the sheet currently fits by 5px, and a two-line description pushes the primary action under the fold with nothing pinned.

## Minor Observations

- `21 Sep 2026` in the list, `21 Sept 2026` in the drawer, for the same record — `toLocaleDateString('en-GB', {month:'short'})` emits "Sept" for September and "Aug" for August.
- The non-image preview is a full-width charcoal block, the heaviest element on a warm-white sheet, carrying one generic glyph. The ⤢ on a zip opens a black lightbox containing nothing, because the lightbox renders for any file with a url.
- `cover-5.jpg` is the largest, darkest text in the sheet. A machine name outranks everything a human wrote.
- `DocActions.css` states "Save is filled whether or not there is anything to write, so the button cannot be what tells you there is." Payload's SaveButton *does* disable when the form is clean, so the stated contract and the shipped behaviour disagree.
- Crop offers "Apply Changes" in brand orange with no statement that it rewrites the original everywhere it is used — while the delete two clicks away goes to real trouble to say exactly that.
- Escape inside the ⋯ menu behaves perfectly: closes the menu only, returns focus to the trigger. That layer got the attention the drawer did not.
- Eleven hard-coded `#ffffff` literals bypass the token system on this surface; everything else is tokenised. No dark mode exists anywhere in the admin.

## Questions to Consider

1. If nine files in ten arrive already described from Content Studio, why is this a document form at all? The real job is a queue — picture, one field, save, next. The list knows which files need attention; the drawer is the only thing that forgets.
2. Why does the file's own name outweigh the sentence a blind reader will hear? Invert them: make the description, or its absence in red, the sheet's headline, and demote the filename to the facts row where the other machine truths live.
3. The delete confirmation promises "Anything using it — a cover, a card, a download — loses its file." Why doesn't it say which? The relation is queryable, and "Used by nothing" is the answer that makes deleting safe.
