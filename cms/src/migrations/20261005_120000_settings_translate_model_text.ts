import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * The translation model becomes plain text instead of an enum.
 *
 * WHY. The dropdown now lists whatever models Anthropic offers (lib/
 * availableModels), so a model released next month appears without a deploy —
 * but an enum refuses every value it was not created with, and saving that
 * model would fail. Text takes any id; globals/Settings checks its shape.
 *
 * SAFE UNDER THE CODE ALREADY DEPLOYED. That code declares the field a select,
 * reads it as a string and only ever writes one of its four values, all of
 * which a varchar holds. So, per the runbook, this runs first; the new code
 * deploys after it.
 *
 * Every saved value is kept: the cast turns each enum value into its text.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings" ALTER COLUMN "translate_model" SET DATA TYPE varchar USING "translate_model"::text;
    DROP TYPE "public"."enum_settings_translate_model";
  `)
}

/**
 * Back to the enum. A model chosen since that the enum does not name is
 * cleared first (translation then uses TRANSLATE_MODEL or the default), since
 * the cast would otherwise fail on it.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_settings_translate_model" AS ENUM('claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5');
    UPDATE "settings" SET "translate_model" = NULL
      WHERE "translate_model" NOT IN ('claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5');
    ALTER TABLE "settings" ALTER COLUMN "translate_model" SET DATA TYPE "public"."enum_settings_translate_model"
      USING "translate_model"::"public"."enum_settings_translate_model";
  `)
}
