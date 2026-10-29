import type { Env } from "../env";
import { hmacSha256, randomToken, sha256Hex, toBase64Url } from "./crypto";

/**
 * Client for Embrilo OS connector v1 (System-Internal-embrilo docs/09-connector-contract.md).
 * Server-to-server only; the secret never reaches the browser.
 */
export const OS_AUDIENCE = "embrilo-os/v1";

export function osCanonicalString(p: {
  method: string; pathWithQuery: string; timestamp: string; nonce: string;
  customerRef?: string; customerToken?: string; idempotencyKey?: string; bodySha256: string;
}) {
  return [
    "EMBRILO-HMAC-V1", OS_AUDIENCE, p.method.toUpperCase(), p.pathWithQuery, p.timestamp, p.nonce,
    p.customerRef ?? "", p.customerToken ?? "", p.idempotencyKey ?? "", p.bodySha256,
  ].join("\n");
}

export async function signOsRequest(
  secret: string,
  keyId: string,
  p: { method: string; pathWithQuery: string; body?: string; customerRef?: string; customerToken?: string; idempotencyKey?: string; timestamp?: number; nonce?: string },
) {
  const timestamp = String(p.timestamp ?? Math.floor(Date.now() / 1000));
  const nonce = p.nonce ?? randomToken(18);
  const signature = toBase64Url(
    await hmacSha256(secret, osCanonicalString({ ...p, timestamp, nonce, bodySha256: await sha256Hex(p.body ?? "") })),
  );
  const headers: Record<string, string> = {
    "X-Embrilo-Key-Id": keyId, "X-Embrilo-Timestamp": timestamp, "X-Embrilo-Nonce": nonce, "X-Embrilo-Signature": signature,
  };
  if (p.customerRef) headers["X-Embrilo-Customer"] = p.customerRef;
  if (p.customerToken) headers["X-Embrilo-Customer-Token"] = p.customerToken;
  if (p.idempotencyKey) headers["Idempotency-Key"] = p.idempotencyKey;
  return headers;
}

export const connectorConfigured = (env: Env) =>
  Boolean(env.OS_CONNECTOR_URL?.startsWith("https://") && (env.CONNECTOR_HMAC_SECRET?.length ?? 0) >= 32);

export type OsSubmitResult =
  | { ok: true; publicRef: string; customerToken: string }
  | { ok: false; retryable: boolean; status: number };

/** Submits a request; same idempotency key + body is safe to retry (OS replays the original result). */
export async function submitToOs(env: Env, body: unknown, customerRef: string, idempotencyKey: string, fetchImpl: typeof fetch = fetch): Promise<OsSubmitResult> {
  if (!connectorConfigured(env)) return { ok: false, retryable: true, status: 0 };
  const path = "/v1/public/requests";
  const text = JSON.stringify(body);
  const headers = await signOsRequest(env.CONNECTOR_HMAC_SECRET!, env.CONNECTOR_KEY_ID || "public-embrilo-v1", {
    method: "POST", pathWithQuery: path, body: text, customerRef, idempotencyKey,
  });
  try {
    const response = await fetchImpl(new URL(path, env.OS_CONNECTOR_URL).toString(), {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: text, signal: AbortSignal.timeout(8000),
    });
    if (response.status === 200 || response.status === 201) {
      const json = (await response.json()) as { public_ref?: string; customer_token?: string };
      if (json.public_ref && json.customer_token) return { ok: true, publicRef: json.public_ref, customerToken: json.customer_token };
      return { ok: false, retryable: false, status: 502 };
    }
    return { ok: false, retryable: response.status === 429 || response.status >= 500, status: response.status };
  } catch {
    return { ok: false, retryable: true, status: 0 };
  }
}

export interface OsStatus {
  status: "received" | "needs_info" | "in_progress" | "delivered" | "cancelled";
  message?: string;
}

/** Customer-scoped status read. OS returns 404 for any authorization mismatch. */
export async function fetchOsStatus(
  env: Env,
  customerRef: string,
  osPublicRef: string,
  customerToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<OsStatus | null> {
  if (!connectorConfigured(env) || !/^[A-Za-z0-9_-]{4,64}$/.test(osPublicRef)) return null;
  const path = `/v1/public/requests/${encodeURIComponent(osPublicRef)}`;
  const headers = await signOsRequest(env.CONNECTOR_HMAC_SECRET!, env.CONNECTOR_KEY_ID || "public-embrilo-v1", {
    method: "GET", pathWithQuery: path, customerRef, customerToken,
  });
  try {
    const response = await fetchImpl(new URL(path, env.OS_CONNECTOR_URL).toString(), { headers, signal: AbortSignal.timeout(6000) });
    if (!response.ok) return null;
    const json = (await response.json()) as { status?: string; message?: string };
    const allowed = ["received", "needs_info", "in_progress", "delivered", "cancelled"] as const;
    const status = allowed.find((s) => s === json.status);
    return status ? { status, message: typeof json.message === "string" ? json.message.slice(0, 500) : undefined } : null;
  } catch {
    return null;
  }
}
