# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Four confirmed audiences, per PRD.md §4. The first three are visitors; the fourth is internal.

- **Maya — the levelling-up designer.** Early-to-mid career designer or student. Sharpening skills, looking for quality templates to learn from and adapt, discovering better tools. Values practical, no-fluff content. The primary driver of traffic and social sharing. Success: she learns something, downloads an asset, subscribes, recommends the Hub to peers.
- **Sam — the time-strapped founder / marketer.** Runs or markets a small business. Needs design assets fast; occasionally needs professional help but doesn't know where to start. Arrives to solve an immediate problem — grab a template, read a how-to. Success: an immediate win, trust in Designally, a later enquiry.
- **Priya — the prospective client.** Evaluating whether to hire a design agency. The Hub is her proof of expertise. Success: the depth and quality of the resources convince her Designally knows its craft, and she books a call.
- **Alex — the Designally content manager (internal).** Publishes and maintains resources. Needs to add articles, upload assets, embed videos and curate tool links without engineering help. Success: publishes a resource end-to-end in minutes, not hours.

A large share of discovery traffic is expected to be mobile.

## Product Purpose

The Designally Knowledge Hub is a public, free resource library — an SEO-driven destination where designers, marketers, founders and prospective clients come to learn, download and discover. It brings four content types under one roof: downloadable templates and assets, written articles and tutorials, video lessons and courses, and a curated directory of tools and links.

It serves two ends at once. For the audience it is a genuinely useful, always-free library that builds skill and saves time. For Designally it is a top-of-funnel asset that establishes authority, drives organic search traffic, grows an email audience, and warms prospects toward the agency's paid services.

**North-star metric:** monthly organic sessions to the Hub. Supporting KPIs: newsletter subscribers and subscription conversion rate, gated-download completions, pages per session and time on resource, clicks from Hub to services/contact and attributed leads, and resources published per month. Specific numeric targets are undecided and to be set with leadership (PRD §9.3).

## Positioning

An agency giving away its actual working materials — the templates, checklists, briefs and worksheets Designally uses on real client work — rather than publishing articles about design. The proof of expertise is the usefulness of the assets themselves, which a competitor cannot copy without giving away equivalent craft. This lives up to the brand promise of being "Your Creative Design Ally": the Hub helps you whether or not you ever hire the agency.

The Hub complements and links into Designally's main marketing site; it does not replace it. It is not the agency's portfolio and not a sales page.

## Operating Context

- **Discovery is mostly cold and search-led.** Most visitors arrive on a deep resource page from Google, not on the homepage, with no prior knowledge of Designally. Every resource page therefore has to work as an entry point: orient the visitor, prove quality, and offer a next step.
- **The visit is task-shaped and short.** Maya and Sam arrive with a specific job — find a template, learn one technique, pick a tool — and leave when it's done. Depth of session comes from related resources, not from browsing.
- **Consumption is mixed-medium.** Reading an article, downloading a file and using it in another tool, and watching a video lesson are three different postures on the same site.
- **Authoring runs without engineering, from a phone as often as a desk.** Alex drafts, publishes, uploads files and edits SEO in the Payload admin — which has been substantially reworked for small screens, because that is where the work actually happens — or publishes a finished article straight from Content Studio. Content operations must never require a developer. There is no scheduled publishing: publishing is an act, not a date.
- **The Hub is judged as a work sample.** It is a design agency's own site, so its craft is read as evidence of the agency's craft.

## Capabilities and Constraints

**Content model, as built.** The PRD's single **Resource** concept with a `type` field was NOT how this was built. Articles and Resources are two separate Payload collections, because the fields barely overlapped once written down: an article has a body, a reading time and one tag; a resource has files, formats, a licence and a file size. One collection carrying both would have been a `type` field plus two disjoint sets of conditionally-hidden fields.

- **Articles** — `title`, `slug`, `summary`, Lexical `body` (plus `bodyMarkdown`, the English source kept so the Thai translation can be regenerated), `coverImage` (upload) or `coverUrl` (external string), exactly ONE `tag` from the taxonomy, `references[]`, `related[]`, reading time, `publishedDate`, `status` (draft/published), SEO fields, `newsletterSentAt`.
- **Resources** — `description`, `files[]` (each with a `format`), `licence`, `fileSize`, its own `category`, SEO fields.
- **Media** — uploads, with `card`/`hero`/`thumbnail` derivatives generated on upload.
- **Subscribers** — the newsletter list. **Users** — CMS accounts.

