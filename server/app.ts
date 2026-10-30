import { Hono, type Context } from "hono";
import type { Env } from "./env";
import { ApiError } from "./lib/errors";
import { audit, nowIso, rateLimit, requireDb } from "./lib/db";
import {
  authConfigured,
  bearerToken,
  clerkProfileLookup,
  clerkSessionVerifier,
  resolveCustomer,
  type Customer,
  type ProfileLookup,
  type SessionVerifier,
} from "./lib/auth";
import { canonicalJson, newId, publicRef, sha256Hex } from "./lib/crypto";
import { parseQuoteRequest, TERMS_VERSION, toOsPayload } from "./lib/quote";
import { connectorConfigured, fetchOsStatus, submitToOs } from "./lib/connector";
import { services } from "../src/lib/content";
import { handleDuitkuCallback } from "./payments/service";
import { paymentsEnabled } from "./payments/duitku";

export interface AppDeps {
  verifier?: SessionVerifier;
  lookup?: ProfileLookup;
  fetchImpl?: typeof fetch;
}

type AppEnv = { Bindings: Env; Variables: { customer: Customer; correlationId: string } };

const MAX_BODY = 32 * 1024;
const IDEMPOTENCY = /^[A-Za-z0-9_-]{16,128}$/;
const OS_RETRY_MAX = 5;
const OS_RETRY_INTERVAL_MS = 60_000;

/** Customer-facing labels (docs/embrilo-blueprint-v1/29). Internal states are never exposed. */
const QUOTE_STATUS_LABEL: Record<string, string> = {
  received: "Brief diterima",
  in_review: "Sedang ditinjau",
  quoted: "Penawaran dikirim",
  accepted: "Penawaran disetujui",
  declined: "Penawaran ditolak",
  cancelled: "Dibatalkan",
};
const OS_STATUS_LABEL: Record<string, string> = {
  received: "Brief diterima",
  needs_info: "Perlu informasi",
  in_progress: "Sedang dikerjakan",
  delivered: "Hasil dikirim",
  cancelled: "Dibatalkan",
};

async function readJson(c: Context<AppEnv>) {
  const type = c.req.header("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) throw new ApiError(415, "unsupported_media_type", "Gunakan application/json.");
  const text = await c.req.text();
  if (text.length > MAX_BODY) throw new ApiError(413, "payload_too_large", "Isian terlalu panjang.");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, "invalid_json", "Format permintaan tidak valid.");
  }
}

