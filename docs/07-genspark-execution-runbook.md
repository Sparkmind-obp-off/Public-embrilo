# Genspark Execution Runbook — Public App

## Before starting
- Read `prompts/master-system-prompt.md` and docs 00–06.
- Audit repository, branch, code, scripts, tests and deployment setup.
- Confirm whether the internal connector is genuinely available.
- Keep demo data synthetic and clearly labeled.

## Execution checkpoints
1. **Brochure:** responsive landing, services, process, examples, FAQ, privacy and terms.
2. **Brief intake:** validated form, consent, idempotency and safe confirmation.
3. **Connector:** server-side only; use the versioned internal contract.
4. **Customer access:** secure status and approved-delivery access; no access based on reference alone.
5. **Quality:** run build/tests and test duplicates, invalid data, connector outage, cross-customer access and unapproved assets.
6. **Deployment:** deploy only to the confirmed authorized project, then verify the URL and health.

## Rules
- No fabricated pricing, reviews, guarantees or production claims.
- No internal prompts, operator notes, private output or secrets in public bundles.
- Never call demo mode a live integration.
- Do not accept uploads until private storage and authorization are implemented.
- Never claim a deployment or test passed without evidence.

## Handoff checklist
- [ ] Mobile/desktop responsive
- [ ] Accessible form and validation
- [ ] Accurate Bahasa Indonesia copy
- [ ] Server-side connector only
- [ ] Customer ownership checks
- [ ] Approved deliverables only
- [ ] Privacy/terms reviewed or clearly flagged
- [ ] Build/test results recorded
- [ ] Deployment verified or explicitly pending