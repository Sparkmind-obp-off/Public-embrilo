import type { Env } from "../env";
import { hmacHex, timingSafeEqual } from "../lib/crypto";

/**
 * Duitku Pop adapter. Endpoints and signature formulas follow the official docs
 * (https://docs.duitku.com/pop/id/ and https://docs.duitku.com/api/id/), checked 2026-10-29.
 */
export const DUITKU_ENDPOINTS = {
  production: {
    createInvoice: "https://api-prod.duitku.com/api/merchant/createInvoice",
    transactionStatus: "https://passport.duitku.com/webapi/api/merchant/transactionStatus",
    popScript: "https://app-prod.duitku.com/lib/js/duitku.js",
  },
  sandbox: {
    createInvoice: "https://api-sandbox.duitku.com/api/merchant/createInvoice",
    transactionStatus: "https://sandbox.duitku.com/webapi/api/merchant/transactionStatus",
    popScript: "https://app-sandbox.duitku.com/lib/js/duitku.js",
  },
} as const;

export type DuitkuEnvName = keyof typeof DUITKU_ENDPOINTS;

export interface DuitkuConfig {
  env: DuitkuEnvName;
  merchantCode: string;
  apiKey: string;
}

export function duitkuConfig(env: Env): DuitkuConfig | null {
  const name: DuitkuEnvName = env.DUITKU_ENV === "sandbox" ? "sandbox" : "production";
  if (!env.DUITKU_MERCHANT_CODE || !env.DUITKU_API_KEY) return null;
  return { env: name, merchantCode: env.DUITKU_MERCHANT_CODE, apiKey: env.DUITKU_API_KEY };
}

/** Checkout is offered only when the kill switch is on AND credentials exist. */
export const paymentsEnabled = (env: Env) => env.PAYMENTS_ENABLED === "true" && duitkuConfig(env) !== null;

export const callbackSignature = (cfg: DuitkuConfig, amount: string, merchantOrderId: string) =>
  hmacHex(cfg.apiKey, cfg.merchantCode + amount + merchantOrderId);

export interface CreateInvoiceInput {
  merchantOrderId: string;
  amount: number;
  productDetails: string;
  email: string;
  customerVaName: string;
  callbackUrl: string;
  returnUrl: string;
  expiryPeriodMinutes: number;
}

export type CreateInvoiceResult =
  | { ok: true; reference: string; paymentUrl: string }
  | { ok: false; uncertain: boolean; message: string };

export async function createInvoice(cfg: DuitkuConfig, input: CreateInvoiceInput, fetchImpl: typeof fetch = fetch): Promise<CreateInvoiceResult> {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) return { ok: false, uncertain: false, message: "invalid_amount" };
  const timestamp = String(Date.now());
  const signature = await hmacHex(cfg.apiKey, cfg.merchantCode + timestamp);
  const body = {
    paymentAmount: input.amount,
    merchantOrderId: input.merchantOrderId.slice(0, 50),
    productDetails: input.productDetails.slice(0, 255),
    email: input.email,
    customerVaName: input.customerVaName.slice(0, 20),
    itemDetails: [{ name: input.productDetails.slice(0, 50), price: input.amount, quantity: 1 }],
    callbackUrl: input.callbackUrl,
    returnUrl: input.returnUrl,
    expiryPeriod: input.expiryPeriodMinutes,
  };
  try {
    const response = await fetchImpl(DUITKU_ENDPOINTS[cfg.env].createInvoice, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-duitku-signature": signature,
        "x-duitku-timestamp": timestamp,
        "x-duitku-merchantcode": cfg.merchantCode,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const json = (await response.json().catch(() => null)) as { reference?: string; paymentUrl?: string; statusCode?: string } | null;
    if (response.ok && json?.statusCode === "00" && json.reference) return { ok: true, reference: json.reference, paymentUrl: json.paymentUrl ?? "" };
    return { ok: false, uncertain: response.status >= 500, message: `provider_${response.status}` };
  } catch {
    // Network error/timeout: the invoice may or may not exist. Never retry with a new order id blindly.
    return { ok: false, uncertain: true, message: "provider_unreachable" };
  }
}

export type ProviderStatus = "paid" | "pending" | "cancelled" | "unknown";

export interface StatusResult {
  status: ProviderStatus;
  amount: number | null;
  reference: string | null;
}

/** Server-side status check. statusCode: 00 success, 01 pending, 02 cancelled (official docs). */
export async function checkTransactionStatus(cfg: DuitkuConfig, merchantOrderId: string, fetchImpl: typeof fetch = fetch): Promise<StatusResult> {
  const signature = await hmacHex(cfg.apiKey, cfg.merchantCode + merchantOrderId);
  try {
    const response = await fetchImpl(DUITKU_ENDPOINTS[cfg.env].transactionStatus, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantCode: cfg.merchantCode, merchantOrderId, signature }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return { status: "unknown", amount: null, reference: null };
    const json = (await response.json()) as { merchantOrderId?: string; statusCode?: string; amount?: string; reference?: string };
    if (json.merchantOrderId !== merchantOrderId) return { status: "unknown", amount: null, reference: null };
    const amount = json.amount !== undefined && /^\d+(\.0+)?$/.test(String(json.amount)) ? Math.round(Number(json.amount)) : null;
    const status: ProviderStatus = json.statusCode === "00" ? "paid" : json.statusCode === "01" ? "pending" : json.statusCode === "02" ? "cancelled" : "unknown";
    return { status, amount, reference: json.reference ?? null };
  } catch {
    return { status: "unknown", amount: null, reference: null };
  }
}

export interface CallbackFields {
  merchantCode: string;
  amount: string;
  merchantOrderId: string;
  resultCode: string;
  reference: string;
  signature: string;
}

/** Parses the x-www-form-urlencoded callback. Returns null when required fields are missing. */
export function parseCallback(form: URLSearchParams): CallbackFields | null {
  const get = (key: string) => form.get(key)?.trim() ?? "";
  const fields = {
    merchantCode: get("merchantCode"), amount: get("amount"), merchantOrderId: get("merchantOrderId"),
    resultCode: get("resultCode"), reference: get("reference"), signature: get("signature").toLowerCase(),
  };
  if (!fields.merchantCode || !/^\d+$/.test(fields.amount) || !fields.merchantOrderId || !/^[a-f0-9]{64}$/.test(fields.signature)) return null;
  return fields;
}

export async function verifyCallbackSignature(cfg: DuitkuConfig, fields: CallbackFields) {
  if (!timingSafeEqual(fields.merchantCode, cfg.merchantCode)) return false;
  const expected = await callbackSignature(cfg, fields.amount, fields.merchantOrderId);
  return timingSafeEqual(expected, fields.signature);
}
