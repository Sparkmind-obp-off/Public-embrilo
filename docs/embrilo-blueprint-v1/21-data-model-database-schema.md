# 21 — Data Model & Database Schema
## Core entities
- service: public service identity/category/status.
- offer: version, scope, deliverables, formats, timeline, revisions, exclusions, price or quote-required, availability.
- showcase_item: preview, origin type (demo/sample/pilot/customer work), approval, permission, disclosure label.
- customer_contact: minimum normalized contact data and consent.
- order: public reference, contact, immutable offer/scope/price snapshot, brief, independent order/payment/fulfillment states, timestamps.
- brief: goal, audience, brand context, format, references, constraints, assets and consent.
- quote_request/quote: scope, price, validity, timeline, revision policy and acceptance.
- payment_attempt/payment_event: provider references, amount/currency, status, verification, deduplication.
- production_job (OS): external order ref, idempotency key, status, operator, prompt version.
- deliverable: private asset ref, version, MIME, size, checksum, QC/delivery state.
- revision_request, permission_record, audit_event.

## Suggested order states
draft, awaiting_payment, payment_verification_pending, paid, queued, in_production, quality_review, revision_requested, ready_for_delivery, delivered, completed, cancelled, refunded, failed_manual_review. Keep payment and fulfillment states separate.

## Constraints
Money stored as integer with explicit currency (IDR initially); snapshot purchased scope/price; unique idempotency/provider event IDs; foreign keys preserve audit/financial history; private storage refs never appear in public payloads. Set retention periods by data class after review.