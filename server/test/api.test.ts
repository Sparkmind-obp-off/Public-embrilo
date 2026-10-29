// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";
import type { Env } from "../env";
import { createTestDb } from "./d1-shim";
import { TERMS_VERSION } from "../lib/quote";
import { hmacHex } from "../lib/crypto";
import { osCanonicalString, signOsRequest } from "../lib/connector";
import { sha256Hex } from "../lib/crypto";

const TOKENS: Record<string, string> = {
  "token-alice-aaaaaaaaaaaaaaaaaaaa": "user_aliceAAAAAAAAAAAA",
  "token-bob-bbbbbbbbbbbbbbbbbbbbbb": "user_bobBBBBBBBBBBBBBB",
  "token-carol-unverified-cccccccc": "user_carolCCCCCCCCCCCC",
};
const PROFILES: Record<string, { email: string; emailVerified: boolean }> = {
  user_aliceAAAAAAAAAAAA: { email: "alice@example.com", emailVerified: true },
  user_bobBBBBBBBBBBBBBB: { email: "bob@example.com", emailVerified: true },
  user_carolCCCCCCCCCCCC: { email: "carol@example.com", emailVerified: false },
};

const validBrief = {
  service: "script-pack",
  brand: "Kopi Senja",
  product: "Kopi susu literan, dibuat batch kecil setiap pagi untuk stok di rumah.",
  verifiedFacts: "",
  audience: "Pekerja muda yang sering lembur",
  objective: "Edukasi tentang produk",
  platforms: ["TikTok"],
  tone: "Profesional",
  cta: "",
  constraints: "",
  rightsConfirmed: true,
  aiAcknowledged: true,
};

const MERCHANT = "DTEST1";
const API_KEY = "test-api-key-0123456789abcdef0123";

let env: Env;
let providerFetch: ReturnType<typeof vi.fn>;
let app: ReturnType<typeof createApp>;
let db: D1Database;

beforeEach(() => {
  db = createTestDb().db;
  env = {
    DB: db,
    CLERK_SECRET_KEY: "sk_test_x",
    CLERK_PUBLISHABLE_KEY: "pk_test_x",
    CLERK_AUTHORIZED_PARTIES: "https://embrilo-public.pages.dev",
    DUITKU_ENV: "production",
    DUITKU_MERCHANT_CODE: MERCHANT,
    DUITKU_API_KEY: API_KEY,
    PAYMENTS_ENABLED: "false",
  };
  providerFetch = vi.fn();
  app = createApp({
    verifier: async (token) => (TOKENS[token] ? { clerkUserId: TOKENS[token] } : null),
    lookup: async (id) => PROFILES[id] ?? null,
    fetchImpl: providerFetch as unknown as typeof fetch,
  });
});

const call = (path: string, init: RequestInit & { token?: string; idem?: string } = {}) => {
  const headers = new Headers(init.headers);
  if (init.token) headers.set("Authorization", `Bearer ${init.token}`);
  if (init.idem) headers.set("Idempotency-Key", init.idem);
  if (init.body && !headers.has("content-type")) headers.set("Content-Type", "application/json");
  return app.request(`/api${path}`, { ...init, headers }, env);
};
const submit = (token: string, idem: string, brief: unknown = validBrief, extra: Record<string, unknown> = {}) =>
  call("/v1/quote-requests", { method: "POST", token, idem, body: JSON.stringify({ brief, terms_version: TERMS_VERSION, ...extra }) });

const ALICE = "token-alice-aaaaaaaaaaaaaaaaaaaa";
const BOB = "token-bob-bbbbbbbbbbbbbbbbbbbbbb";
const CAROL = "token-carol-unverified-cccccccc";

describe("public config", () => {
  it("exposes only non-secret configuration", async () => {
    const res = await call("/v1/config");
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).toContain("pk_test_x");
    expect(text).not.toContain("sk_test_x");
    expect(text).not.toContain(API_KEY);
    expect(JSON.parse(text)).toMatchObject({ intake_enabled: true, payments_enabled: false });
  });

  it("disables intake when storage is not bound", async () => {
    const res = await app.request("/api/v1/config", {}, { ...env, DB: undefined });
    expect(await res.json()).toMatchObject({ intake_enabled: false });
  });

  it("catalog never publishes unapproved prices", async () => {
    const res = await call("/v1/catalog");
    const json = (await res.json()) as { services: Array<{ pricing: { mode: string } }> };
    expect(json.services).toHaveLength(3);
    expect(json.services.every((s) => s.pricing.mode === "quote")).toBe(true);
  });
});

