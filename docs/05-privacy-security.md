# 05 — Privacy and Security

## Transparency
Before submission explain what is collected, why, that AI tools may process the brief, whether files/references go to an external provider, retention/deletion options and support contact. Review privacy and terms before accepting real customer data.

## Authorization
Status and delivery require customer-bound authorization. Never authorize by sequential ID or unprotected reference. Never trust customer ID from request body. Server-side checks for every resource. No privileged D1/R2 access from browser.

## Content/file safety
Collect only necessary data. Ask customers to confirm asset rights. Treat text, URLs and files as untrusted. Avoid arbitrary server-side URL fetching without SSRF protections. Validate type/size and store files privately. Never request passwords, cookies or OTPs.

## Delivery
Only approved assets visible; short-lived downloads; no public bucket listing; customer pages not indexed; sensitive pages not cached publicly; errors must not leak another customer's existence.

## Legal review
This is product/security guidance, not legal advice. Have Indonesian privacy, consumer and contract language reviewed before production. Do not claim certification or legal compliance without assessment.