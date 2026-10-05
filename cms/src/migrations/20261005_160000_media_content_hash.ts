import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * A fingerprint for every media file, so the same picture is filed once.
 *
 * WHY. Article Studio sends its cover with every publish, and each one became
 * a new row: on 5 October 2026 the library held 86 files of which 36 were used,
 * the rest earlier copies of the same covers under the same names. Media now
 * records the SHA-256 of its bytes (`contentHash`), and `/api/media/from-url`
 * hands back the row that already holds identical bytes instead of making
 * another. Indexed, because that lookup runs on every publish.
 *
 * SAFE UNDER THE CODE ALREADY DEPLOYED, which neither reads nor writes the
 * column: a new nullable column is invisible to it. So, per the runbook, this
 * runs first and the code that fills it deploys after. Existing rows stay
 * empty — they are never matched, which is the behaviour they have today.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "content_hash" varchar;
    CREATE INDEX IF NOT EXISTS "media_content_hash_idx" ON "media" USING btree ("content_hash");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "media_content_hash_idx";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "content_hash";
  `)
}
