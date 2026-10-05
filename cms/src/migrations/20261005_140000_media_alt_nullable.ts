import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * A file may be saved without a description, in the database as in the config.
 *
 * WHY. `alt` stopped being required in Media at the start of September, so
 * that a picture could arrive without a form (see the field's note). Production's
 * `media` table was made before that, and nothing ever relaxed its NOT NULL — so
 * every upload with no description, which is every upload from the library's
 * "Upload new", made its files in R2 and was then refused by the insert: "null
 * value in column "alt" of relation "media" violates not-null constraint". Seen
 * on 5 October 2026 with a 12.6MB PNG; any size fails the same way.
 *
 * SAFE UNDER THE CODE ALREADY DEPLOYED, which already treats the field as
 * optional. Relaxing a constraint cannot invalidate a row, and DROP NOT NULL
 * on a column that is already nullable does nothing, so running it twice is
 * harmless.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" ALTER COLUMN "alt" DROP NOT NULL;
  `)
}

/**
 * Required again. Rows saved without a description since get their filename
 * first, which is also what the admin shows for them, so the constraint has
 * nothing to refuse.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "media" SET "alt" = COALESCE("filename", '') WHERE "alt" IS NULL;
    ALTER TABLE "media" ALTER COLUMN "alt" SET NOT NULL;
  `)
}
