# Public Embrilo — Premium UI/UX System

This is the design contract for the customer-facing product. It applies to the actual public app implementation, not only to mockups or documentation.

## Brand and visual direction

Create a premium, modern, elegant, trustworthy Indonesian service brand. The visual language should feel editorial and carefully art-directed rather than a generic AI landing-page template.

- Base: warm ivory / soft neutral canvas, deep ink typography, restrained forest-green primary, a subtle fresh-lime accent, clean white surfaces.
- Use large but controlled typography, clear hierarchy, comfortable line lengths, generous whitespace, crisp grids, subtle borders, restrained shadows and carefully chosen imagery/illustrations only where they explain the service.
- Avoid generic purple AI gradients, excessive glass cards, glowing orbs, emoji-as-icons, stock dashboard mockups, fake testimonials, fake logos, invented statistics, and over-animated sections.
- Use consistent tokens for color, spacing, radius, type, shadow, focus and motion.
- The first viewport must explain the value, audience and primary next step immediately.

## Public journey

1. **Home** — state the value proposition in plain Indonesian; show what customers receive; one primary CTA to start a brief; a calm, credible explanation of human review.
2. **Services** — service cards with concrete deliverables and scope. Do not publish invented prices or delivery guarantees.
3. **How it works** — Brief → structured prompt and production → human quality review → approved delivery. Clearly distinguish automated from manual-assisted steps.
4. **Examples** — show only approved examples or visibly labeled illustrative examples. Never imply a sample is a real customer outcome.
5. **Brief form** — a guided multi-section form with progress, concise helper text, validation, review-before-submit and clear consent. Do not make it feel like an intimidating long spreadsheet.
6. **Request receipt/status** — confirmation only after Internal Embrilo actually accepts the request; show reference, next step and secure status access.
7. **Result/revision** — display only customer-owned approved deliverables; clearly label file type, size, expiry and revision eligibility.
8. **FAQ / privacy / terms** — concise and readable. Flag unresolved legal wording for review instead of claiming compliance.

## Interaction and accessibility

- Mobile-first at 320px; responsive tablet and desktop layouts.
- Keyboard-accessible navigation and forms; visible focus; semantic headings; accessible labels and errors; sufficient contrast; reduced motion.
- Loading, empty, success, validation, connector-unavailable and retry states must be designed, not left as browser defaults.
- Preserve input on recoverable errors. Prevent duplicate order submissions with an idempotency key.
- No fake disabled buttons, dead links, placeholder lorem ipsum or controls that imply unavailable functionality.
- Do not expose internal IDs, operator notes, prompts, logs, tokens, stack traces or unapproved assets.

## Architecture contract

- Public and Internal remain separate repos and deployments.
- Browser → Public server endpoint → authenticated, versioned Internal connector. Never browser → Internal API directly.
- Keep HMAC secret and customer capability token server-side; store the Internal customer token in the Public server's configured database, bound to the request/customer.
- A public reference alone is never authentication. Every status, revision and deliverable request must prove customer ownership.
- If connector configuration is missing, show an honest service-unavailable state. Never silently pretend the order was submitted.
- Do not add paid dependencies/services without authorization.

## Definition of done

- [ ] All required routes render real responsive pages, not a static one-screen mockup.
- [ ] One coherent design system is reused across every route.
- [ ] Brief form is accessible, validates fields and prevents duplicate submissions.
- [ ] Success only appears after a confirmed 201 or idempotent replay response from Internal.
- [ ] Customer status and deliverables are customer-scoped and secure.
- [ ] Cross-customer access, duplicate submit, connector failure and unapproved delivery tests pass.
- [ ] No fake testimonials, prices, guarantees or performance claims.
- [ ] Actual build/tests and visual review are recorded.
- [ ] Deployment is reported only after the live URL is independently smoke-tested.