describe("authentication (fails closed)", () => {
  it("rejects missing, malformed and invalid tokens", async () => {
    expect((await call("/v1/me")).status).toBe(401);
    expect((await call("/v1/me", { headers: { Authorization: "Basic abc" } })).status).toBe(401);
    expect((await call("/v1/me", { token: "token-forged-zzzzzzzzzzzzzzzzzz" })).status).toBe(401);
  });

  it("returns 503 when auth is not configured", async () => {
    const res = await app.request("/api/v1/me", { headers: { Authorization: `Bearer ${ALICE}` } }, { ...env, CLERK_AUTHORIZED_PARTIES: "" });
    expect(res.status).toBe(503);
  });

  it("maps a verified subject to one stable customer across logins", async () => {
    await call("/v1/me", { token: ALICE });
    await call("/v1/me", { token: ALICE });
    const count = await db.prepare("SELECT COUNT(*) AS n FROM customers WHERE clerk_user_id = ?").bind("user_aliceAAAAAAAAAAAA").first<{ n: number }>();
    expect(count?.n).toBe(1);
    expect(await (await call("/v1/me", { token: ALICE })).json()).toEqual({ email: "alice@example.com", email_verified: true });
  });
});

describe("quote requests", () => {
  it("persists a validated brief with an offer snapshot", async () => {
    const res = await submit(ALICE, "idem-key-alice-0000001");
    expect(res.status).toBe(201);
    const json = (await res.json()) as { public_ref: string; os_sync: string };
    expect(json.public_ref).toMatch(/^EMB-[A-Z0-9]{8}$/);
    expect(json.os_sync).toBe("not_configured");
    const row = await db.prepare("SELECT offer_snapshot, terms_version FROM quote_requests WHERE public_ref = ?").bind(json.public_ref).first<{ offer_snapshot: string; terms_version: string }>();
    expect(JSON.parse(row!.offer_snapshot)).toMatchObject({ code: "script-pack", osServiceCode: "SCRIPT_PACK", pricing: { mode: "quote" } });
    expect(row!.terms_version).toBe(TERMS_VERSION);
  });

  it("replays the same idempotency key without creating a duplicate", async () => {
    const first = (await (await submit(ALICE, "idem-key-alice-0000002")).json()) as { public_ref: string };
    const second = await submit(ALICE, "idem-key-alice-0000002");
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ public_ref: first.public_ref, idempotent_replay: true });
    const count = await db.prepare("SELECT COUNT(*) AS n FROM quote_requests").first<{ n: number }>();
    expect(count?.n).toBe(1);
  });

  it("rejects the same key reused for a different body", async () => {
    await submit(ALICE, "idem-key-alice-0000003");
    const res = await submit(ALICE, "idem-key-alice-0000003", { ...validBrief, brand: "Brand Lain" });
    expect(res.status).toBe(409);
  });

  it("requires a verified email", async () => {
    expect((await submit(CAROL, "idem-key-carol-0000001")).status).toBe(403);
  });

  it("rejects unknown fields, including injected prices", async () => {
    expect((await submit(ALICE, "idem-key-alice-0000004", validBrief, { amount: 1 })).status).toBe(422);
    expect((await submit(ALICE, "idem-key-alice-0000005", { ...validBrief, price: 1 })).status).toBe(422);
  });

  it("validates server-side regardless of the browser", async () => {
    const res = await submit(ALICE, "idem-key-alice-0000006", { ...validBrief, product: "pendek", platforms: ["MySpace"] });
    expect(res.status).toBe(422);
    const json = (await res.json()) as { error: { details: Array<{ field: string }> } };
    expect(json.error.details.map((d) => d.field).sort()).toEqual(["platforms", "product"]);
  });

  it("blocks secrets pasted into the brief", async () => {
    expect((await submit(ALICE, "idem-key-alice-0000007", { ...validBrief, constraints: "password: rahasia123" })).status).toBe(422);
  });

  it("requires an idempotency key and JSON content type", async () => {
    expect((await call("/v1/quote-requests", { method: "POST", token: ALICE, body: JSON.stringify({ brief: validBrief, terms_version: TERMS_VERSION }) })).status).toBe(400);
    expect((await call("/v1/quote-requests", { method: "POST", token: ALICE, idem: "idem-key-alice-0000008", headers: { "Content-Type": "text/plain" }, body: "x" })).status).toBe(415);
  });

  it("rate-limits submissions per customer", async () => {
    for (let i = 0; i < 5; i++) expect((await submit(ALICE, `idem-key-alice-rl-${i}0000`)).status).toBe(201);
    const limited = await submit(ALICE, "idem-key-alice-rl-50000");
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBeTruthy();
  });

  it("isolates customers: B cannot list or read A's request", async () => {
    const { public_ref } = (await (await submit(ALICE, "idem-key-alice-0000009")).json()) as { public_ref: string };
    expect((await call(`/v1/quote-requests/${public_ref}`, { token: ALICE })).status).toBe(200);
    const asBob = await call(`/v1/quote-requests/${public_ref}`, { token: BOB });
    expect(asBob.status).toBe(404);
    const bobList = (await (await call("/v1/quote-requests", { token: BOB })).json()) as { items: unknown[] };
    expect(bobList.items).toHaveLength(0);
    expect((await call(`/v1/quote-requests/${public_ref}`)).status).toBe(401);
  });

  it("never exposes internal tokens in the detail response", async () => {
    const { public_ref } = (await (await submit(ALICE, "idem-key-alice-0000010")).json()) as { public_ref: string };
    await db.prepare("UPDATE quote_requests SET os_customer_token = 'secret-os-token' WHERE public_ref = ?").bind(public_ref).run();
    const text = await (await call(`/v1/quote-requests/${public_ref}`, { token: ALICE })).text();
    expect(text).not.toContain("secret-os-token");
    expect(text).not.toContain("cus_");
  });
});

