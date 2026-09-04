import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Adds `pending` to the subscriber status enum, for double opt-in.
 *
 * ONE VALUE ON ONE TYPE. Nothing is dropped, nothing is rewritten, and no
 * existing row changes: every current subscriber stays exactly as they are, and
 * in particular NOBODY ALREADY ON THE LIST IS ASKED TO CONFIRM AGAIN. Turning a
 * confirmed list back into requests would silently stop mail to people who did
 * agree, which is a worse failure than the one double opt-in prevents.
 *
 * `ADD VALUE IF NOT EXISTS` is idempotent, so re-running is harmless. Postgres
 * permits it inside a transaction from version 12 onward provided the new value
 * is not USED in the same transaction — this migration only defines it, and the
 * first row to hold it is written by a later request.
 *
 * ORDER MATTERS: this runs BEFORE the code that writes `pending` is deployed.
 * The reverse is what took the site down on 4 September — a field the config
 * knew about and the database did not.
 *
 * NO `down` THAT DROPS THE VALUE, because Postgres cannot remove an enum value:
 * undoing it means recreating the type and rewriting the column, which would
 * have to decide what to do with rows holding `pending` — and the answer is not
 * something a rollback should guess. Reverting the code is enough; an unused
 * value costs nothing.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_subscribers_status" ADD VALUE IF NOT EXISTS 'pending';
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  /* Deliberately empty — see the note above. */
}