An article carries a single tag rather than many: it is what the listings, the category chrome and the Content Studio integration all assume, and a multi-tag article had no page that could show it.

**Built and live.** Articles and resources with a curated tag taxonomy mapped to categories; the home, category, tag and resource listings; an article page with related articles (editor-chosen, falling back to same-tag); site-wide newsletter signup with double opt-in and an announcement on publish; keyword search across titles, summaries and tags via the header (`lib/searchHub.ts`); ungated downloads; contextual services CTAs; `sitemap.ts` with locale alternates, `robots.ts`, Article/JSON-LD structured data, a real 404; Vercel Analytics; **bilingual EN/TH throughout**.

**In the PRD's v1 scope but NOT built.** Video lessons, courses/collections and the tools-and-links directory — three of the four promised content types do not exist. A public search RESULTS page: search runs from the header only, so a query cannot be linked to or shared. Scheduled publishing. Email-gated downloads (the gating flag was never built; every download is free, which matches the "generous by default" stance but means gating is unavailable rather than merely unused).

**Explicitly out of scope.** Paid content, memberships, paywalls, e-commerce. User accounts, saved/favourites, personalisation. Comments, ratings, community, user-generated submissions. Full LMS features. AI/semantic search or a chat assistant over the library. Contributor/guest-author workflows and multi-role editorial approval. Also not a client project portal and not a replacement for the main Designally site.

*Multi-language was on this list and has shipped* — the Hub is bilingual English/Thai, with Thai translations generated by Claude at publish time and reviewable in the admin.

**Non-functional requirements, treated as launch gates.** Strong Core Web Vitals; server-rendered or statically generated pages for crawlability; clean semantic URLs; fast on mobile networks. Fully responsive, mobile through desktop. Must absorb traffic spikes without degradation. Secure handling of email data and downloads, bot protection on email capture, GDPR/CCPA compliance including marketing-email consent.

*Where they actually stand.* Static generation, semantic URLs, responsiveness and spike tolerance are structurally satisfied — pages are prerendered and served from a CDN. Marketing-email consent is genuinely met: double opt-in, an unsubscribe link in every message plus the `List-Unsubscribe` header, and an `unsubscribed` row that is never deleted because it is the only record that someone asked not to be mailed. Sign-up is bot-defended by a honeypot rather than a CAPTCHA, deliberately. **Core Web Vitals have never been measured** — the gate is asserted, not verified. No cookie banner exists; Vercel Analytics is cookieless, so nothing currently sets one, and this should be re-checked before any tracking that does.

**Current implementation.** The Vite SPA this document used to describe is gone. Everything lives in `cms/`: **Payload CMS 3.86 on Next.js 16 (App Router)**, one application serving both the admin and the public site, split by route group — `(payload)` for the admin, `(frontend)` for the site. Public pages are statically generated with ISR (`revalidate = 60`) and `generateStaticParams`, so the site is crawlable and fast and content changes appear within about a minute without a deploy.

- **Database.** Postgres (Supabase) in production, SQLite locally, chosen by `DATABASE_URI`. **Production schema changes go through Payload migrations only** — `push` is `NODE_ENV !== 'production'`. A field added to the config without a migration silently never reaches production, and that is what took the site down on 4 September 2026.
- **Hosting.** Vercel. Its 4.5MB request-body ceiling is a live design constraint, not a footnote: it is why Content Studio sends the Hub a signed URL for a cover image and the Hub fetches the file itself, rather than uploading bytes.
- **Routes.** `/`, `/articles/[slug]`, `/resources`, `/resources/[slug]`, `/category/[slug]`, `/tag/[slug]`, `/about`, `/contact`, `/newsletter`, a catch-all 404, and `/design-system`. There is no `/articles` index — articles are reached from the home page, categories and tags.
- **Bilingual.** Payload localisation with `en` and `th`. English is served unprefixed and rewritten to the internal `/en` tree by middleware; Thai lives under `/th`. Build public URLs with `localeHref`, never by hand — a literal `/en/...` 404s.
- **Admin access.** Google SSO for `designally.co` only; there is no password door (the login operation is refused by a hook). Everyone who signs in is an admin — there are no roles.
- **Authoring runs on two paths.** Editors work in the Payload admin, which has been reworked for phones; and Content Studio, a separate application, publishes finished articles to `POST /api/articles/from-markdown` and covers to `POST /api/media/from-url`, authenticated with a `users` API key.
- **Email.** Resend. Signing up creates a `pending` subscriber and sends a confirmation; only the link in it joins the list. Publishing an article or resource announces it to confirmed subscribers once, guarded by a `newsletterSentAt` stamp. Unsubscribe and confirm links are HMACs of the address under `PAYLOAD_SECRET`, with a purpose in the signature so one cannot be spent as the other.

