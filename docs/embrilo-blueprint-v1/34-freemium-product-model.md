# 34 — Freemium AI Creation Product Model
Status: proposed product decision; not proof of implementation. Date: 2026-10-29.

## Product direction
Embrilo evolves from a service-only storefront toward a **freemium AI-assisted creation workspace**: a customer signs in, receives a clearly limited free allowance, generates or requests visual/video assets where a supported provider is available, then upgrades to a paid plan or purchases additional credits.

This is SaaS-like in account, workspace, quota, and usage tracking, but the product may still include Embrilo-operated services, assisted production, curated workflows, and human quality review. Do not describe it as a fully autonomous generator unless the actual production flow supports that claim.

## Product pillars
1. **Create** — start a generation task for supported asset types.
2. **Manage** — view task status, usage, outputs and history.
3. **Upgrade** — compare free and paid entitlements.
4. **Order services** — request Embrilo-assisted or human-delivered work where applicable.
5. **Trust** — clear privacy, provider, retention, failure and usage policies.

## Account entry
- Email sign-up and email verification.
- Google Sign-In through Clerk, subject to Clerk project configuration and OAuth setup.
- One stable internal customer ID in Embrilo; do not use email as the primary database key.
- Account linking must follow Clerk's documented flow; do not create duplicate accounts based on unverified email.
- Do not require a phone number unless a specific abuse-prevention need is demonstrated.

## Free plan
The initial free plan should provide a **small, explicit trial allowance** for eligible users. Exact credits, asset types, limits and expiry are configuration decisions that must be approved before launch.
- Initial product intent: let a new verified account try at least one useful generation or asset-creation task.
- One free video may be used as an initial hypothesis, not a promise until video generation provider, cost and fulfillment are verified.
- If video generation is unavailable or too costly, expose a clearly named supported visual asset or assisted-creation trial instead; do not label a still image as a video.
- Show the user what each credit is expected to produce before they confirm.
- Free does not mean unlimited. Apply fair-use limits, concurrency limits and abuse controls.

## Paid plans
Possible commercial forms, to validate before release:
- Free: small one-time trial allowance.
- Credit packs: one-off purchase of additional generation credits.
- Paid tiers: larger monthly allowance, better queue priority or additional workflow features only where those benefits are actually implemented.
- Assisted service packages: fixed-scope human/operator-delivered work with clear deliverables and revision rules.

Do not launch recurring subscriptions by default. Start with free trial plus a simple one-time paid option only after cost and provider economics are understood. No plan price is approved in this document.

## Product boundaries
- Generated output is not automatically a public showcase item.
- Customer outputs are private by default.
- Generation usage and service-order fulfillment are separate domains.
- A payment being successful does not imply a generation succeeded; a generation succeeding does not imply an unpaid order is paid.
- Never deduct paid credits for a task rejected before provider submission.
- Define refund/credit-restoration behavior for provider failures and moderation blocks.

## MVP customer journey
1. Visitor sees supported capabilities and transparent limits.
2. Visitor signs up or signs in with Clerk using email or Google.
3. Backend validates the Clerk session/token.
4. Backend maps Clerk subject to an internal customer record.
5. Backend grants the initial free entitlement once, idempotently.
6. Customer selects an asset type, enters a prompt/brief and sees estimated credit use.
7. Backend validates entitlement and limits, reserves credits, and creates a generation task.
8. Provider or operator workflow runs; status is visible in the customer's account.
9. On success, usage is finalized and the private output is made available.
10. On eligible failure, reservation is released or credits restored under the documented policy.
11. Customer may upgrade or purchase credits using a verified payment flow.

## Success metrics
- Verified sign-up to first valid task rate.
- First-task success rate and time to result.
- Free-to-paid conversion, with cohort window stated.
- Provider cost per successful output and gross contribution margin.
- Failure, moderation, abuse, refund and credit-restoration rates.
- Repeat usage and customer-reported usefulness.

## Release gate
Do not advertise a capability until an end-to-end test proves the provider or assisted workflow, output storage, customer access, usage accounting, failure handling and cost controls.