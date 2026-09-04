import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The four things production is missing, and nothing else.
 *
 * WHY THIS IS HAND-WRITTEN. `payload migrate:create` with no migration history
 * generates the schema FROM SCRATCH — 17 unguarded `CREATE TABLE`s including
 * `articles`, `media` and `users`. Against a populated database every one of
 * them fails on "relation already exists"; it is the right file for an empty
 * database and the wrong one for this. What follows was taken from that
 * generated file, keeping only the objects a live check proved absent:
 *
 *     subscribers                                 table    missing
 *     enum_subscribers_locale / _status           types    missing
 *     articles.newsletter_sent_at                 column   missing
 *     resources.newsletter_sent_at                column   missing
 *     payload_locked_documents_rels.subscribers_id column  missing
 *     articles.tag                                still NOT NULL
 *
 * A full comparison of the config's schema against the live database found no
 * other drift, so this is the whole gap.
 *
 * IT IS ADDITIVE. Nothing is dropped, nothing is rewritten, no row is touched.
 * The one change to an existing column relaxes a constraint — `tag` stops being
 * NOT NULL, which is what lets an article be saved before it has been filed.
 * Relaxing a constraint cannot invalidate data that already satisfies it.
 *
 * `IF NOT EXISTS` throughout, so running it twice is harmless and a partial
 * failure can simply be re-run.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_subscribers_locale" AS ENUM('en', 'th');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_subscribers_status" AS ENUM('subscribed', 'unsubscribed');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "subscribers" (
      "id" serial PRIMARY KEY NOT NULL,
      "email" varchar NOT NULL,
      "locale" "enum_subscribers_locale" DEFAULT 'en',
      "source" varchar,
      "status" "enum_subscribers_status" DEFAULT 'subscribed',
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_email_idx" ON "subscribers" USING btree ("email");
    CREATE INDEX IF NOT EXISTS "subscribers_updated_at_idx" ON "subscribers" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");

    ALTER TABLE "articles"  ADD COLUMN IF NOT EXISTS "newsletter_sent_at" timestamp(3) with time zone;
    ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "newsletter_sent_at" timestamp(3) with time zone;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "subscribers_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk"
        FOREIGN KEY ("subscribers_id") REFERENCES "public"."subscribers"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_subscribers_id_idx"
      ON "payload_locked_documents_rels" USING btree ("subscribers_id");

    ALTER TABLE "articles" ALTER COLUMN "tag" DROP NOT NULL;
  `)
}

/**
 * Down puts the constraint back and removes what up added.
 *
 * IT DROPS THE SUBSCRIBER LIST, which is the one genuinely destructive thing in
 * this file — so it is here to be correct, not to be run casually. Export the
 * list before you reverse this.
 *
 * `tag` is restored to NOT NULL, which FAILS if any article has been saved
 * without one in the meantime. That is the honest behaviour: the alternative is
 * inventing a tag for somebody's draft.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "subscribers_id";
    ALTER TABLE "articles"  DROP COLUMN IF EXISTS "newsletter_sent_at";
    ALTER TABLE "resources" DROP COLUMN IF EXISTS "newsletter_sent_at";
    DROP TABLE IF EXISTS "subscribers";
    DROP TYPE IF EXISTS "public"."enum_subscribers_status";
    DROP TYPE IF EXISTS "public"."enum_subscribers_locale";
    ALTER TABLE "articles" ALTER COLUMN "tag" SET NOT NULL;
  `)
}