describe("OS connector", () => {
  const osEnv = () => ({ ...env, OS_CONNECTOR_URL: "https://os.example.test", CONNECTOR_HMAC_SECRET: "s".repeat(40), CONNECTOR_KEY_ID: "public-embrilo-v1" });

  it("signs requests with the v1 canonical string (body hash, idempotency, customer ref)", async () => {
    const body = JSON.stringify({ a: 1 });
    const headers = await signOsRequest("k".repeat(40), "public-embrilo-v1", {
      method: "POST", pathWithQuery: "/v1/public/requests", body, customerRef: "cus_1", idempotencyKey: "idem-1234567890abcd", timestamp: 1_800_000_000, nonce: "nonce1234567890ab",
    });
    const canonical = osCanonicalString({
      method: "POST", pathWithQuery: "/v1/public/requests", timestamp: "1800000000", nonce: "nonce1234567890ab",
      customerRef: "cus_1", idempotencyKey: "idem-1234567890abcd", bodySha256: await sha256Hex(body),
    });
    expect(canonical.split("\n").slice(0, 3)).toEqual(["EMBRILO-HMAC-V1", "embrilo-os/v1", "POST"]);
    expect(headers["X-Embrilo-Signature"]).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(headers["Idempotency-Key"]).toBe("idem-1234567890abcd");
  });

  it("syncs once and stores the OS capability token server-side", async () => {
    providerFetch.mockResolvedValue(new Response(JSON.stringify({ public_ref: "OS-REF-1", status: "received", customer_token: "os-cap-token" }), { status: 201 }));
    const res = await app.request("/api/v1/quote-requests", {
      method: "POST",
      headers: { Authorization: `Bearer ${ALICE}`, "Idempotency-Key": "idem-key-alice-os-0001", "Content-Type": "application/json" },
      body: JSON.stringify({ brief: validBrief, terms_version: TERMS_VERSION }),
    }, osEnv());
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ os_sync: "synced" });
    expect(providerFetch).toHaveBeenCalledTimes(1);
    const [url, init] = providerFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://os.example.test/v1/public/requests");
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toMatch(/^pub-qr_/);
    const row = await db.prepare("SELECT os_sync_status, os_customer_token FROM quote_requests").first<{ os_sync_status: string; os_customer_token: string }>();
    expect(row).toEqual({ os_sync_status: "synced", os_customer_token: "os-cap-token" });
  });

  it("keeps the order when OS is down and marks it for retry", async () => {
    providerFetch.mockResolvedValue(new Response("down", { status: 503 }));
    const res = await app.request("/api/v1/quote-requests", {
      method: "POST",
      headers: { Authorization: `Bearer ${ALICE}`, "Idempotency-Key": "idem-key-alice-os-0002", "Content-Type": "application/json" },
      body: JSON.stringify({ brief: validBrief, terms_version: TERMS_VERSION }),
    }, osEnv());
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ os_sync: "failed" });
    const count = await db.prepare("SELECT COUNT(*) AS n FROM quote_requests WHERE os_sync_status = 'failed'").first<{ n: number }>();
    expect(count?.n).toBe(1);
  });
});

