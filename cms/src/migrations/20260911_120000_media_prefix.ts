import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Adds `prefix` to media — which store a file is in. `hub` is Cloudflare R2;
 * empty is Supabase Storage, where every file uploaded before the move stays.
 *
 * NULLABLE, AND NO DEFAULT — THE WHOLE MIGRATION IS THAT CLAUSE. Adding a
 * column with a default fills it on every existing row, and `hub` on the 61
 * rows from before the move would point each of them at an R2 key that does
 * not exist: every cover on the site gone at once, with the files sitting
 * untouched in Supabase. Payload writes `hub` itself on every new upload.
 *
 * SAFE UNDER THE CODE ALREADY DEPLOYED, which is why it runs first. That code
 * does not know the column: its selects name their columns and its inserts
 * name theirs, so a nullable column with no default is invisible to it.
 *
 * ORDER MATTERS: this runs BEFORE the code that reads `prefix` is deployed —
 * the reverse is what took the site down on 4 September.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "public"."media" ADD COLUMN IF NOT EXISTS "prefix" varchar;
  `)
}

/**
 * Refuses once any file is in R2. Dropping the column then would not undo
 * anything — it would forget which rows are in R2, and send each of them back
 * to look for its file in Supabase.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  const result = await db.execute(sql`
    SELECT count(*)::int AS n FROM "public"."media" WHERE "prefix" IS NOT NULL;
  `)
  const n = Number(result.rows?.[0]?.n ?? 0)
  if (n > 0) {
    throw new Error(`Refusing to drop media.prefix: ${n} row(s) have files in R2 and would lose track of them.`)
  }
  await db.execute(sql`
    ALTER TABLE "public"."media" DROP COLUMN IF EXISTS "prefix";
  `)
}
