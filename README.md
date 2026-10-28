# Embrilo — Public Layer

The public-facing Embrilo website is developed separately from Embrilo OS internal operations.

## Current frontend
A responsive Vite + React + TypeScript landing page with an Indonesian-first editorial design:
- Service overview, process explanation, and FAQ accordion
- Responsive mobile navigation and clear calls to action
- Initial brief form interface with client-side required-field validation
- Accessible labels, focus states, reduced-motion support, and responsive layouts
- Honest product boundaries: AI-assisted with human review; no promises of reach or sales

## Run locally
```bash
npm install
npm run dev
npm run build
npm run preview
```

## Cloudflare Pages build settings
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

These settings are recommendations; a live Cloudflare Pages deployment has not been verified from this repository update.

## Documentation
- `docs/00-source-of-truth.md`
- `docs/01-market-research-positioning.md`
- `docs/02-public-web-architecture.md`
- `docs/03-information-architecture-uiux.md`
- `docs/04-public-api-contract.md`
- `docs/05-privacy-security.md`
- `docs/06-mvp-roadmap.md`
- `docs/07-genspark-execution-runbook.md`
- `docs/08-premium-ui-system.md`

## Important current limitation
The brief form is a frontend prototype only. It validates required fields in the browser but does not submit, persist, or send customer data anywhere. Do not treat it as an active intake channel until the authenticated public API and private OS connector are implemented and tested.

## Security boundary
Keep the public website and Embrilo OS as separate trust boundaries. Never expose internal master prompts, provider credentials, admin controls, private customer records, or direct privileged database access to the browser. Public request and delivery features must use a narrow authenticated server-side API contract.