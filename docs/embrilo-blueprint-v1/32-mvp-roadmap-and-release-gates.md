# 32 — MVP Roadmap & Release Gates
## Phase 0 — commercial readiness
Approve 1–3 pilot offers, scope, deliverables, price/quote, revisions, timeline, support, showcase governance, privacy/terms and manual SOP. Gate: operator can explain and fulfill.

## Phase 1 — public discovery
Homepage, catalog/detail, approved showcase, process/FAQ, mobile/accessibility. Gate: CTAs work and claims are supported.

## Phase 2 — persisted intake/order
Server-side brief/quote/order, validation/spam controls, confirmation and immutable scope snapshot. Gate: survives reload/deploy and staff-only visibility.

## Phase 3 — customer access/status
Secure customer-bound access and support. Gate: reference alone reveals no order data.

## Phase 4 — OS connector
Authenticated sync, idempotency, retries/reconciliation. Gate: no duplicate jobs; outage does not lose orders.

## Phase 5 — payment
Provider credentials, checkout, verified callback and pending/failure/expiry/refund paths. Gate: end-to-end test passes; only verified paid orders proceed.

## Phase 6 — QC/delivery
QC, revisions, private storage, secure access. Gate: right customer receives right version; unauthorized access denied.

## Phase 7 — controlled pilot
Measure outcomes, time/cost, failures and feedback. Gate: at least one full cycle verified without critical payment/security defect.

Later: optional Google Sign-In, curated digital products after evidence, vendor marketplace, automation API after official support/policy review, subscriptions after repeat usage.