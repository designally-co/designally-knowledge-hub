import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * The `settings` global: one row of site-wide settings, holding for now the
 * Claude model the Thai translation runs on (globals/Settings.ts). It is picked
 * from a dropdown on the account screen instead of the TRANSLATE_MODEL env var,
 * so changing it needs no deploy.
 *
 * NO ROW IS INSERTED. Until someone picks a model, Payload reads the global as
 * empty and its field hook answers TRANSLATE_MODEL, then Opus 5 — exactly what
 * translation used before this table existed.
 *
 * SAFE UNDER THE CODE ALREADY DEPLOYED, which does not know the table. And the
 * new code survives running before this does: translate.ts falls back to the
 * env var if the global cannot be read. Still, per the runbook, this goes
 * first.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_settings_translate_model" AS ENUM('claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5');

    CREATE TABLE "settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "translate_model" "enum_settings_translate_model",
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "settings";
    DROP TYPE "public"."enum_settings_translate_model";
  `)
}
