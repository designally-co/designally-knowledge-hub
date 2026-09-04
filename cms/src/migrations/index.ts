import * as migration_20260904_040641_newsletter_fields_and_subscribers from './20260904_040641_newsletter_fields_and_subscribers';
import * as migration_20260905_090000_subscriber_pending_status from './20260905_090000_subscriber_pending_status';

export const migrations = [
  {
    up: migration_20260904_040641_newsletter_fields_and_subscribers.up,
    down: migration_20260904_040641_newsletter_fields_and_subscribers.down,
    name: '20260904_040641_newsletter_fields_and_subscribers'
  },
  {
    up: migration_20260905_090000_subscriber_pending_status.up,
    down: migration_20260905_090000_subscriber_pending_status.down,
    name: '20260905_090000_subscriber_pending_status'
  },
];
