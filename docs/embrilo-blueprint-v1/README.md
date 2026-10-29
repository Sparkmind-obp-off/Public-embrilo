# Embrilo Blueprint v1
Status: planning baseline, not proof of live implementation. Date: 2026-10-29.

## Product model
- **Service catalog:** what a customer can order, exact scope, deliverables, price/quote, timing and terms.
- **Customer journey:** discover → compare → brief → order/quote → payment → track → receive → revise/complete.
- **Showcase:** selected generated outputs approved for public display, honestly labelled.
- **Private deliverable:** output belonging to a particular order; never public by default.
- **Public Web / Embrilo OS:** separate deployments, data boundaries and credentials. Genspark production starts operator-assisted.

## Documents
00 North Star; 20 Architecture; 21 Data model; 22 API contract; 23 UX/UI; 24 Build blueprint; 25 Billing; 26 Commerce evolution; 27 Service catalog; 28 Showcase governance; 29 Customer journey/access; 30 Production/QC; 31 Privacy/security; 32 Roadmap/release gates; 33 Evidence ledger; 34 Freemium product model; 35 Clerk + Google Sign-In; 36 Credits/entitlements/usage ledger; 37 AI provider adapter/capability gates; 38 Plans/pricing/freemium roadmap.

## Baseline from prior source review
Service concepts include short-video scripts, product storytelling, and weekly content planning. Brief form was local-only; persisted order submission, checkout/payment verification, customer tracking, secure delivery and active Public-to-OS sync were not confirmed complete. Duitku is a candidate, not assumed live. Reinspect current source before implementation.

Freemium direction: introduce account-based creation with a small one-time trial allowance, Clerk email + Google Sign-In, D1-backed credit ledger, and an adapter layer for supported AI providers. Exact free allowance, paid pricing, and generation capabilities remain unapproved until provider/cost tests are complete. Read docs 34–38 before authoring the Master System Prompt.

Master System Prompt should be authored after reviewing this blueprint and resolving blockers.