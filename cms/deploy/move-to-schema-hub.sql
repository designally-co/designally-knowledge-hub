-- Moves every Hub table and enum type from `public` to the schema `hub`, in one transaction.
--
-- Why: the Hub is moving into Project Friday, the company's one Supabase project, where other
-- apps' tables already sit (decisions/tables-in-schema-hub.md). This is phase 2 of three: the
-- move happens first in the Hub's own project, then the `hub` schema is copied into Friday.
--
-- Not a Payload migration on purpose: Payload keeps its migration history in payload_migrations,
-- which moves too, so a migration could not record itself. Run it once, by hand, then set the
-- stack variable DB_SCHEMA=hub (docs/deploy-nas.md, "Moving the tables into the schema hub").
--
-- SET SCHEMA moves each table with its rows, indexes, constraints, foreign keys, row security
-- and the sequences its id columns own. Enum types are separate objects, so they move by name;
-- their array types follow. Nothing is copied, nothing is lost.

do $move$
begin
  if to_regnamespace('hub') is not null and exists (select from pg_tables where schemaname = 'hub') then
    raise exception 'schema hub already has tables: the move has run before';
  end if;
  create schema if not exists hub;

  alter table public.articles set schema hub;
  alter table public.articles_locales set schema hub;
  alter table public.articles_references set schema hub;
  alter table public.articles_rels set schema hub;
  alter table public.media set schema hub;
  alter table public.payload_kv set schema hub;
  alter table public.payload_locked_documents set schema hub;
  alter table public.payload_locked_documents_rels set schema hub;
  alter table public.payload_migrations set schema hub;
  alter table public.payload_preferences set schema hub;
  alter table public.payload_preferences_rels set schema hub;
  alter table public.resource_categories set schema hub;
  alter table public.resources set schema hub;
  alter table public.resources_files set schema hub;
  alter table public.resources_locales set schema hub;
  alter table public.settings set schema hub;
  alter table public.subscribers set schema hub;
  alter table public.users set schema hub;
  alter table public.users_sessions set schema hub;

  alter type public."_locales" set schema hub;
  alter type public.enum_articles_status set schema hub;
  alter type public.enum_articles_tag set schema hub;
  alter type public.enum_resource_categories_color set schema hub;
  alter type public.enum_resource_categories_glyph set schema hub;
  alter type public.enum_resources_files_format set schema hub;
  alter type public.enum_resources_status set schema hub;
  alter type public.enum_subscribers_locale set schema hub;
  alter type public.enum_subscribers_status set schema hub;

  -- A table or type Payload added after this file was written would stay behind: stop instead.
  if exists (select from pg_tables where schemaname = 'public') then
    raise exception 'tables are left in public: %',
      (select string_agg(tablename, ', ') from pg_tables where schemaname = 'public');
  end if;
  if exists (select from pg_type t join pg_namespace n on n.oid = t.typnamespace
             where n.nspname = 'public' and t.typtype = 'e') then
    raise exception 'enum types are left in public';
  end if;
end $move$;

-- Expect: hub_tables 19, hub_enums 9, public_tables 0, rls_on 19.
select
  (select count(*) from pg_tables where schemaname = 'hub') as hub_tables,
  (select count(*) from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'hub' and t.typtype = 'e') as hub_enums,
  (select count(*) from pg_tables where schemaname = 'public') as public_tables,
  (select count(*) from pg_tables where schemaname = 'hub' and rowsecurity) as rls_on;
