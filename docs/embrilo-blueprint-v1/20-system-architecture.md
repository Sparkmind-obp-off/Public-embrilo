# 20 — System Architecture
Customer browser → Public Web/API → authenticated service connector → private Embrilo OS → operator-assisted Genspark UI → QC → private delivery storage → customer-authorized access.

Payment path: customer → server-created checkout → verified provider callback/status → order/payment state → authorized OS queue.

## Boundaries
Public Web must not query OS database directly. Browser input is untrusted; never trust client price/payment/role/order ownership. Secrets stay server-side. Connector requests require authentication, validation, replay protection and idempotency. Order reference alone is not authorization. Public showcase assets must be separate from private files.

## Failure handling
Connector outage: persist and retry without duplicate jobs. Uncertain payment: pending/manual review, not paid. Duplicate callback: idempotent. Delivery outage: retry without exposing permanent public file paths.

## Decisions
Separate Public Web/OS and operator-assisted Genspark initially: locked. Guest-first and fixed-package/custom-quote split: proposed. Duitku activation: blocker until credentials and end-to-end verification. Vendor marketplace: future only.

## Acceptance
No frontend secrets; authenticated/idempotent connector; verified payment; cross-customer isolation; private delivery; recoverable failures.