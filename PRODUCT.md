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
- **Authoring runs without engineering.** Alex works in a CMS: draft, preview, schedule, publish; upload files and set metadata; reorder video collections; edit per-resource SEO fields. Content operations must never require a developer.
- **The Hub is judged as a work sample.** It is a design agency's own site, so its craft is read as evidence of the agency's craft.

## Capabilities and Constraints

**Content model.** One unifying **Resource** concept with a `type` field. Common fields: title, slug, type, summary/excerpt, body/description, primary category, tags, thumbnail/cover image, author, publish date, status (draft/scheduled/published), SEO fields, related resources. Type-specific fields per PRD §7.1:
- *Article/tutorial* — rich body (headings, images, code/embed blocks, callouts), estimated read time.
- *Template/asset* — downloadable file(s), format(s) (Figma, PSD, PDF, SVG), file size, licence terms, preview images, download-gating flag.
- *Video lesson* — externally hosted embed, duration, parent collection, order within collection.
- *Course/collection* — ordered list of lessons, overview, level/track.
- *Tool/link entry* — name, logo, short description, category, outbound URL, optional free/paid flag.

**In scope for v1.** Four content types; curated category taxonomy plus free-form tags; landing pages per type and per category, paginated; lexical keyword search across titles, summaries, tags and body, filterable by type and category; related resources on every resource page; newsletter signup site-wide; email-gated downloads configurable per asset (fully free / email-gated / ungated all supported); contextual services CTAs; non-technical CMS authoring with media library, scheduling and per-resource SEO controls; sitemaps, structured data (Article, VideoObject, HowTo, ItemList), social share cards; analytics.

**Explicitly out of scope for v1.** Paid content, memberships, paywalls, e-commerce. User accounts, saved/favourites, personalisation. Comments, ratings, community, user-generated submissions. Full LMS features (progress tracking, quizzes, certificates) — v1 "courses" are structured collections only. Multi-language/localisation. AI/semantic search or a chat assistant over the library. Contributor/guest-author workflows and multi-role editorial approval. Also not a client project portal and not a replacement for the main Designally site.

**Non-functional requirements, treated as launch gates.** Strong Core Web Vitals; server-rendered or statically generated pages for crawlability; clean semantic URLs; fast on mobile networks. Fully responsive, mobile through desktop. Must absorb traffic spikes from a resource ranking or going viral without degradation, including downloads and embeds. Secure handling of email data and downloads, bot protection on email capture, GDPR/CCPA compliance including marketing-email consent and cookie/consent handling.

**Current implementation.** Vite + React 18 + react-router-dom, lucide-react for icons, design tokens as plain CSS in `tokens/` consumed by `src/index.css`. Eight reusable components in `src/design-system/`. Four routes: `/`, `/browse/:topic`, `/article`, `/subscribe`. This codebase is the confirmed foundation for the Hub — it will be rebranded and extended, not discarded. Against the v1 scope above it currently implements the article/editorial type only: templates/assets, video lessons and the tools directory are absent, as are search, filters, gating and any CMS.

**Undecided product facts — do not invent answers.** Default download-gating stance and which assets require email. Platform/CMS choice. Video host (YouTube vs Vimeo/Wistia vs a mix). Seed-library size per type. Publishing cadence and ownership. Numeric success targets. Whether a paid tier is on the roadmap. Whether the Hub lives on a subdomain or a subdirectory, and how navigation is shared with the main site.

## Brand Commitments

- **Name:** Designally Knowledge Hub. The agency is Designally; the brand promise is "Your Creative Design Ally."
- **A real Designally brand exists and is binding** — defined logo, palette and typefaces, to be supplied by the user. **None of these assets are in the repository yet.** Future visual work must use the real brand once supplied and must not invent a substitute identity in the meantime.
- **The current visual system is a placeholder to be replaced, not a brand.** The warm-paper cream palette (`--be-paper: #f4ebe1`), the Newsreader + Hanken Grotesk pairing, and the "Branding Explained" wordmark all belong to a prior exercise reconstructed from a reference screenshot; `tokens/fonts.css` records that the fonts are stand-ins chosen because no real font files were available. Preserve nothing here for identity reasons. The component architecture and token structure remain useful; the identity values inside them do not.
- **Tone:** genuinely helpful and free, never an ad. Services CTAs stay contextual and tasteful; the "free and helpful" promise is central and gating defaults generous (PRD §11).

## Evidence on Hand

- **PRD.md** — the approved product requirements document (Draft v1.0, 21 July 2026), the authority for scope, content model, metrics and milestones.
- **The existing codebase** — a working React app with a token system and eight components, confirmed as the Hub's foundation.
- **No real content or audience exists yet.** Every article, case study, resource, topic, author byline and date in `src/data.js` is invented placeholder content, and the card images are brand-tinted colour blocks rather than real assets. There is no published library, no subscriber list, no download history, no analytics baseline.
- **Do not fabricate:** testimonials, client names, case studies, subscriber or traffic numbers, download counts, resource counts, publication dates, author names, licences, or agency credentials. The placeholder content in `src/data.js` names real agencies (Wolff Olins, Pentagram, DixonBaxi, Collins and others) in invented articles about them; that content is not evidence and must not be treated as real editorial or carried into anything public.

## Product Principles

1. **Useful before promotional.** Every page earns the visitor's trust by solving their problem first. The services CTA is a consequence of value delivered, never a toll gate on it.
2. **Every resource page is a front door.** Search traffic lands deep, cold, and mostly on mobile. Each resource orients a stranger, proves quality on its own, and offers a credible next step without assuming a homepage visit.
3. **One Resource model, four experiences.** Templates, articles, videos and tools share taxonomy, search and CMS mechanics, but reading, downloading, watching and comparing are different jobs and deserve genuinely different treatments — not one card grid wearing four labels.
4. **Craft is the argument.** The Hub is a design agency's own product; its performance, accessibility and finish are the portfolio piece. NFRs are launch gates, not polish.
5. **Publishing must stay cheap.** The library only compounds if Alex can ship a resource in minutes. Every design decision is measured against the cost of producing the hundredth resource, not the first.

## Accessibility & Inclusion

Target **WCAG 2.1 AA** (PRD §8): semantic markup, full keyboard navigation, sufficient colour contrast, alt text on images, and captions/transcripts for video where feasible. Treated as both an ethical baseline and an SEO and audience-reach benefit, and as a launch gate rather than a follow-up.
