import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/** Align the database default with the sign-up flow. Existing rows stay intact. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "public"."subscribers" ALTER COLUMN "status" SET DEFAULT 'pending';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "public"."subscribers" ALTER COLUMN "status" SET DEFAULT 'subscribed';`)
}
