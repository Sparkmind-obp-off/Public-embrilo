# Embrilo Public — Audit Review & Remaining Work
**Audit date:** 2026-10-30  
**Repository:** `Sparkmind-obp-off/Public-embrilo`  
**Branch reviewed:** `main`  
**Reviewed head:** `416cfe354b20d0d13988266d9e245b747821fd1a`  
**Scope:** Public Embrilo app, Clerk integration, Cloudflare Pages/Functions, D1, Embrilo OS connector, freemium generation, payments and release readiness.

> **Important status correction:** The repository snapshot still contains old Development Clerk configuration and an earlier production-domain blocker. The owner has now confirmed in the current project conversation that Clerk is already on the **Production instance** and its custom domain/DNS setup is complete. Treat that as the current operational state, but reconcile the repository and deployed Pages variables with it. Do not switch Clerk back to Development, recreate DNS, or repeat Clerk setup.

## 1. Executive assessment

The Public Embrilo repository has a substantial foundation: Vite/React/TypeScript, Cloudflare Pages Functions with Hono, server-side Clerk token verification, customer mapping, quote-request idempotency, customer ownership checks, D1 migration, an HMAC connector client, a disabled Duitku adapter, and tests. The latest feature commit reports 60 passing tests (30 server tests).

**It is not yet a complete freemium generation product.** The current public application is still primarily a quote/brief intake system. The reviewed migration does not yet contain the full entitlement/credit ledger and generation-task model described in blueprint documents 34–38. No verified production AI generation provider or complete private asset delivery pipeline is established by the reviewed source.

Runtime status cannot be certified from repository inspection alone. Cloudflare Pages environment variables, D1 bindings, secrets, deployed build, Clerk dashboard settings and OS runtime must be checked separately.

## 2. Findings by priority

### P0 — Resolve before calling the customer journey production-ready

#### P0.1 — Reconcile Clerk Production configuration in source and Cloudflare Pages
**Evidence:** `wrangler.jsonc` in reviewed main still contains a `pk_test_…` publishable key and a comment identifying Development. README also contains Development-instance wording and the previous `embrilo-public.pages.dev` custom-domain blocker. Latest commit `416cfe3` only adds `embrilo.biz.id` to authorized parties; it does not replace the test publishable key.

**Current owner-confirmed reality:** Clerk Production and its custom domain/DNS are already set up. This audit does not dispute that; it identifies repository drift.

**Work:**
- Confirm the actual Pages Production `CLERK_PUBLISHABLE_KEY` is the correct `pk_live` value for the already-configured Embrilo Clerk instance.
- Confirm `CLERK_SECRET_KEY` is the matching Production secret in Cloudflare Pages, never in Git.
- Confirm `CLERK_AUTHORIZED_PARTIES` contains only the real production app origins that are intentionally supported.
- Confirm `public/_headers` CSP allows only the required Clerk production hosts.
- Remove stale test-key values and misleading Development/blocked-domain statements from tracked production configuration/docs. Do not commit any secret.
- Verify Google sign-in and session verification on `https://embrilo.biz.id` using a real test account.

**Acceptance:** Production login, Google OAuth return, protected API token verification and sign-out all pass on the custom domain. No `pk_test` value is shipped by the production build.

#### P0.2 — D1 storage is not wired in the reviewed repository
**Evidence:** `wrangler.jsonc` has no active `d1_databases` binding; the comment says the account reached its D1 database limit. `/api/v1/config` enables intake only when both Clerk and `DB` are configured. The health endpoint reports storage as `Boolean(DB)`.

**Work:**
- Inspect current Cloudflare D1 inventory and decide whether a safe existing database can be reused or a dedicated database slot must be made available.
- Do not attach Embrilo to another product's database or run migrations against an unverified database.
- Add the `DB` binding to the correct Pages Production environment and apply migrations remotely.
- Run a production smoke test for customer creation, brief submission, idempotent replay, listing and cross-customer denial.

**Acceptance:** `/api/v1/health` reports storage enabled; `/api/v1/config` reports intake enabled; data persists across requests and deployments.

#### P0.3 — Freemium generation and credits are still blueprint-level, not implemented
**Evidence:** The reviewed schema contains customers, quote requests, orders, payment attempts/events, audit events and rate limits. It does not yet implement the proposed plans, entitlements, credit ledger, generation tasks, reservations/captures/releases or provider usage ledger. Current public endpoints focus on `quote-requests`; no complete generation API is present in the reviewed `server/app.ts`.

**Work:**
- Approve the exact first free capability before granting a credit. A “free video” promise is unsafe until a real, affordable video workflow is verified. If only an image or operator-assisted workflow is available, label it accurately.
- Implement D1 tables for entitlements, usage transactions, generation tasks, provider attempts and idempotency/reconciliation, with uniqueness constraints and foreign keys.
- Grant the initial entitlement once per verified Clerk customer using a database-enforced idempotency key.
- Reserve usage atomically before provider submission; capture only on successful validated output; release/restore on eligible failure.
- Enforce server-side limits, concurrency, output limits, provider budget caps and an emergency kill switch.
- Keep generated assets private and customer-scoped.

**Acceptance:** Duplicate/concurrent signup or task requests cannot double-grant or overspend; failed tasks follow a tested restore policy; balances reconcile to the immutable ledger.

### P1 — Required before a controlled public launch

#### P1.1 — Embrilo OS connector is implemented as a client but not configured/verified
**Evidence:** `server/lib/connector.ts` implements HMAC v1; README records `OS_CONNECTOR_URL` and `CONNECTOR_HMAC_SECRET` as not configured. The quote flow can persist a request while OS sync remains `not_configured` or `failed`.

