import type { Env } from "../env";
import { audit, nowIso } from "../lib/db";
import { sha256Hex } from "../lib/crypto";
import { checkTransactionStatus, duitkuConfig, parseCallback, verifyCallbackSignature } from "./duitku";

export type CallbackOutcome =
  | "not_configured" | "bad_request" | "invalid_signature" | "unknown_order" | "amount_mismatch"
  | "duplicate" | "paid" | "pending" | "failed" | "verification_pending";

type HttpStatus = 200 | 400 | 401 | 404 | 503;

/**
 * Duitku callback handler. The callback is only a hint: authenticity is checked with the
 * documented HMAC, then the outcome is re-verified against Duitku's transactionStatus API
 * before any order state changes. Duplicate notifications are idempotent.
 */
export async function handleDuitkuCallback(
  db: D1Database,
  env: Env,
  form: URLSearchParams,
  fetchImpl: typeof fetch,
): Promise<{ outcome: CallbackOutcome; httpStatus: HttpStatus }> {
  const cfg = duitkuConfig(env);
  if (!cfg) return { outcome: "not_configured", httpStatus: 503 };

  const fields = parseCallback(form);
  if (!fields) return { outcome: "bad_request", httpStatus: 400 };

  const record = async (eventKey: string, signatureValid: boolean, outcome: string) =>
    db
      .prepare(
        `INSERT INTO payment_events (id, provider, event_key, merchant_order_id, result_code, amount, signature_valid, outcome, received_at)
         VALUES (?, 'duitku', ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(provider, event_key) DO NOTHING RETURNING id`,
      )
      .bind(crypto.randomUUID(), eventKey, fields.merchantOrderId.slice(0, 64), fields.resultCode.slice(0, 8), Number(fields.amount), signatureValid ? 1 : 0, outcome, nowIso())
      .first<{ id: string }>();

  if (!(await verifyCallbackSignature(cfg, fields))) {
    await record(`invalid:${crypto.randomUUID()}`, false, "invalid_signature");
    return { outcome: "invalid_signature", httpStatus: 401 };
  }

  const attempt = await db
    .prepare("SELECT id, order_id, amount, status FROM payment_attempts WHERE merchant_order_id = ? AND provider = 'duitku'")
    .bind(fields.merchantOrderId)
    .first<{ id: string; order_id: string; amount: number; status: string }>();
  if (!attempt) return { outcome: "unknown_order", httpStatus: 404 };

  const eventKey = await sha256Hex(`${fields.reference}|${fields.resultCode}|${fields.amount}|${fields.merchantOrderId}`);

  if (Number(fields.amount) !== attempt.amount) {
    const fresh = await record(eventKey, true, "amount_mismatch");
    if (fresh) {
      await db.batch([
        db.prepare("UPDATE payment_attempts SET status = 'manual_review', updated_at = ? WHERE id = ? AND status != 'paid'").bind(nowIso(), attempt.id),
        db.prepare("UPDATE orders SET payment_status = 'manual_review', updated_at = ? WHERE id = ? AND payment_status != 'verified_paid'").bind(nowIso(), attempt.order_id),
      ]);
      await audit(db, { actor: "provider:duitku", action: "payment.callback", target: attempt.order_id, outcome: "amount_mismatch" });
    }
    return { outcome: "amount_mismatch", httpStatus: 400 };
  }

  const fresh = await record(eventKey, true, "received");
  if (!fresh || attempt.status === "paid") return { outcome: "duplicate", httpStatus: 200 };

  // Never trust the callback result alone: confirm with the provider status API.
  const verified = await checkTransactionStatus(cfg, fields.merchantOrderId, fetchImpl);
  const now = nowIso();

  if (verified.status === "paid" && verified.amount === attempt.amount) {
    await db.batch([
      db.prepare("UPDATE payment_attempts SET status = 'paid', provider_reference = ?, updated_at = ? WHERE id = ? AND status != 'paid'").bind(verified.reference ?? fields.reference, now, attempt.id),
      db.prepare(
        `UPDATE orders SET payment_status = 'verified_paid',
           order_status = CASE WHEN order_status = 'awaiting_payment' THEN 'paid' ELSE order_status END, updated_at = ?
         WHERE id = ? AND payment_status != 'verified_paid'`,
      ).bind(now, attempt.order_id),
    ]);
    await audit(db, { actor: "provider:duitku", action: "payment.verified", target: attempt.order_id, outcome: "paid" });
    return { outcome: "paid", httpStatus: 200 };
  }
  if (verified.status === "paid") {
    await db.batch([
      db.prepare("UPDATE payment_attempts SET status = 'manual_review', updated_at = ? WHERE id = ? AND status != 'paid'").bind(now, attempt.id),
      db.prepare("UPDATE orders SET payment_status = 'manual_review', updated_at = ? WHERE id = ? AND payment_status != 'verified_paid'").bind(now, attempt.order_id),
    ]);
    return { outcome: "amount_mismatch", httpStatus: 200 };
  }
  if (verified.status === "pending") {
    await db.prepare("UPDATE payment_attempts SET status = 'pending', updated_at = ? WHERE id = ? AND status IN ('created', 'pending')").bind(now, attempt.id).run();
    await db.prepare("UPDATE orders SET payment_status = 'pending', updated_at = ? WHERE id = ? AND payment_status IN ('not_started', 'pending')").bind(now, attempt.order_id).run();
    return { outcome: "pending", httpStatus: 200 };
  }
  if (verified.status === "cancelled") {
    await db.prepare("UPDATE payment_attempts SET status = 'failed', updated_at = ? WHERE id = ? AND status IN ('created', 'pending')").bind(now, attempt.id).run();
    await db.prepare("UPDATE orders SET payment_status = 'failed', updated_at = ? WHERE id = ? AND payment_status IN ('not_started', 'pending')").bind(now, attempt.order_id).run();
    return { outcome: "failed", httpStatus: 200 };
  }
  // Provider unreachable/unknown: keep state, allow the provider to retry later.
  await db.prepare("DELETE FROM payment_events WHERE provider = 'duitku' AND event_key = ?").bind(eventKey).run();
  return { outcome: "verification_pending", httpStatus: 503 };
}
