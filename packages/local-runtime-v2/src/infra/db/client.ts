import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { FinalizingSqliteDatabase } from '@mavis/shared';
import { Database, type Changes } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

// bun:sqlite returns `Changes` from `run()`, but drizzle's bun driver types the
// result as `void`. Typing the runtime truth here keeps `run().changes` usable
// without a cast at every call site.
export type AppDb = BaseSQLiteDatabase<'sync', Changes>;
export type SqliteDatabase = Database;

const DB_FILE = 'runtime-state.sqlite';
const DB_RELATIVE_PATH = join('v2', 'sqlite', DB_FILE);

export interface DatabaseClientOptions {
  readonly dataDir: string;
}

export class DatabaseClient {
  private rawDb_: Database | null = null;
  private drizzleDb: AppDb | null = null;
  private readonly dbPath: string;
  private readonly options: DatabaseClientOptions;

  constructor(options: DatabaseClientOptions) {
    this.options = options;
    this.dbPath = join(options.dataDir, DB_RELATIVE_PATH);
  }

  get db(): AppDb {
    if (!this.drizzleDb) this.open();
    if (!this.drizzleDb) throw new Error('Database connection was not initialized');
    return this.drizzleDb;
  }

  /** Get the underlying bun:sqlite handle for raw SQL / migrations. */
  get rawDb(): Database {
    if (!this.rawDb_) this.open();
    const rawDb = this.rawDb_;
    if (!rawDb) throw new Error('Database connection was not initialized');
    return rawDb;
  }

  /** Copy the current connection into a new file through SQLite's VACUUM INTO. */
  async backup(destinationPath: string): Promise<void> {
    this.rawDb.prepare('VACUUM INTO ?').run(destinationPath);
  }

  /** Validate the backup through an independent read-only connection; only a single `ok` row passes. */
  hasValidIntegrity(databasePath: string): boolean {
    const verificationDb = new FinalizingSqliteDatabase(databasePath, {
      readonly: true,
      create: false,
    });
    try {
      const rows = verificationDb.prepare('PRAGMA integrity_check').all();
      return rows.length === 1 && isIntegrityOkRow(rows[0]);
    } finally {
      verificationDb.close();
    }
  }

  /** Close the connection and release resources. */
  close(): void {
    if (this.rawDb_) {
      this.rawDb_.close();
      this.rawDb_ = null;
      this.drizzleDb = null;
    }
  }

  private open(): Database {
    mkdirSync(dirname(this.dbPath), { recursive: true });
    const sqlite = new FinalizingSqliteDatabase(this.dbPath);
    try {
      // v1 and v2 temporarily access the same database through separate connections; keep PRAGMAs aligned.
      sqlite.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA busy_timeout = 5000;
        PRAGMA foreign_keys = ON;
      `);
      const drizzleDb = drizzle({ client: sqlite as never }) as unknown as AppDb;
      this.rawDb_ = sqlite;
      this.drizzleDb = drizzleDb;
      return sqlite;
    } catch (error) {
      try {
        sqlite.close();
      } catch {
        // Preserve the connection initialization error.
      }
      throw error;
    }
  }
}

function isIntegrityOkRow(row: unknown): boolean {
  return isObject(row) && row.integrity_check === 'ok';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
