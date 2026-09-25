#!/usr/bin/env python3
"""
Turn an app's DATABASE_URL into the one the backup job needs, and print it for
`gh secret set`. See docs/backups.md.

    python3 .github/scripts/backup-db-url.py hub cms/.env.production.local \
      | gh secret set HUB_BACKUP_DATABASE_URL

What it changes:
- hub (Supabase): transaction pooler :6543 → session pooler :5432. pg_dump's
  session SETs would otherwise leak onto the live Hub's next connection.
- survey (Neon): the `-pooler` endpoint → the direct one, for the same reason.
- both: the password is percent-encoded. A raw `@` or `!` in it is fine for
  the apps' drivers but breaks libpq, which pg_dump uses.

It refuses to print to a terminal, so the password never lands on screen.
"""
import sys
import urllib.parse as up

KEYS = ('DATABASE_URI', 'DATABASE_URL')


def read_url(path):
    with open(path) as f:
        for line in f:
            key, _, value = line.strip().partition('=')
            if key in KEYS and value:
                return value.strip().strip('"').strip("'")
    sys.exit(f'no {" or ".join(KEYS)} in {path}')


def backup_url(db, url):
    scheme, _, rest = url.partition('://')
    # The LAST @ ends the credentials: the password itself may contain one.
    creds, _, hostpart = rest.rpartition('@')
    user, _, password = creds.partition(':')
    password = up.quote(up.unquote(password), safe='')

    if db == 'hub':
        if 'pooler.supabase.com' not in hostpart:
            sys.exit('hub: expected a Supabase pooler address')
        hostpart = hostpart.replace(':6543/', ':5432/')
    elif db == 'survey':
        host, sep, tail = hostpart.partition('/')
        hostpart = host.replace('-pooler.', '.', 1) + sep + tail
    else:
        sys.exit(f'unknown database {db!r} (hub, survey)')

    if 'sslmode=' not in hostpart:
        hostpart += ('&' if '?' in hostpart else '?') + 'sslmode=require'
    return f'{scheme}://{user}:{password}@{hostpart}'


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    if sys.stdout.isatty():
        sys.exit('pipe this into `gh secret set …`; it will not print a password to the screen')
    print(backup_url(sys.argv[1], read_url(sys.argv[2])))
