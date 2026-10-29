# 25 — Billing & Monetization
Start with Embrilo-fulfilled services. Fixed packages only when scope/capacity are clear; custom work gets an explicit quote. No subscriptions, commissions or vendor payouts before repeatable value is proven.

## Fixed offer must define
Deliverables/quantity, formats, inclusions/exclusions, start condition/timeline, revision count/definition, IDR price, availability, cancellation/refund terms, support and version.

## Custom quote
Objective, deliverables, assumptions/exclusions, timeline/dependencies, price/currency, validity, revisions, payment schedule, cancellation/refund and explicit acceptance.

## Price/payment authority
Server-side offer is authoritative; reject client totals; snapshot scope/price. Duitku is a candidate, not assumed active. Activation requires credentials, callback/auth verification, amount/currency checks, idempotency and pending/failure/expiry/refund end-to-end tests. Secrets never in frontend/source.

Payment states: not_started, pending, verified_paid, failed, expired, refunded, manual_review. Browser redirect alone is not proof. Measure revenue, fees, tool/asset costs, operator time, revisions, refunds and contribution margin. No sale button until scope, price, capacity, SOP and terms are ready.