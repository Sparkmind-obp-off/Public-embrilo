# 37 — AI Provider Adapter & Generation Capability Gates
Status: architecture proposal; no provider is approved or production-verified by this document. Date: 2026-10-29.

## Goal
Support video generation and visual asset generation without tightly coupling Embrilo's product, credits or customer history to one external provider.

## Provider adapter contract
Create an internal interface with operations appropriate to the chosen provider, such as:
- getCapabilities()
- estimateUsage(input)
- submitGeneration(input, idempotencyKey)
- getTaskStatus(providerTaskId)
- retrieveResult(providerTaskId)
- cancelTask(providerTaskId) only if supported
- verifyWebhook(request) only if supported
- normalizeError(error)
Not every provider supports every operation. Capability flags must describe actual provider behavior, not aspirational behavior.

## Provider evaluation
Before choosing a provider, document:
- official API availability and terms for the intended use;
- video vs image support, duration, resolution, aspect ratio and output limits;
- async job/status/result model and webhook/polling options;
- authentication, rate limits, reliability and region availability;
- cost per attempt and successful output, billing model, free tier limitations;
- data retention, training usage, privacy and moderation policy;
- commercial-use and output licensing terms;
- failure handling, refunds and support;
- whether a genuinely free test path exists and its limitations.
Use current official provider documentation and clearly label third-party research. Do not assume Genspark.ai has a public generation API. Until an official supported API is verified, Genspark remains an operator-assisted workflow.

## Product capability states
Expose each capability as one of:
- available: end-to-end production tested;
- limited_beta: works with known limits and a monitored operator workflow;
- waitlist: interest can be collected, generation not available;
- unavailable: not offered.
Do not let UI imply a capability is live merely because a button exists.

## Task lifecycle
Suggested states: queued, validating, submitted, processing, result_available, quality_review, succeeded, failed_retryable, failed_final, blocked_policy, cancelled, reconciliation_required.
Keep provider status mapped to internal states. Provider event callbacks must be authenticated if the provider supports signing, and idempotent.

## Result handling
- Validate result URL and source before fetching; prevent SSRF and arbitrary internal URL access.
- Prefer fetching results server-side using the provider's supported method, then storing outputs in private R2.
- Do not expose provider credentials or long-lived private source URLs to the browser.
- Enforce content-type, file-size, checksum and output-count limits.
- Generate expiring customer-bound download access only after authorization.
- Generated content remains private unless customer separately consents to showcase use.

## Cost and reliability
- Set provider budget and task concurrency limits before public trial.
- Record provider/model, task ID, attempts, estimated and actual cost where available, duration and safe error category.
- Use exponential backoff only for retryable failures; respect provider rate limits and idempotency.
- Avoid automatic retry loops that multiply charges.
- A timeout after submission must enter reconciliation rather than submit a second billable job without checking the first.

## Manual fallback
If no affordable official API is verified, use a clearly labelled operator-assisted pilot. Capture requests in the OS queue, generate with the authorized UI workflow, upload the result privately, and notify the customer through the supported channel. Do not automate scraping, browser sessions, or bypass provider controls.

## Release gate
A capability can be sold or advertised only after one successful end-to-end production-like test covers submission, task status, private result storage, customer access, credit accounting, failure restoration, cost measurement and terms compliance.