# 36 — Credits, Entitlements & Usage Ledger
Status: proposed design. Exact quantities and plan prices remain unapproved. Date: 2026-10-29.

## Core rule
The backend and D1 ledger are the source of truth for credits. Never rely on a frontend counter or client-provided plan. Every grant, reservation, capture, release, expiry and adjustment must be auditable and idempotent.

## Suggested entities
- plans: plan key, display name, active flag, entitlement policy version.
- entitlements: customer ID, source (signup, purchase, promotion, admin adjustment), quantity, remaining/reserved amounts, starts_at, expires_at, status, idempotency key.
- usage_transactions: unique transaction ID, customer ID, task ID, event type, signed quantity delta, reason, related provider event, timestamp.
- generation_tasks: customer ID, asset type, provider/workflow, normalized request, status, estimated cost/credits, reserved credits, provider reference, output refs, failure code, timestamps.
- credit_purchases: customer ID, payment reference, plan/pack snapshot, amount, currency, payment state.
- idempotency_keys: owner/customer, operation, key, request hash, result reference, expiry.
- audit_events: safe actor/action/target/outcome metadata.

Exact schema and indexes must be reconciled with the current D1 migrations before implementation.

## Ledger events
Use explicit event types such as:
- trial_granted
- purchase_credited
- promotion_granted
- generation_reserved
- generation_captured
- generation_released
- generation_refunded
- entitlement_expired
- admin_adjustment

Do not silently overwrite a balance without a corresponding ledger event. Balance can be materialized for performance but must reconcile to ledger history.

## Free entitlement
- Grant only after backend verification of a valid Clerk identity and required email verification.
- Use a database uniqueness constraint/idempotency key to ensure a user receives the initial grant once.
- Initial policy candidate: one free trial credit for one eligible generation task. It is not yet approved as a promise for one finished video; asset type and provider capability must be explicit.
- Repeated requests, reloads, sign-ins, webhook retries or email casing changes must not grant extra credits.
- Define expiration and eligibility rules before public launch.
- Account deletion/re-registration abuse may require risk controls; avoid making false claims that email verification fully prevents multiple accounts.

## Reservation lifecycle
1. Validate identity, plan, credit availability, task input and rate limits.
2. In a transaction, create task and reserve the required credits exactly once.
3. Submit task to the selected provider or operator queue with an idempotency key where supported.
4. On successful completion and validated output, capture reserved credits.
5. On provider failure before useful output, release or restore credits according to the published policy.
6. On uncertain timeout, mark reconciliation_required; do not blindly charge again or submit duplicate jobs.
7. Record every transition and reconcile orphaned reservations through a scheduled/operator-safe process.

## Credit calculation
Credits must be based on an explicit versioned usage table, not arbitrary client values. Inputs may include:
- asset type (image, video, script, other);
- model/provider and output quality/duration;
- number of outputs;
- provider cost and expected operational overhead.
Display the expected credit cost before the user confirms. Recheck all values on the server.

## Payment integration
- Credit packs or paid entitlements are granted only after server-side payment verification.
- A browser success event or return URL is not proof of payment.
- Verify signature, merchant, reference, amount, currency and payment status; deduplicate callbacks and reconcile with provider status API.
- Keep order/payment state separate from generation-task state.
- Never grant credits twice for duplicate callbacks.

## Abuse/cost controls
- Rate-limit tasks by account and IP-derived coarse controls as appropriate.
- Cap concurrent jobs, prompt length, output count and duration.
- Add provider budget caps, daily global spend caps and emergency disable switch.
- Restrict unsupported prompts using the selected provider's policy.
- Log provider cost and result metadata without storing unnecessary sensitive prompt data.
- Add operator alerts for abnormal spend, failure spikes and repeated account abuse.

## Acceptance tests
Concurrent requests cannot overspend credits; duplicate signup events do not double-grant; duplicate payment callback does not double-credit; provider failure follows restoration policy; timeout reconciliation does not duplicate work; balance reconciles to ledger; users cannot inspect other customers' ledger entries.