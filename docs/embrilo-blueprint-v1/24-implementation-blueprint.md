# 24 — Implementation Blueprint
## Public modules
Catalog, showcase, brief, custom quote, order, checkout, secure customer access, delivery, support/legal.

## Internal OS modules
Authenticated intake, queue/triage, brief workspace, Prompt Studio, production log, QC, revision, private delivery, audit/reconciliation.

## Build sequence
0. Approve decisions and blockers.
1. Define 1–3 pilot offers and manually test fulfillment.
2. Persist brief/quote/order server-side with validation and spam controls.
3. Add customer-bound order access/status.
4. Implement authenticated Public-to-OS sync with idempotency/retry.
5. Configure/test provider payment; only then enable checkout.
6. Add QC, revisions, private storage and secure delivery.
7. Run controlled pilot and measure outcomes.

## Stack
Prior source review found React + TypeScript + Vite on Public Web. Inspect current repo and retain suitable existing stack; do not introduce framework/database/auth provider without reason. Verify bindings and deployment constraints before coding.

## Definition of done
Code implemented, relevant tests pass, authorization/failure paths tested, docs match behavior, monitoring/manual reconciliation exists, customer claims accurate and deployment verified. Build/merge alone does not prove workflow works.