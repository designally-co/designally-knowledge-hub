import * as migration_20260904_040641_newsletter_fields_and_subscribers from './20260904_040641_newsletter_fields_and_subscribers';

export const migrations = [
  {
    up: migration_20260904_040641_newsletter_fields_and_subscribers.up,
    down: migration_20260904_040641_newsletter_fields_and_subscribers.down,
    name: '20260904_040641_newsletter_fields_and_subscribers'
  },
];
