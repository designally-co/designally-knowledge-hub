import * as migration_20260904_040641_newsletter_fields_and_subscribers from './20260904_040641_newsletter_fields_and_subscribers';
import * as migration_20260905_090000_subscriber_pending_status from './20260905_090000_subscriber_pending_status';
import * as migration_20260911_120000_media_prefix from './20260911_120000_media_prefix';
import * as migration_20260921_120000_subscriber_pending_default from './20260921_120000_subscriber_pending_default';
import * as migration_20260924_120000_resource_categories from './20260924_120000_resource_categories';

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
  {
    up: migration_20260911_120000_media_prefix.up,
    down: migration_20260911_120000_media_prefix.down,
    name: '20260911_120000_media_prefix'
  },
  {
    up: migration_20260921_120000_subscriber_pending_default.up,
    down: migration_20260921_120000_subscriber_pending_default.down,
    name: '20260921_120000_subscriber_pending_default'
  },
  {
    up: migration_20260924_120000_resource_categories.up,
    down: migration_20260924_120000_resource_categories.down,
    name: '20260924_120000_resource_categories'
  },
];
