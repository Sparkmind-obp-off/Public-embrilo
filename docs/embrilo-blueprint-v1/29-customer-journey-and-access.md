# 29 — Customer Journey & Access
## Guest-first
Browse/compare without account creation. Collect contact data only when needed. Recommend email magic-link or equivalent customer-bound access initially; Google Sign-In later if useful. WhatsApp can support communication but does not replace order/payment records or secure delivery.

## Fixed package
Discover → detail/scope/examples/price/timing/revisions/terms → choose package → brief → review → accept terms → submit → persist server-side snapshot → checkout → provider verification → authorized OS sync → status → QC → private delivery → eligible revision → completion/feedback.

## Custom quote
Request → scope review → written quote (deliverables, price, timeline, assumptions, revisions, validity) → explicit acceptance → order → agreed payment → fulfillment. Scope change needs approval/new quote.

## Access rules
Public reference is not secret. Tokens are unguessable, short-lived/revocable and purpose-bound. Rate-limit token requests. Check authorization for every order/deliverable. Expired/revoked tokens fail; customer A cannot access customer B. Avoid sensitive info in URLs/email subject.

## Status labels
Menunggu pembayaran; Pembayaran diverifikasi; Antrean produksi; Sedang dikerjakan; Pemeriksaan kualitas; Perlu informasi; Siap dikirim; Hasil dikirim; Selesai; Perlu bantuan.