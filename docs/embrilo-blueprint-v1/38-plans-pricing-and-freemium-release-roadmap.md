# 38 — Plans, Pricing & Freemium Release Roadmap
Status: proposed framework. Prices and final allowances are not approved. Date: 2026-10-29.

## Initial plan framework
| Plan | Intended purpose | Candidate entitlement | Commercial status |
|---|---|---|---|
| Free Trial | Experience one supported capability | Small one-time trial allowance; candidate is 1 credit | Proposed; exact output must be validated |
| Credit Pack | Pay only when needed | Fixed credits with disclosed supported asset types and expiry | Proposed; price/cost model required |
| Creator | Regular individual usage | Larger allowance and usage history | Later; not approved |
| Studio | Higher-volume or team workflow | Shared/team features only if built | Later; not approved |
| Assisted Service | Human/operator-delivered work | Fixed scope, deliverables, timeline and revision terms | Existing service concept; each offer needs approval |

No price, allowance, output duration, quality, turnaround time or subscription benefit is approved by this document. Avoid displaying placeholder values as real offers.

## Pricing methodology
For each generation type, calculate:
- provider cost per attempt and success;
- storage, transfer and platform cost;
- moderation, failure, retry and credit-restoration costs;
- operator time and quality-review cost;
- payment processing fee and refund exposure;
- expected contribution margin and abuse reserve.
Then choose a price/credit mapping that can be explained to customers. If economics are unknown, run a limited pilot with a strict budget rather than promising unlimited free generation.

## Free allowance rules to decide before launch
- one-time or recurring;
- eligible generation types;
- whether failed tasks restore the credit;
- expiry date or no expiry;
- maximum output count/duration/size;
- concurrency and queue priority;
- account eligibility and abuse controls;
- storage and output retention period.
The current product direction favors a small one-time trial for a verified account. The earlier candidate of one free video is only valid if a real video workflow is available and affordable; otherwise clearly offer one supported visual asset or assisted trial.

## Implementation phases
### Phase A — Product and provider proof
Approve first free capability; test a real provider or operator-assisted workflow; measure cost and failure rate; define plan/terms.
Gate: one real output can be delivered privately to the correct account with recorded cost.

### Phase B — Identity
Configure Clerk email verification and Google Sign-In; map Clerk subject to internal customer ID; validate protected Hono endpoints.
Gate: email and Google sign-in both pass on staging, or unavailable provider methods are explicitly hidden.

### Phase C — Entitlements and task ledger
Implement D1-backed plans, grants, reservation ledger, task state, idempotency and reconciliation.
Gate: no double-grant/double-charge under duplicate and concurrent requests.

### Phase D — First generation experience
Build account dashboard, creation form, task progress, error/retry messaging and private history.
Gate: success, failure, timeout and policy-block flows are tested.

### Phase E — Paid credits
Choose one payment provider (Duitku or Midtrans) after current official docs, account status and cost are checked. Implement server-side checkout/callback verification and grant credits only after confirmed payment.
Gate: signed callback, amount mismatch, duplicate callback, pending, failure, expiry and refund paths tested.

### Phase F — Controlled release
Release with a limited quota and budget cap. Track activation, successful outputs, conversion, provider spend, support load and abuse. Pause if cost or failure exceeds the approved threshold.

## Launch checklist
- [ ] Capability is real and labelled accurately.
- [ ] Clerk email + Google configuration is verified.
- [ ] Free grant is unique and server-controlled.
- [ ] Credits use an auditable ledger and concurrency-safe reservations.
- [ ] Paid credit grant requires verified payment.
- [ ] Output storage and access are private.
- [ ] Terms, privacy, retention, refund and content policies are published.
- [ ] Provider cost caps and emergency disable switch work.
- [ ] End-to-end tests and monitoring pass.
- [ ] No API keys, provider secrets or private assets are exposed.
