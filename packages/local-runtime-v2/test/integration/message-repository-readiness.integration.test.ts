import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from 'bun:test';

import { DatabaseClient } from "../../src/infra/db/client.js";
import { initializeDatabase } from "../../src/infra/db/initialize.js";
import { messageRowMigrations } from "../../src/infra/db/schema/messages.js";
import { createMessageRepository } from "../../src/service/session-system/messages/repo/drizzle.js";

/**
 * `ensureReady` guards every read path with a migration-marker lookup. The
 * marker is written once per Session and is monotonic, so the repository
 * remembers positive answers instead of re-querying on each of the seven read
 * call sites. These tests pin both halves of that contract: the lookup is
 * skipped after the first read, and `deleteSessionData` — which drops the
 * marker row — forgets the cached answer.
 */

const cleanup: Array<() => Promise<void> | void> = [];
afterEach(async () => {
  for (const dispose of cleanup.splice(0).reverse()) await dispose();
});

async function setup() {
  const dataDir = await mkdtemp(join(tmpdir(), "message-repo-readiness-"));
  const client = new DatabaseClient({ dataDir });
  await initializeDatabase({ database: client, dataDir });
  cleanup.push(
    () => rm(dataDir, { recursive: true, force: true }),
    // Cleanup runs in reverse registration order; Windows cannot unlink an open DB.
    () => client.close(),
  );
  return { client };
}

/** Counts the marker lookups the repository issues through `db.select().get()`. */
function countMarkerLookups(client: DatabaseClient): () => number {
  const original = client.db.select.bind(client.db);
  let lookups = 0;
  // Drizzle's builder is fluent; intercept only the marker-table select and
  // count when it materialises, which is what `ensureReady` does.
  (client.db as unknown as { select: typeof original }).select = ((...args: unknown[]) => {
    const builder = (original as (...a: unknown[]) => unknown)(...args);
    const get = (builder as { get?: () => unknown }).get;
    const from = (builder as { from: (table: unknown) => unknown }).from;
    // `from` returns a new builder, so patch it once to observe the terminal call.
    (builder as { from: unknown }).from = (table: unknown) => {
      const next = (from as (t: unknown) => Record<string, unknown>).call(builder, table);
      if (table === messageRowMigrations) {
        const nextGet = next.get as (() => unknown) | undefined;
        if (nextGet) {
          next.get = () => {
            lookups += 1;
            return nextGet.call(next);
          };
        }
      }
      return next;
    };
    void get;
    return builder;
  }) as typeof original;
  return () => lookups;
}

describe("MessageRepository readiness marker", () => {
  it("reads the migration marker once per Session across repeated reads", async () => {
    const { client } = await setup();
    const repository = createMessageRepository({ db: client.db, nowMs: () => 1 });
    const lookups = countMarkerLookups(client);

    // First read establishes readiness for the Session.
    await repository.list("session-a");
    const afterFirst = lookups();
    expect(afterFirst).toBeGreaterThanOrEqual(1);

    // Further reads on the same Session must not re-run the lookup.
    await repository.list("session-a");
    await repository.list("session-a");
    expect(lookups()).toBe(afterFirst);

    // A different Session still pays exactly one lookup of its own.
    await repository.list("session-b");
    await repository.list("session-b");
    expect(lookups()).toBe(afterFirst + 1);
  });

  it("forgets a Session after its data is deleted", async () => {
    const { client } = await setup();
    const repository = createMessageRepository({ db: client.db, nowMs: () => 1 });
    const lookups = countMarkerLookups(client);

    await repository.list("session-c");
    const afterFirst = lookups();

    // `deleteSessionData` drops the marker row, so the cached answer is stale.
    await repository.deleteSessionData("session-c");
    expect(lookups()).toBe(afterFirst);

    await repository.list("session-c");
    expect(lookups()).toBe(afterFirst + 1);
  });
});
