# 30 — Production Operations & Quality
Flow: intake → scope/payment/authorization check → brief completeness → clarification → queue → production prompt → operator runs approved tool → version outputs → QC → rework/revision → private delivery → notification → completion/feedback and separate showcase permission.

Genspark is operator-assisted initially: OS prepares prompt; operator runs Genspark UI, reviews output and registers assets. Do not claim API automation until official support and working integration are verified.

## QC
Matches scope; count/format/dimensions/language correct; files open; usable/readable; facts supported; no obvious artifacts; no unauthorized material/private-data leak; versions/names correct; instructions clear. States: not_checked, pass, rework_required, blocked.

## Revision definitions
Revision = in-scope change; clarification = missing info; rework = correction against agreed criteria; scope change = material change in goal/quantity/format/audience/requirements. Record eligibility, owner, version and resolution. Out-of-scope requires approval/new quote.

## Delivery
Private storage; customer authorization; expiring signed URL when appropriate; MIME/size/checksum/version; isolation tests; usage notes.

Measure queue, production, QC/rework, customer-wait time, on-time rate, revisions/order, failures, operator minutes and tool costs. Do not promise SLA before evidence.