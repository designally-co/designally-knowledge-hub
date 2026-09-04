import { getPayload } from 'payload'

import config from '@payload-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/health — what is actually deployed here, and can it reach what it
 * needs.
 *
 * This exists because of two occasions when the answer to "did my push
 * deploy?" was unavailable. A change that is server-side only — an endpoint's
 * behaviour, an access rule, an auth hook — is invisible from outside the app,
 * and the Hub had nothing to ask. The second time cost ten minutes of polling
 * an endpoint that could not have shown the change anyway, because Payload
 * checks credentials before the hook under test ever runs.
 *
 * Content Studio has had the same route for a while and it has repeatedly
 * turned "something is broken" into a one-line answer. This is its counterpart.
 *
 * DELIBERATELY UNAUTHENTICATED. Its whole job is to be reachable when nobody
 * can sign in, which is exactly when it is wanted — and this admin is now
 * Google-only, so a broken OAuth client means no session at all. It is
 * therefore careful about what it says: environment variables are reported as
 * present/absent booleans and never by value, and the database is proved by
 * counting published articles rather than returning any of them.
 *
 * `commit` is the honest answer to "is my push live?" — compare it with
 * `git rev-parse --short HEAD`.
 */

const present = (name: string) => Boolean(process.env[name])

export async function GET() {
  const startedAt = Date.now()

  const env = {
    DATABASE_URI: present('DATABASE_URI'),
    PAYLOAD_SECRET: present('PAYLOAD_SECRET'),
    // Google sign-in. Both must be set or /auth/google fails closed and the
    // admin has no way in at all.
    AUTH_GOOGLE_ID: present('AUTH_GOOGLE_ID'),
    AUTH_GOOGLE_SECRET: present('AUTH_GOOGLE_SECRET'),
    // Thai auto-translation on publish. Absent means articles arrive English
    // only — a degraded publish, not a failed one.
    ANTHROPIC_API_KEY: present('ANTHROPIC_API_KEY'),
    // Media storage. Absent in production means uploads go to the filesystem,
    // which on Vercel does not survive the request.
    S3_BUCKET: present('S3_BUCKET'),
    S3_ENDPOINT: present('S3_ENDPOINT'),
    S3_ACCESS_KEY_ID: present('S3_ACCESS_KEY_ID'),
    S3_SECRET_ACCESS_KEY: present('S3_SECRET_ACCESS_KEY'),
    /* The newsletter. Absent means publishing an article tells nobody — which
       is a quiet failure by design (the send must never break a publish), and
       therefore one you can only find by asking. Which is the whole point of
       this route: the first time this was needed, an article published, no
       email arrived, and nothing outside the runtime logs could say whether
       the key had reached the app at all. */
    RESEND_API_KEY: present('RESEND_API_KEY'),
    NEWSLETTER_FROM: present('NEWSLETTER_FROM'),
  }

  /* Not in `missing`, because it is meant to be absent in normal running: set,
     every announcement goes to one address instead of the list. Worth stating
     plainly — a live newsletter silently mailing one person is the kind of
     thing nobody notices for a month. */
  const newsletterTestMode = present('NEWSLETTER_TEST_TO')

  const missing = Object.entries(env)
    .filter(([, ok]) => !ok)
    .map(([name]) => name)

  let database: { ok: boolean; ms?: number; articles?: number; note?: string }
  try {
    const t0 = Date.now()
    const payload = await getPayload({ config })
    const { totalDocs } = await payload.count({
      collection: 'articles',
      where: { status: { equals: 'published' } },
      overrideAccess: true,
    })
    database = { ok: true, ms: Date.now() - t0, articles: totalDocs }
  } catch (err) {
    database = { ok: false, note: err instanceof Error ? err.message.slice(0, 140) : 'unreachable' }
  }

  const body = {
    newsletterTestMode,
    // `ok` covers what would stop the Hub working at all. A missing Anthropic
    // key or S3 bucket degrades it rather than breaking it, so neither pulls
    // this to false — they are visible in `env` for whoever is looking.
    ok: database.ok && env.DATABASE_URI && env.PAYLOAD_SECRET,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    environment: process.env.VERCEL_ENV ?? 'development',
    region: process.env.VERCEL_REGION ?? null,
    database,
    // The two integrations that are easy to get wrong and silent when they are.
    googleSignIn: env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET,
    thaiTranslation: env.ANTHROPIC_API_KEY,
    mediaStorage: env.S3_BUCKET && env.S3_ENDPOINT ? 's3' : 'filesystem',
    env,
    missing,
    tookMs: Date.now() - startedAt,
  }

  return Response.json(body, {
    status: body.ok ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