export function createApp(deps: AppDeps = {}) {
  const verifier = deps.verifier ?? clerkSessionVerifier;
  const lookup = deps.lookup ?? clerkProfileLookup;
  const fetchImpl = deps.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const app = new Hono<AppEnv>().basePath("/api");

  app.use("*", async (c, next) => {
    c.set("correlationId", crypto.randomUUID());
    await next();
    c.header("Cache-Control", "no-store");
    c.header("X-Correlation-Id", c.get("correlationId"));
  });

  app.onError((error, c) => {
    const correlationId = c.get("correlationId");
    if (error instanceof ApiError) {
      if (error.status === 429 && typeof (error.details as { retry_after?: number })?.retry_after === "number") {
        c.header("Retry-After", String((error.details as { retry_after: number }).retry_after));
      }
      return c.json({ error: { code: error.code, message: error.message, details: error.details, correlation_id: correlationId } }, error.status);
    }
    console.error(JSON.stringify({ level: "error", correlationId, name: error.name })); // no payloads, no secrets
    return c.json({ error: { code: "internal_error", message: "Terjadi kesalahan. Coba lagi.", correlation_id: correlationId } }, 500);
  });

  app.notFound((c) => c.json({ error: { code: "not_found", message: "Tidak ditemukan.", correlation_id: c.get("correlationId") } }, 404));

  // ---------- public ----------
  app.get("/v1/health", (c) =>
    c.json({
      ok: true,
      auth: authConfigured(c.env),
      storage: Boolean(c.env.DB),
      connector: connectorConfigured(c.env),
      payments: paymentsEnabled(c.env),
    }),
  );

  /** Non-secret runtime config for the browser. The Clerk publishable key is public by design. */
  app.get("/v1/config", (c) =>
    c.json({
      clerk_publishable_key: authConfigured(c.env) ? c.env.CLERK_PUBLISHABLE_KEY : null,
      clerk_proxy_url: c.env.CLERK_PUBLISHABLE_KEY?.startsWith("pk_live_") && c.env.PUBLIC_BASE_URL ? `${c.env.PUBLIC_BASE_URL}/__clerk` : null,
      canonical_origin: c.env.PUBLIC_BASE_URL ?? null,
      terms_version: TERMS_VERSION,
      intake_enabled: authConfigured(c.env) && Boolean(c.env.DB),
      payments_enabled: paymentsEnabled(c.env),
    }),
  );

  app.get("/v1/catalog", (c) =>
    c.json({
      services: services.map((s) => ({
        code: s.code,
        title: s.title,
        summary: s.summary,
        for_who: s.forWho,
        deliverables: s.deliverables,
        excludes: s.excludes,
        inputs: s.inputs,
        proposed_scope: s.proposedScope,
        revision_rounds: s.revisionRounds,
        pricing: s.pricing,
        offer_version: s.offerVersion,
      })),
    }),
  );

  app.post("/v1/payment-callbacks/duitku", async (c) => {
    const db = requireDb(c.env);
    const text = await c.req.text();
    if (text.length > MAX_BODY) throw new ApiError(413, "payload_too_large", "Payload too large");
    const result = await handleDuitkuCallback(db, c.env, new URLSearchParams(text), fetchImpl);
    return c.json({ outcome: result.outcome }, result.httpStatus);
  });

  // ---------- authenticated ----------
  const requireCustomer = async (c: Context<AppEnv>, next: () => Promise<void>) => {
    if (!authConfigured(c.env)) throw new ApiError(503, "auth_not_configured", "Login belum aktif.");
    const token = bearerToken(c.req.header("authorization"));
    if (!token) throw new ApiError(401, "unauthenticated", "Silakan masuk terlebih dahulu.");
    const identity = await verifier(token, c.env);
    if (!identity) throw new ApiError(401, "unauthenticated", "Sesi tidak valid atau kedaluwarsa. Silakan masuk kembali.");
    const customer = await resolveCustomer(requireDb(c.env), c.env, identity, lookup);
    if (customer.status !== "active") throw new ApiError(403, "account_disabled", "Akun ini tidak aktif.");
    c.set("customer", customer);
    await next();
  };

  app.use("/v1/me", requireCustomer);
  app.use("/v1/quote-requests", requireCustomer);
  app.use("/v1/quote-requests/*", requireCustomer);

  app.get("/v1/me", (c) => {
    const customer = c.get("customer");
    return c.json({ email: customer.email, email_verified: customer.emailVerified });
  });

  app.post("/v1/quote-requests", async (c) => {
    const db = requireDb(c.env);
    const customer = c.get("customer");
    if (!customer.emailVerified) throw new ApiError(403, "email_not_verified", "Verifikasi email terlebih dahulu sebelum mengirim brief.");

    const idempotencyKey = c.req.header("idempotency-key") ?? "";
    if (!IDEMPOTENCY.test(idempotencyKey)) throw new ApiError(400, "idempotency_key_required", "Header Idempotency-Key wajib diisi.");

    await rateLimit(db, `quote:${customer.id}`, 5, 3600);
    const quote = parseQuoteRequest(await readJson(c));
    const requestHash = await sha256Hex(canonicalJson({ brief: quote.brief, terms: TERMS_VERSION }));

    const existing = await db
      .prepare("SELECT public_ref, status, request_hash, os_sync_status FROM quote_requests WHERE customer_id = ? AND idempotency_key = ?")
      .bind(customer.id, idempotencyKey)
      .first<{ public_ref: string; status: string; request_hash: string; os_sync_status: string }>();
    if (existing) {
      if (existing.request_hash !== requestHash) throw new ApiError(409, "idempotency_conflict", "Permintaan dengan kunci yang sama sudah dipakai untuk isi berbeda.");
      return c.json({ public_ref: existing.public_ref, status: existing.status, os_sync: existing.os_sync_status, idempotent_replay: true }, 200);
    }

    const now = nowIso();
    const id = newId("qr");
    const ref = publicRef("EMB");
    const osSync = connectorConfigured(c.env) ? "pending" : "not_configured";
    const inserted = await db
      .prepare(
        `INSERT INTO quote_requests (id, public_ref, customer_id, service_code, offer_version, offer_snapshot, brief,
           terms_version, idempotency_key, request_hash, os_sync_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(customer_id, idempotency_key) DO NOTHING
         RETURNING public_ref`,
      )
      .bind(id, ref, customer.id, quote.offer.code, quote.offer.offerVersion, JSON.stringify(quote.offer), JSON.stringify(quote.brief),
        TERMS_VERSION, idempotencyKey, requestHash, osSync, now, now)
      .first<{ public_ref: string }>();

    if (!inserted) {
      // Lost a concurrent race with the same key: return the winner.
      const winner = await db
        .prepare("SELECT public_ref, status, request_hash, os_sync_status FROM quote_requests WHERE customer_id = ? AND idempotency_key = ?")
        .bind(customer.id, idempotencyKey)
        .first<{ public_ref: string; status: string; request_hash: string; os_sync_status: string }>();
      if (!winner || winner.request_hash !== requestHash) throw new ApiError(409, "idempotency_conflict", "Permintaan dengan kunci yang sama sudah dipakai untuk isi berbeda.");
      return c.json({ public_ref: winner.public_ref, status: winner.status, os_sync: winner.os_sync_status, idempotent_replay: true }, 200);
    }

    await audit(db, { actor: `customer:${customer.id}`, action: "quote_request.create", target: ref, outcome: "ok", correlationId: c.get("correlationId") });
    const sync = osSync === "pending" ? await syncQuoteToOs(db, c.env, id, fetchImpl) : "not_configured";
    return c.json({ public_ref: ref, status: "received", os_sync: sync, idempotent_replay: false }, 201);
  });

  app.get("/v1/quote-requests", async (c) => {
    const db = requireDb(c.env);
    const rows = await db
      .prepare(
        `SELECT public_ref, service_code, offer_snapshot, status, os_sync_status, created_at, updated_at
         FROM quote_requests WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50`,
      )
      .bind(c.get("customer").id)
      .all<{ public_ref: string; service_code: string; offer_snapshot: string; status: string; os_sync_status: string; created_at: string; updated_at: string }>();
    return c.json({
      items: (rows.results ?? []).map((row) => ({
        public_ref: row.public_ref,
        service_title: (JSON.parse(row.offer_snapshot) as { title: string }).title,
        status: row.status,
        status_label: QUOTE_STATUS_LABEL[row.status] ?? "Diproses",
        os_sync: row.os_sync_status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
    });
  });

  app.get("/v1/quote-requests/:ref", async (c) => {
    const db = requireDb(c.env);
    const ref = c.req.param("ref");
    if (!/^EMB-[A-Z0-9]{8}$/.test(ref)) throw new ApiError(404, "not_found", "Tidak ditemukan.");
    // Ownership is enforced in the query: another customer's ref is indistinguishable from a missing one.
    const row = await db
      .prepare(
        `SELECT id, public_ref, offer_snapshot, brief, status, os_sync_status, os_public_ref, os_customer_token, os_attempts,
                os_last_attempt_at, created_at, updated_at
         FROM quote_requests WHERE public_ref = ? AND customer_id = ?`,
      )
      .bind(ref, c.get("customer").id)
      .first<{
        id: string; public_ref: string; offer_snapshot: string; brief: string; status: string; os_sync_status: string;
        os_public_ref: string | null; os_customer_token: string | null; os_attempts: number; os_last_attempt_at: string | null;
        created_at: string; updated_at: string;
      }>();
    if (!row) throw new ApiError(404, "not_found", "Tidak ditemukan.");

    let osSync = row.os_sync_status;
    const due = !row.os_last_attempt_at || Date.now() - Date.parse(row.os_last_attempt_at) > OS_RETRY_INTERVAL_MS;
    if (osSync !== "synced" && row.os_attempts < OS_RETRY_MAX && due && connectorConfigured(c.env)) {
      osSync = await syncQuoteToOs(db, c.env, row.id, fetchImpl);
    }

    let production: { status: string; label: string; message?: string } | null = null;
    if (osSync === "synced" && row.os_public_ref && row.os_customer_token) {
      const status = await fetchOsStatus(c.env, c.get("customer").id, row.os_public_ref, row.os_customer_token, fetchImpl);
      if (status) production = { status: status.status, label: OS_STATUS_LABEL[status.status] ?? "Diproses", message: status.message };
    }

    const offer = JSON.parse(row.offer_snapshot) as { title: string; proposedScope: string; pricing: { mode: string }; revisionRounds: number };
    const brief = JSON.parse(row.brief) as Record<string, unknown>;
    return c.json({
      public_ref: row.public_ref,
      service: { title: offer.title, proposed_scope: offer.proposedScope, pricing_mode: offer.pricing.mode, revision_rounds: offer.revisionRounds },
      brief: {
        brand: brief.brand, product: brief.product, audience: brief.audience, objective: brief.objective,
        platforms: brief.platforms, tone: brief.tone, cta: brief.cta,
      },
      status: row.status,
      status_label: QUOTE_STATUS_LABEL[row.status] ?? "Diproses",
      os_sync: osSync,
      production,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  });

  return app;
}

/** Sends a persisted quote request to Embrilo OS. Idempotent: reuses the request id as Idempotency-Key. */
export async function syncQuoteToOs(db: D1Database, env: Env, quoteId: string, fetchImpl: typeof fetch): Promise<string> {
  const row = await db
    .prepare("SELECT id, customer_id, offer_snapshot, brief, created_at, os_sync_status FROM quote_requests WHERE id = ?")
    .bind(quoteId)
    .first<{ id: string; customer_id: string; offer_snapshot: string; brief: string; created_at: string; os_sync_status: string }>();
  if (!row) return "failed";
  if (row.os_sync_status === "synced") return "synced";

  await db
    .prepare("UPDATE quote_requests SET os_attempts = os_attempts + 1, os_last_attempt_at = ?, updated_at = ? WHERE id = ?")
    .bind(nowIso(), nowIso(), row.id)
    .run();
  const payload = toOsPayload(row.customer_id, { brief: JSON.parse(row.brief), offer: JSON.parse(row.offer_snapshot) }, row.created_at);
  const result = await submitToOs(env, payload, row.customer_id, `pub-${row.id}`.slice(0, 128), fetchImpl);
  if (result.ok) {
    await db
      .prepare(
        `UPDATE quote_requests SET os_sync_status = 'synced', os_public_ref = ?, os_customer_token = ?,
           status = CASE WHEN status = 'received' THEN 'in_review' ELSE status END, updated_at = ?
         WHERE id = ? AND os_sync_status != 'synced'`,
      )
      .bind(result.publicRef, result.customerToken, nowIso(), row.id)
      .run();
    return "synced";
  }
  await db.prepare("UPDATE quote_requests SET os_sync_status = 'failed', updated_at = ? WHERE id = ? AND os_sync_status != 'synced'").bind(nowIso(), row.id).run();
  return "failed";
}