describe("Duitku callback", () => {
  async function seedAttempt(amount = 150000, merchantOrderId = "EMBPAY-0001") {
    const now = new Date().toISOString();
    await db.prepare("INSERT INTO customers (id, clerk_user_id, email, email_verified, created_at, updated_at) VALUES ('cus_t', 'user_t', 't@example.com', 1, ?, ?)").bind(now, now).run();
    await db.prepare("INSERT INTO orders (id, public_ref, customer_id, description, amount, currency, created_at, updated_at) VALUES ('ord_1', 'EMB-ORDER001', 'cus_t', 'Tes', ?, 'IDR', ?, ?)").bind(amount, now, now).run();
    await db.prepare("INSERT INTO payment_attempts (id, order_id, provider, environment, merchant_order_id, amount, currency, status, created_at, updated_at) VALUES ('pa_1', 'ord_1', 'duitku', 'production', ?, ?, 'IDR', 'created', ?, ?)").bind(merchantOrderId, amount, now, now).run();
  }

  const callback = async (fields: Record<string, string>, sign = true) => {
    const form = new URLSearchParams(fields);
    if (sign) form.set("signature", await hmacHex(API_KEY, MERCHANT + fields.amount + fields.merchantOrderId));
    return app.request("/api/v1/payment-callbacks/duitku", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString() }, env);
  };
  const base = { merchantCode: MERCHANT, amount: "150000", merchantOrderId: "EMBPAY-0001", resultCode: "00", reference: "DREF123" };
  const statusResponse = (statusCode: string, amount = "150000") =>
    new Response(JSON.stringify({ merchantOrderId: "EMBPAY-0001", reference: "DREF123", amount, fee: "0.00", statusCode, statusMessage: "x" }), { status: 200 });
  const orderState = () => db.prepare("SELECT order_status, payment_status FROM orders WHERE id = 'ord_1'").first<{ order_status: string; payment_status: string }>();

  it("rejects an invalid signature without touching the order", async () => {
    await seedAttempt();
    const res = await callback({ ...base, signature: "a".repeat(64) }, false);
    expect(res.status).toBe(401);
    expect(await orderState()).toEqual({ order_status: "awaiting_payment", payment_status: "not_started" });
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it("rejects a forged merchant code", async () => {
    await seedAttempt();
    const form = new URLSearchParams({ ...base, merchantCode: "DOTHER" });
    form.set("signature", await hmacHex(API_KEY, "DOTHER" + base.amount + base.merchantOrderId));
    const res = await app.request("/api/v1/payment-callbacks/duitku", { method: "POST", body: form.toString(), headers: { "Content-Type": "application/x-www-form-urlencoded" } }, env);
    expect(res.status).toBe(401);
  });

  it("flags an amount mismatch for manual review", async () => {
    await seedAttempt();
    const res = await callback({ ...base, amount: "1000" });
    expect(res.status).toBe(400);
    expect((await orderState())?.payment_status).toBe("manual_review");
  });

  it("marks paid only after the status API confirms the same amount", async () => {
    await seedAttempt();
    providerFetch.mockResolvedValue(statusResponse("00"));
    const res = await callback(base);
    expect(await res.json()).toEqual({ outcome: "paid" });
    expect(await orderState()).toEqual({ order_status: "paid", payment_status: "verified_paid" });
    const [url] = providerFetch.mock.calls[0] as [string];
    expect(url).toBe("https://passport.duitku.com/webapi/api/merchant/transactionStatus");
  });

  it("does not mark paid when the callback says success but the status API says pending", async () => {
    await seedAttempt();
    providerFetch.mockResolvedValue(statusResponse("01"));
    expect(await (await callback(base)).json()).toEqual({ outcome: "pending" });
    expect((await orderState())?.payment_status).toBe("pending");
  });

  it("treats status-API amount disagreement as manual review", async () => {
    await seedAttempt();
    providerFetch.mockResolvedValue(statusResponse("00", "1000"));
    await callback(base);
    expect((await orderState())?.payment_status).toBe("manual_review");
  });

  it("is idempotent for duplicate notifications", async () => {
    await seedAttempt();
    providerFetch.mockResolvedValue(statusResponse("00"));
    await callback(base);
    const again = await callback(base);
    expect(await again.json()).toEqual({ outcome: "duplicate" });
    expect(providerFetch).toHaveBeenCalledTimes(1);
    const events = await db.prepare("SELECT COUNT(*) AS n FROM payment_events WHERE signature_valid = 1").first<{ n: number }>();
    expect(events?.n).toBe(1);
  });

  it("records a cancelled transaction as failed", async () => {
    await seedAttempt();
    providerFetch.mockResolvedValue(statusResponse("02"));
    await callback({ ...base, resultCode: "01" });
    expect((await orderState())?.payment_status).toBe("failed");
  });

  it("asks the provider to retry when status cannot be verified", async () => {
    await seedAttempt();
    providerFetch.mockRejectedValue(new Error("timeout"));
    const res = await callback(base);
    expect(res.status).toBe(503);
    expect((await orderState())?.payment_status).toBe("not_started");
    providerFetch.mockResolvedValue(statusResponse("00"));
    expect(await (await callback(base)).json()).toEqual({ outcome: "paid" });
  });

  it("ignores callbacks for unknown orders and when not configured", async () => {
    expect((await callback(base)).status).toBe(404);
    const res = await app.request("/api/v1/payment-callbacks/duitku", { method: "POST", body: "x=1" }, { ...env, DUITKU_API_KEY: undefined });
    expect(res.status).toBe(503);
  });
});
