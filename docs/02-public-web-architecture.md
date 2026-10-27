# 02 — Public Web Architecture

## Suggested MVP stack
TypeScript, Vite + React for interactive UI, Hono for server/API routes where needed, Cloudflare Workers/Pages for deployment, and an authenticated connector to internal operations. Choose one deployment pattern and document it; do not duplicate runtimes unnecessarily.

Cloudflare's web-app guidance describes Workers, D1, R2 and Queues as composable building blocks: https://developers.cloudflare.com/use-cases/web-apps/
Storage options: https://developers.cloudflare.com/workers/platform/storage-options/

## Routes
- / — landing page
- /layanan — service catalog
- /cara-kerja — process
- /contoh — approved examples only
- /brief — intake form
- /permintaan/:ref — protected request status
- /hasil/:ref — protected delivery
- /faq, /privasi, /ketentuan — support and legal information

No public admin console. Do not put internal prompts or provider keys in client bundles.

## API proposal
POST /v1/public/requests
GET /v1/public/requests/{ref}
GET /v1/public/requests/{ref}/deliverables
POST /v1/public/requests/{ref}/revisions
These routes are proposals, not deployed endpoints.

## Frontend rules
Mobile-first, accessible forms; client and server validation; idempotency for submissions; no secrets in Vite client variables; no sensitive tokens in analytics/logs. Do not accept file uploads until a private, authorized asset path exists.

## SEO/performance
Unique page title/description, semantic headings, accessible contrast, alt text, canonical URLs, fast landing page, accurate structured data, and no fabricated reviews. Track only necessary aggregate funnel events.

## Deployment separation
Public repo deploys independently from Internal repo with separate environment variables and secrets. Public app calls the connector server-side. Never connect the browser directly to privileged D1/R2 resources.