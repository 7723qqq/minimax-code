import { Database, type Statement } from 'bun:sqlite';

/**
 * Bun's native SQLite constructor. The runtime no longer loads a Node addon,
 * so there is no module-path override to resolve here.
 */
export type SqliteDatabaseConstructor = typeof Database;

export function loadSqliteDatabase(): SqliteDatabaseConstructor {
  return Database;
}

/**
 * A statement handle that owns one prepared statement for as long as it is
 * reachable, and finalizes it on `close()`.
 *
 * `bun:sqlite` finalizes statements from the public `prepare()` only through
 * the garbage collector. A closed database therefore keeps `runtime-state.sqlite`
 * and its `-wal`/`-shm` sidecars mapped on Windows until a collection runs, so
 * deleting or renaming the directory in the same tick intermittently fails with
 * `EBUSY`.
 *
 * Tracking statements through `WeakRef` cannot fix this: a statement the caller
 * has already dropped is unreachable, `deref()` returns `undefined`, and the
 * native handle stays open with no way left to finalize it. Recovery would then
 * depend on whenever the next collection happens, which is the flakiness this
 * class exists to remove.
 *
 * Holding the statements strongly is therefore required, not merely simpler.
 * The cost is bounded by `STATEMENT_CACHE_LIMIT`: a database keeps at most that
 * many statements alive, and evicting the least recently used one finalizes it.
 * Historical code prepared one statement per SQL string and released the
 * reference immediately, so this ceiling covers the same working set without
 * growing with the number of distinct statements a long session issues.
 *
 * Consequence for callers: do not hold a `prepare()` result long-term. Once
 * `STATEMENT_CACHE_LIMIT` newer statements push it out, eviction finalizes the
 * handle underneath the holder and the next call throws.
 */
const STATEMENT_CACHE_LIMIT = 256;

/**
 * A prepared statement that reports a missing row as `undefined`.
 *
 * `better-sqlite3` returned `undefined` from `get()`, Bun returns `null`. Reads
 * across the runtime are written against the `undefined` contract — `if (!row)`,
 * `row === undefined`, `typeof row?.field === 'number'` — so keeping it here is
 * what lets the driver change stay a driver change instead of a sweep over every
 * reader. `all()`, `values()`, and `iterate()` need no adaptation: they never
 * produce a missing row.
 */
class NormalizingStatement<Params extends unknown[] = unknown[], Row = unknown>
  implements Statement<Params, Row>
{
  constructor(private readonly statement: Statement<Params, Row>) {}

  all(...params: Params): Row[] {
    return this.statement.all(...params);
  }

  get(...params: Params): Row | undefined {
    // Bun's `get()` answers `null` only for a missing row; an existing row is
    // always an object, including one whose columns are all `NULL` (verified
    // against the runtime). Mapping `null` to `undefined` keeps the
    // better-sqlite3 contract while stepping the statement once, instead of
    // materializing every match the way an `all()`-based read would.
    const row = this.statement.get(...params) as Row | null | undefined;
    return row ?? undefined;
  }

  run(...params: Params): ReturnType<Statement<Params, Row>['run']> {
    return this.statement.run(...params);
  }

  values(...params: Params): unknown[][] {
    return this.statement.values(...params);
  }

  iterate(...params: Params): IterableIterator<Row> {
    return this.statement.iterate(...params);
  }

  finalize(): void {
    this.statement.finalize();
  }

  get isFinalized(): boolean {
    return this.statement.isFinalized;
  }

  get reader(): boolean {
    return this.statement.reader;
  }

  get readonly(): boolean {
    return this.statement.readonly;
  }

  get columnNames(): string[] {
    return this.statement.columnNames;
  }

  get native(): unknown {
    return this.statement.native;
  }
}

export class FinalizingSqliteDatabase extends Database {
  /** Insertion-ordered, so iteration starts at the least recently used entry. */
  readonly #statements = new Map<string, NormalizingStatement<never, unknown>>();

  override prepare<Params extends unknown[] = unknown[], Row = unknown>(
    sql: string,
  ): Statement<Params, Row> {
    // A repeated `prepare()` of the same SQL shares the cached handle, which
    // matches `BunDatabase`'s own behaviour and keeps the ceiling meaningful.
    const cached = this.#statements.get(sql) as
      | NormalizingStatement<Params, Row>
      | undefined;
    if (cached !== undefined && !cached.isFinalized) {
      // Re-inserting moves the entry to the most-recently-used end.
      this.#statements.delete(sql);
      this.#statements.set(sql, cached as NormalizingStatement<never, unknown>);
      return cached;
    }

    const statement = new NormalizingStatement(super.prepare<Params, Row>(sql));
    this.#statements.set(sql, statement as NormalizingStatement<never, unknown>);
    this.#evictOverflow();
    return statement;
  }

  override close(): void {
    // Finalize before closing so the native statement handles are released
    // while the connection can still apply their finalizers.
    for (const statement of this.#statements.values()) {
      if (!statement.isFinalized) statement.finalize();
    }
    this.#statements.clear();
    super.close();
  }

  #evictOverflow(): void {
    while (this.#statements.size > STATEMENT_CACHE_LIMIT) {
      const oldest = this.#statements.keys().next();
      if (oldest.done === true) return;
      const statement = this.#statements.get(oldest.value);
      this.#statements.delete(oldest.value);
      if (statement !== undefined && !statement.isFinalized) statement.finalize();
    }
  }
}
