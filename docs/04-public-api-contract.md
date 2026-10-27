# 04 — Public API Contract

These are proposed contracts, not live endpoints.

## Submit request
POST /v1/public/requests
Headers: Content-Type: application/json; Idempotency-Key: random unique key.
Body fields: service_code, product_description, objective, audience, platforms, language, tone, CTA, verified_facts, constraints, rights_confirmed, ai_processing_acknowledged.
Response: 202 Accepted with request_ref and customer-safe status. Never return internal database IDs or secrets.

## Status
GET /v1/public/requests/{ref} requires a customer-bound session or secure expiring access token. A reference alone is not authorization.

## Deliverables
GET /v1/public/requests/{ref}/deliverables returns approved assets owned by the authorized customer only. Links expire and should not be indexed.

## Revisions
POST /v1/public/requests/{ref}/revisions checks ownership, revision policy, deadline and input length.

## Connector requirements
Public app calls connector server-side. Connector validates schema, auth, rate limits, idempotency and allowed service codes. Browser never receives internal service token.

## Errors
400 invalid input; 401 unauthenticated; 403 unauthorized; 404 unknown resource; 409 conflict; 429 rate limited; 503 connector unavailable. Return safe messages plus correlation ID, never stack traces.

## Tests
Valid submit, invalid schema, duplicate submit, expired token, cross-customer denial, unapproved asset denial, revision limit, connector timeout and retry behavior.