**Work:** Configure matching server-side connector credentials and key ID in the correct Cloudflare environment; verify the OS endpoint contract, timestamp/nonce replay defense, idempotency and customer capability-token handling. Add safe retry/reconciliation and operator visibility. Do not expose OS credentials or customer tokens to the browser.

**Acceptance:** One real request reaches the correct OS tenant exactly once; retry does not duplicate work; status can be read by its owner only.

#### P1.2 — AI provider and private output pipeline are not production-proven
**Evidence:** Blueprint 37 explicitly says no provider is approved/production-verified and says Genspark should remain operator-assisted unless an official supported API is verified. The reviewed app does not establish an end-to-end provider → validation → private R2 → customer download path.

**Work:** Evaluate provider terms, official API access, actual cost, commercial rights, privacy, moderation and failure behavior. If no viable API is available, launch a clearly labelled operator-assisted pilot. Add private R2 storage, file validation, short-lived customer-bound delivery and SSRF-safe retrieval only when a provider is chosen.

**Acceptance:** A real supported task can be submitted, tracked, reviewed and delivered privately to the correct customer, with measured cost and safe failure handling.

#### P1.3 — Customer authentication policy must match product decision
**Evidence:** Current UI uses Clerk's hosted `<SignIn>`; README describes email + Google. The user's current product preference is Google sign-up only. Source review cannot prove the Clerk dashboard's enabled methods.

**Work:** Verify the Production Clerk dashboard and hosted UI expose only the approved sign-in methods. If Google-only is still the locked requirement, disable email/password or email-code sign-up as appropriate in Clerk and remove contradictory UI/docs. Do not modify the already-working Production instance without checking the current setting first.

**Acceptance:** New customer can register/sign in through Google; unsupported methods are not offered; server still verifies every protected request.

#### P1.4 — Privacy, terms and customer operations are not launch-final
**Evidence:** README marks privacy and terms as drafts; docs require legal review. Retention, deletion, support contact, refund/cancellation rules and customer-facing capability terms need final decisions.

**Work:** Finalize Indonesian privacy notice and terms; document AI/provider processing, file retention/deletion, support contact, complaint handling, output rights, content restrictions, refund/credit restoration and pilot limitations. Keep internal notes and provider logs private.

**Acceptance:** Customer sees accurate terms before submission/generation and consent version is stored with the relevant transaction.

### P2 — After core workflow works

- Add customer dashboard for entitlements, task history, status, private outputs and usage history.
- Add operator/admin workflow for reviewing requests, retrying failed OS sync, approving outputs and handling customer support.
- Add monitoring/alerts for API errors, connector failures, stuck tasks, provider spend, abuse and D1 capacity.
- Add funnel analytics with privacy minimization and no sensitive prompt/token logging.
- Add verified checkout and paid credits only after price/cost validation and Duitku credentials are confirmed. Keep `PAYMENTS_ENABLED=false` until then.
- Add account deletion/export and retention automation.

## 3. Current code facts vs runtime facts

| Area | Repository evidence | Runtime status |
|---|---|---|
| Clerk | Tracked config still contains `pk_test`; owner confirms Production is configured | Must verify deployed Pages variables and real login |
| Custom domain/DNS | Old README describes prior blocker | Owner confirms completed; do not redo |
| Pages Functions/Hono | Present in source | Deployment health not verified by source alone |
| D1 | Binding absent in tracked `wrangler.jsonc` | Must inspect actual Pages binding and D1 inventory |
| Quote intake | Server route and tests present | Depends on production D1 and Clerk env |
| OS HMAC | Client code present | Not configured per tracked docs; runtime check required |
| Credits/freemium | Blueprint only; missing from current migration/API | Not implemented in reviewed source |
| AI generation | Provider adapter proposal only | No production provider verified |
| R2 private delivery | Design requirement only in reviewed files | Not verified |
| Duitku | Adapter/callback code exists; kill switch false | Checkout intentionally disabled |

## 4. Recommended execution sequence

1. **Production configuration reconciliation:** align repo and Pages Clerk settings with the already-live Production Clerk instance; do not touch DNS unless verification finds a concrete issue.
2. **D1 capacity and binding:** identify a safe database path, bind it, apply migrations and prove persistence.
3. **Product scope lock:** choose the first free capability (video/image/operator-assisted) based on an actual provider/workflow and cost.
4. **Freemium backend:** implement entitlement grant, immutable usage ledger, task state machine, reservation/capture/release, idempotency and abuse controls.
5. **Provider/OS execution:** configure the OS connector or selected official provider; build private R2 delivery and owner-scoped status.
6. **Customer UX:** onboarding, Google-only auth if confirmed, free-use indicator, generation form, progress, history and result.
7. **Launch gates:** privacy/terms, monitoring, cost caps, cross-customer tests, failure/retry tests and production smoke tests.
8. **Payments later:** keep Duitku disabled until merchant credentials, offer price and reconciliation tests are verified.

## 5. Explicit non-actions in this audit

- No Clerk instance switch or re-creation.
- No Clerk DNS/CNAME edits.
- No Cloudflare nameserver or unrelated DNS changes.
- No production secret changes.
- No Duitku activation or paid resource purchase.
- No claim that production runtime tests passed.

## 6. Definition of done for the next release

A new customer signs in with the approved Production Clerk method, receives exactly one eligible free entitlement, submits one supported generation task, sees its real status, receives a private result, and cannot access another customer's task or asset. Usage is auditable, provider cost is capped, retries are idempotent, failures restore usage according to policy, and the customer-facing privacy/terms accurately describe the workflow.
