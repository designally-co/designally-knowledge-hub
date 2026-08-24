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

**Corrected after reading Payload's source.** An earlier draft of this plan
said a mismatched Google address would strand the key and stop auto-publishing.
That is wrong, and the correction matters because it was the loudest risk here.

`APIKeyAuthentication` resolves the user by `apiKeyIndex` alone — an HMAC of the
key against `payload.secret`. It never looks at the email, never consults the
local strategy, and does not care whether anyone can sign in as that user
interactively. So:

- **`disableLocalStrategy` does not touch it.** `useAPIKey` is a separate
  strategy. Worth stating because the names suggest otherwise.
- **A mismatched Google address does not break publishing.** It creates a second
  user record, which is untidy — a legacy account nobody can log into, holding
  the key, beside a Google account that can. CG keeps publishing throughout.

The one thing that *would* break every API key is changing `PAYLOAD_SECRET`,
since every `apiKeyIndex` is derived from it. That is unrelated to this work and
worth knowing anyway.

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

1. **Add Google sign-in beside email/password.** Both work. Proven locally
   first, then in production with local auth still enabled.

   Note on "verify it on a preview deployment first", which the earlier draft
   said and which does not survive contact with Google: **redirect URIs cannot
   contain wildcards**, and Vercel preview URLs are per-deployment. A preview
   would need its own stable alias registered on the client. Either register
   one, or accept that step 1's production test is the first real one — which is
   what keeping email/password alive through it is for.
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

1. ~~Which Google OAuth client?~~ **Settled: the same one CG uses.** So the Hub
   takes CG's `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` values, and two redirect
   URIs must be added to that client in the Google console — something only you
   can do:

       http://localhost:3000/auth/google/callback
       https://designally-knowledge-hub.vercel.app/auth/google/callback

   The consent screen is still named "designally-platform" and would now front
   three apps, which is worth renaming while you are in there.

2. **Who gets in?** CG's rule is that anyone with a `@designally.co` Google
   account signs in and is an admin. Same for the Hub, or an explicit allowlist?
   Same-as-CG is simpler and matches what you said; an allowlist matters only if
   the domain has accounts that should not reach published content.

3. **What is the production Hub user's email?** Downgraded from critical to
   tidiness, per the correction above: publishing survives either way. If it
   matches the Google address, that record is reused and nothing changes. If it
   does not, you end up with a spare legacy account, and the question is only
   whether to merge or delete it afterwards.
