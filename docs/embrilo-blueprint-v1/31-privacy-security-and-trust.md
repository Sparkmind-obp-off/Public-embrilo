# 31 — Privacy, Security & Trust
Design baseline, not legal advice. Privacy/terms must match actual implementation before real customer data is collected.

## Data classes
Public (service and approved showcase); internal (procedures/prompts/job notes); customer-confidential (brief/assets/deliverables); secrets (keys, payment credentials, signing keys, tokens). Secrets never in frontend, source control or logs.

## Controls
Minimize data; server validation; per-order authorization; authenticated connector; rate limits; replay protection/idempotency; least privilege and key rotation; sanitized logs; backups/recovery; separate public showcase/private delivery storage.

Payment uses approved provider checkout. Verify callback authenticity, amount, currency and reference; reconcile provider state. Browser redirect does not prove payment.

Before sending customer content to third-party production tools, review current terms/privacy settings and authorization. Do not promise deletion/confidentiality beyond what tools support. Customer work is not public showcase or unrelated training by default.

Privacy notice: operator identity, data/purpose, processors/transfers, retention, access/correction/deletion, exceptions, contact/effective date.
Terms: scope, responsibilities, payment/timeline, revisions/scope change, cancellation/refund, IP/use rights, third-party limitations, acceptable use, delivery/acceptance, support/disputes.

Launch gate: legal pages match real flows; authorization tested; storage private; support owner assigned.