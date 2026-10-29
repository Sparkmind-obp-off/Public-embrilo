# 22 — API & Integration Contract
Proposed contract only; not a claim routes are live.

## Public endpoints
GET /api/v1/catalog; GET /api/v1/showcase; POST /api/v1/quote-requests; POST /api/v1/orders; POST /api/v1/orders/{id}/checkout; GET /api/v1/order-access; GET /api/v1/orders/{id}; POST /api/v1/payment-callbacks/{provider}.

## Internal connector
POST /internal/v1/jobs; GET /internal/v1/jobs/{external_order_id}; POST /internal/v1/jobs/{id}/events; POST /internal/v1/deliveries.

## Rules
Version schemas; validate payloads; rate-limit public endpoints; use safe errors. Idempotency for order/payment/job creation. HMAC or equivalent service auth includes timestamp/request identity/body digest; reject replay; rotate staging/production keys. Internal endpoints are server-to-server only. Never log credentials or sensitive payment payloads.

## Callback sequence
Verify authenticity; validate merchant ref/amount/currency/state; deduplicate event; update payment/order transactionally; sync OS only when payment is verified and eligible; respond per provider contract; reconcile uncertain states. Browser redirect is not proof of payment.

## Tests
Tampered price; invalid signature; duplicate callback; wrong amount/currency; cross-customer access; browser hitting internal endpoint; connector outage; safe error output.