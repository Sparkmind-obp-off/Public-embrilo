import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

/** Minimal D1Database implementation over node:sqlite for tests (same SQLite dialect as D1). */
export function createTestDb() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../../migrations/0001_public_core.sql", import.meta.url), "utf8"));

  const statement = (sql: string, params: unknown[] = []) => ({
    bind: (...values: unknown[]) => statement(sql, values),
    first: async <T>() => (sqlite.prepare(sql).get(...(params as never[])) as T | undefined) ?? null,
    all: async <T>() => ({ results: sqlite.prepare(sql).all(...(params as never[])) as T[], success: true, meta: {} }),
    run: async () => {
      const info = /\bRETURNING\b/i.test(sql) ? (sqlite.prepare(sql).all(...(params as never[])), { changes: 1 }) : sqlite.prepare(sql).run(...(params as never[]));
      return { success: true, meta: { changes: Number(info.changes) } };
    },
    _exec: () => sqlite.prepare(sql).run(...(params as never[])),
  });

  const db = {
    prepare: (sql: string) => statement(sql),
    batch: async (statements: Array<ReturnType<typeof statement>>) => {
      sqlite.exec("BEGIN");
      try {
        const out = statements.map((s) => (s._exec(), { success: true, meta: {} }));
        sqlite.exec("COMMIT");
        return out;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    exec: async (sql: string) => sqlite.exec(sql),
  };
  return { db: db as unknown as D1Database, sqlite };
}
