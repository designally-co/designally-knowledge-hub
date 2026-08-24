# Google sign-in for the Hub CMS — plan

Status: proposal. Nothing built.
Scope: how you sign in to `/admin`. No content, no schema, no public site.

## What this is

The same decision already taken for Content Studio, applied to the other half:
signing in with a Designally Google account instead of an email and password.
It is what you specified earlier — *"cms is only for admins (designally google
accounts sign in)"* — and CG simply went first.

## Why it is not the same job as CG

CG **is** NextAuth. Google is its only login and there was nothing else to
reconcile. The Hub is Payload, which brings its own session, its own login
screen, its own user collection and its own cookie. So this is not swapping one
library for another; it is deciding what issues the session.

Measured, not assumed:

| | |
|---|---|
| Auth libraries in the Hub | **none** — Payload's built-in email/password |
| CG's dependency | `next-auth@^5.0.0-beta.32` |
| Hub users (local) | one: `website.team@designally.co` |
| How CG publishes | `Authorization: users API-Key <key>` |
| Payload 3.86 offers | `auth.strategies`, `auth.disableLocalStrategy`, `admin.components.login` |
| Payload also exports | `jwtSign`, `getFieldsToSign`, `generatePayloadCookie` |

That last row is the one that decides the architecture.

## Two ways to build it

### A. Add NextAuth, and teach Payload to trust it

Mirror CG: NextAuth handles Google, and a Payload custom strategy reads the
NextAuth session on every request and resolves it to a Payload user.

Two session systems in one app, and one concrete collision: **Payload already
owns `/api/*`** through `(payload)/api/[...slug]/route.ts`, which is exactly
where NextAuth wants to live. It can be moved with NextAuth's `basePath`, but
the sign-out path then has to clear two cookies and keep them in step, and
"logged into one but not the other" becomes a state that can happen.

### B. Do the OAuth exchange, then issue Payload's own session — **recommended**

A single route handler does the Google authorization-code flow, and on success
finds or creates the Payload user and signs Payload's own token with
`jwtSign` + `generatePayloadCookie`.

From that point Payload's authentication is completely unchanged — same cookie,
same session, same `req.user`, same access control. There is no second session
to keep in step, no new dependency, no custom strategy, and nothing mounted
under `/api`, so the collision above never arises.

The flow:

1. `/auth/google` → redirect to Google with `hd=designally.co`
2. Google → `/auth/google/callback?code=…`
3. Exchange the code server-side (client secret, over TLS, so the response is
   trustworthy), read the `id_token`
4. Gate: `hd` claim is `designally.co`, `email_verified`, and the address ends
   `@designally.co` — the same triple check CG uses, because a personal Gmail
   account otherwise passes a naive test
5. Find the `users` record by email, or create one
6. Sign Payload's token, set the cookie, redirect to `/admin`

## The thing that must not break

**Content Studio publishes with an API key**, and that key lives on a `users`
record. If it is lost, auto-publishing stops.

Two ways it could be lost, both avoidable:

- **Disabling the wrong thing.** `useAPIKey` is a *separate* strategy from the
  local one, so `disableLocalStrategy` does not touch it. Worth stating because
  the names suggest otherwise.
- **Creating a second user.** If the Google address does not match the email on
  the existing record, sign-in creates a *new* user and the API key is stranded
  on the old one. CG's migration only came through this cleanly because the
  addresses matched. The local Hub user is `website.team@designally.co`, which
  would match — **but production has not been checked** (see Open decisions).

Verification either side of the change is the same three calls used when the
API tab was removed: `from-markdown` and `translate-to-thai` must answer **401**
(alive, guarded), not 404.

## The login screen

Payload exposes `admin.components.login`, and `beforeLogin` / `afterLogin`.
Replacing the whole view gives the same single "Continue with Google" button CG
has, ported from the platform's sign-in so the two products match. Logout needs
its own component so it clears the Payload cookie and returns somewhere sensible
rather than to a form that no longer accepts anything.

## Rollout

Deliberately two commits, because this is the one change that can lock everyone
out of the place the published content lives.

1. **Add Google sign-in beside email/password.** Both work. Verified on a Vercel
   preview deployment first — never straight to production.
2. **Remove email/password**, once Google sign-in has actually been used in
   production. `disableLocalStrategy`, and the API key keeps working.

Between the two there is always a way in. Reverting step 1 is deleting a route
and a component; reverting step 2 is one config line.

Rough effort: half a day for step 1, an hour for step 2, most of it verification.

## Risks

- **Lockout.** Mitigated by the two-stage rollout and by proving it on a preview
  URL. If OAuth misconfigures with local auth already removed, the fix is a
  redeploy — recoverable, but not while someone is waiting to publish.
- **Redirect URI.** Google rejects any callback not registered on the client.
  The Hub's production origin *and* `http://localhost:3000` both need adding, or
  it works in one place and not the other.
- **Cookie settings.** Payload's cookie must stay `httpOnly`, `secure` in
  production and `sameSite: 'Lax'` for the OAuth redirect to arrive carrying it.
- **Nothing here touches content.** No schema change, no migration, no
  collection field added or removed.

## Open decisions — needed before building

1. **Which Google OAuth client?** The platform's existing one, or a new one for
   the Hub? Either way the Hub's own redirect URI has to be added — the consent
   screen is still named "designally-platform", which is already worth renaming
   now that it would front three apps.

2. **Who gets in?** CG's rule is that anyone with a `@designally.co` Google
   account signs in and is an admin. Same for the Hub, or an explicit allowlist?
   Same-as-CG is simpler and matches what you said; an allowlist matters only if
   the domain has accounts that should not reach published content.

3. **What is the production Hub user's email, and does it hold CG's API key?** I
   can see the local database but not production, and this is the one fact that
   decides whether the migration is seamless or strands the publishing key. If
   it is `website.team@designally.co`, it matches and there is nothing to do.
   Worth confirming in the admin's Users list before I start.
