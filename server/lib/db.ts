import type { Env } from "../env";
import { ApiError } from "./errors";

export const nowIso = () => new Date().toISOString();

/** Returns the D1 binding or fails closed with a customer-safe 503. */
export function requireDb(env: Env): D1Database {
  if (!env.DB) throw new ApiError(503, "storage_unavailable", "Penyimpanan pesanan belum aktif. Coba lagi nanti.");
  return env.DB;
}

/** Fixed-window rate limit stored in D1. Throws 429 when exceeded. */
export async function rateLimit(db: D1Database, bucket: string, limit: number, windowSec: number) {
  const windowStart = Math.floor(Date.now() / 1000 / windowSec) * windowSec;
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (bucket, window_start, count) VALUES (?, ?, 1)
       ON CONFLICT(bucket) DO UPDATE SET
         count = CASE WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.count + 1 ELSE 1 END,
         window_start = excluded.window_start
       RETURNING count`,
    )
    .bind(bucket, windowStart)
    .first<{ count: number }>();
  if ((row?.count ?? 0) > limit) {
    throw new ApiError(429, "rate_limited", "Terlalu banyak permintaan. Coba lagi beberapa menit lagi.", {
      retry_after: windowStart + windowSec - Math.floor(Date.now() / 1000),
    });
  }
}

export async function audit(
  db: D1Database,
  entry: { actor: string; action: string; target?: string; outcome: string; correlationId?: string },
) {
  await db
    .prepare("INSERT INTO audit_events (id, actor, action, target, outcome, correlation_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), entry.actor, entry.action, entry.target ?? null, entry.outcome, entry.correlationId ?? null, nowIso())
    .run();
}
