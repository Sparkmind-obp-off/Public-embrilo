# 35 — Authentication: Clerk + Google Sign-In
Status: proposed integration; not configured or verified by this document. Date: 2026-10-29.

## Decision
Use Clerk as the initial identity provider for customer authentication, with:
- email sign-up/sign-in and verification;
- Google Sign-In through Clerk's supported social connection;
- secure session handling appropriate to the existing React/Vite frontend and Hono backend.

Google Sign-In is provided through Clerk configuration; Embrilo must not build its own OAuth implementation unless there is a documented reason to change providers.

## Trust boundaries
- Frontend session state is for UI only and is not authorization proof by itself.
- Hono API must validate Clerk session/JWT using Clerk's supported server-side verification method and expected issuer/audience/authorized-party rules where applicable.
- Protected endpoints must fail closed when token verification fails.
- Never trust customer_id, email, plan, credit balance or role sent by the browser.
- Resolve the verified Clerk subject to an internal customer ID in D1.
- Keep Clerk secret keys and webhook signing secrets in server-side secrets only; publishable keys may be in the frontend as documented by Clerk.
- Do not log session tokens, OAuth codes, secrets, full authorization headers or sensitive profile payloads.

## Minimum internal data
Suggested tables/fields:
- customers: id (internal stable ID), clerk_user_id (unique), primary_email, email_verified_at, created_at, updated_at, status.
- customer_auth_events (optional, minimized): event type, timestamp, result and safe request metadata.
- identity_link_events (optional): provider identifier and result without storing OAuth tokens.
Email is contact data, not the primary key. A customer may change their email without losing credits or task history.

## Google connection setup checklist
1. Create/choose the correct Clerk application for Embrilo environment.
2. Configure Google as a social connection using current Clerk instructions.
3. Set the exact authorized redirect URI supplied by Clerk in the Google Cloud project.
4. Configure allowed origins and production domains, including preview/staging separately.
5. Configure Clerk publishable key in the frontend environment and secret key in Cloudflare server-side secrets.
6. Verify email and Google flows on local/staging before production.
7. Test sign-out, expired sessions, invalid tokens, user deletion/deactivation, and account-linking edge cases.
8. Document account deletion and data retention behavior.

Do not invent redirect URIs. Copy the exact values shown by the configured Clerk project and Google Cloud console.

## Webhooks
If Clerk webhooks are used:
- Verify webhook signatures using the official SDK/recommended method.
- Handle retries and duplicate event IDs idempotently.
- Use webhooks for synchronization or cleanup, not as the sole authorization check on each API request.
- Store only required user fields.
- Define behavior when webhook delivery is delayed.

## Abuse and privacy
- Require a verified email before granting trial credits.
- Rate-limit sign-up, task creation and verification resend.
- Avoid fingerprinting or intrusive tracking unless separately justified and disclosed.
- Account creation must not automatically subscribe the customer to marketing email. Use explicit, separate consent.
- Provide a way to request account deletion; explain legal/financial records that may need retention.
- Consider multiple accounts and provider abuse, but do not claim email verification alone prevents abuse.

## Acceptance tests
- Valid email session can call protected API.
- Valid Google session can call protected API.
- Invalid, expired, wrong-issuer or missing token is rejected.
- User A cannot read or mutate user B's data by changing an ID.
- Repeated login does not duplicate customer records or free entitlements.
- Email changes preserve internal customer identity.
- Secrets are absent from client bundles, source control and logs.

## Release gate
Google Sign-In is not considered live until the actual Clerk and Google configuration is present and tested on the intended production domain.