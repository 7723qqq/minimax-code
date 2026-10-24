import type { DatabaseLike } from '@mavis/local-runtime';
import { drizzle } from 'drizzle-orm/bun-sqlite';

import type { AppDb } from '../../src/infra/db/client.js';
import { runMigrations } from '../../src/infra/db/migrate.js';
import { ALL_MIGRATIONS } from '../../src/infra/db/migrations.js';

export function migratePluginTestDatabase(database: DatabaseLike): AppDb {
  runMigrations(database as never, ALL_MIGRATIONS);
  return drizzle({ client: database as never }) as unknown as AppDb;
}
