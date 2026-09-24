import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Resource categories become data: a `resource_categories` table, and each
 * resource points at a row of it instead of holding one of five fixed names.
 *
 * WHY. The five categories were an enum, so a resource that was not a
 * template, a font, an ebook, a wallpaper or an icon set could not be filed
 * without a deploy. Now an editor adds a category from the resource form, and
 * it gets a cover — colour and glyph — at random (collections/ResourceCategories).
 *
 * IN ORDER, AND NOTHING IS LOST:
 *   1. the table, and the five categories with the covers they always had;
 *   2. `resources.category_id`, filled from each resource's old `category` by
 *      name — every value of the old enum has a row, so every resource maps;
 *   3. only then NOT NULL, the foreign key and its index;
 *   4. the old `category` column and its enum go last.
 *   5. the admin's document locks learn the new collection.
 *
 * Step 3 fails — and with it the whole migration, which runs in a transaction —
 * if any resource were left without a category, rather than leaving one
 * orphaned. `down` reverses it, restoring the enum values from the names.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_resource_categories_color" AS ENUM('blue', 'red', 'green', 'purple', 'orange', 'navy');
    CREATE TYPE "public"."enum_resource_categories_glyph" AS ENUM('grid', 'type', 'book', 'image', 'shapes');

    CREATE TABLE "resource_categories" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "color" "enum_resource_categories_color",
      "glyph" "enum_resource_categories_glyph",
      "slug" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX "resource_categories_name_idx" ON "resource_categories" USING btree ("name");
    CREATE UNIQUE INDEX "resource_categories_slug_idx" ON "resource_categories" USING btree ("slug");
    CREATE INDEX "resource_categories_updated_at_idx" ON "resource_categories" USING btree ("updated_at");
    CREATE INDEX "resource_categories_created_at_idx" ON "resource_categories" USING btree ("created_at");

    -- One at a time, so created_at keeps them in their old order.
    INSERT INTO "resource_categories" ("name", "slug", "color", "glyph", "created_at", "updated_at") VALUES
      ('Templates',       'templates',          'blue',   'grid',   now(),                          now()),
      ('Fonts',           'fonts',              'red',    'type',   now() + interval '1 millisecond', now()),
      ('Ebooks & Guides', 'ebooks-and-guides',  'green',  'book',   now() + interval '2 millisecond', now()),
      ('Wallpapers',      'wallpapers',         'purple', 'image',  now() + interval '3 millisecond', now()),
      ('Icons',           'icons',              'orange', 'shapes', now() + interval '4 millisecond', now());

    ALTER TABLE "resources" ADD COLUMN "category_id" integer;
    UPDATE "resources" AS r SET "category_id" = c."id"
      FROM "resource_categories" AS c
      WHERE c."name" = r."category"::text;
    ALTER TABLE "resources" ALTER COLUMN "category_id" SET NOT NULL;
    ALTER TABLE "resources" ADD CONSTRAINT "resources_category_id_resource_categories_id_fk"
      FOREIGN KEY ("category_id") REFERENCES "public"."resource_categories"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX "resources_category_idx" ON "resources" USING btree ("category_id");

    ALTER TABLE "resources" DROP COLUMN "category";
    DROP TYPE "public"."enum_resources_category";

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "resource_categories_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resource_categories_fk"
      FOREIGN KEY ("resource_categories_id") REFERENCES "public"."resource_categories"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "payload_locked_documents_rels_resource_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("resource_categories_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_resource_categories_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_resource_categories_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "resource_categories_id";

    CREATE TYPE "public"."enum_resources_category" AS ENUM('Templates', 'Fonts', 'Ebooks & Guides', 'Wallpapers', 'Icons');
    ALTER TABLE "resources" ADD COLUMN "category" "enum_resources_category";
    -- A category added since has no enum value; its resources take Templates.
    UPDATE "resources" AS r SET "category" = CASE
        WHEN c."name" IN ('Templates', 'Fonts', 'Ebooks & Guides', 'Wallpapers', 'Icons')
          THEN c."name"::"enum_resources_category"
        ELSE 'Templates'::"enum_resources_category"
      END
      FROM "resource_categories" AS c
      WHERE c."id" = r."category_id";
    UPDATE "resources" SET "category" = 'Templates' WHERE "category" IS NULL;
    ALTER TABLE "resources" ALTER COLUMN "category" SET NOT NULL;

    ALTER TABLE "resources" DROP CONSTRAINT IF EXISTS "resources_category_id_resource_categories_id_fk";
    DROP INDEX IF EXISTS "resources_category_idx";
    ALTER TABLE "resources" DROP COLUMN "category_id";

    DROP TABLE "resource_categories";
    DROP TYPE "public"."enum_resource_categories_color";
    DROP TYPE "public"."enum_resource_categories_glyph";
  `)
}