**Undecided — do not invent answers.** Numeric success targets. Whether a paid tier is on the roadmap. The Hub's permanent domain: it runs on `designally-knowledge-hub.vercel.app`, and whether it moves to a subdomain or subdirectory of the main site — and how navigation would then be shared — is unsettled. Whether the three unbuilt content types (video, courses, tools) are still wanted or have been dropped. Publishing cadence is currently about one article a week, which is an observation rather than a commitment.

*Since decided:* the CMS is Payload; video, if it happens, is YouTube; downloads are ungated by default.

## Brand Commitments

- **Name:** Designally Knowledge Hub. The agency is Designally; the brand promise is "Your Creative Design Ally."
- **A real Designally brand exists and is binding.** Two pieces of it have arrived and are now in the repository: the **mark** (`cms/public/designally-mark.png`) and the **brand orange, `#ef6148`**. The orange is a brand rule — it has been corrected once already in review. Do not substitute, tune or "improve" either. The rest of the identity — the full palette and the real typefaces — has still not been supplied, and must not be invented in the meantime.
- **The brand orange is applied in the ADMIN only.** It lives in `cms/src/app/(payload)/custom.scss` as `--da-orange`. The public site's tokens (`cms/src/styles/tokens/`) do not reference it; their accent is still ink.
- **The public site's visual system is a placeholder, not a brand.** The warm-paper palette (`--be-paper: #f9f6f4`, `--be-ink: #12100d`) and the Newsreader + Hanken Grotesk pairing belong to a prior exercise reconstructed from a reference screenshot, with Noto Serif/Sans Thai added for the Thai locale. Preserve nothing here for identity reasons. The token structure remains useful; the identity values inside it do not.
- **Tone:** genuinely helpful and free, never an ad. Services CTAs stay contextual and tasteful; the "free and helpful" promise is central and gating defaults generous (PRD §11).

## Evidence on Hand

- **PRD.md** — the approved product requirements document (Draft v1.0, 21 July 2026). Still the authority for intent, audience and metrics; it is now BEHIND the build on the content model (it describes one Resource type) and on localisation (it excludes it). Where the two disagree, this document records what exists.
- **The running product is the best evidence.** As of 4 September 2026 the Hub is live with 22 published articles and 6 resources, in English and Thai, most of them written and published through Content Studio. This is real editorial, not placeholder. (That count is a dated snapshot — read the database, not this line, if the number matters.)
- **The audience is effectively zero and must not be dressed up.** The subscriber list is in single figures and consists of the team's own addresses. Vercel Analytics is installed but no baseline has been read, Core Web Vitals have never been measured, and there is no download history. There is nothing here to quote as traction.
- **The local seed data is still invented, and still names real agencies.** `cms/src/seed-data.js` — used by `npm run seed` to fill a development database — contains fabricated articles about Wolff Olins, Pentagram, DixonBaxi, Collins and others. It is development scaffolding, must never be treated as editorial, and must never reach production. Note that `npm run seed` DELETES all articles and resources before inserting.
- **Do not fabricate:** testimonials, client names, case studies, subscriber or traffic numbers, download counts, publication dates, author names, licences, or agency credentials.

## Product Principles

1. **Useful before promotional.** Every page earns the visitor's trust by solving their problem first. The services CTA is a consequence of value delivered, never a toll gate on it.
2. **Every resource page is a front door.** Search traffic lands deep, cold, and mostly on mobile. Each resource orients a stranger, proves quality on its own, and offers a credible next step without assuming a homepage visit.
3. **One Resource model, four experiences.** Templates, articles, videos and tools share taxonomy, search and CMS mechanics, but reading, downloading, watching and comparing are different jobs and deserve genuinely different treatments — not one card grid wearing four labels.
4. **Craft is the argument.** The Hub is a design agency's own product; its performance, accessibility and finish are the portfolio piece. NFRs are launch gates, not polish.
5. **Publishing must stay cheap.** The library only compounds if Alex can ship a resource in minutes. Every design decision is measured against the cost of producing the hundredth resource, not the first.

## Accessibility & Inclusion

Target **WCAG 2.1 AA** (PRD §8): semantic markup, full keyboard navigation, sufficient colour contrast, alt text on images, and captions/transcripts for video where feasible. Treated as both an ethical baseline and an SEO and audience-reach benefit, and as a launch gate rather than a follow-up.
