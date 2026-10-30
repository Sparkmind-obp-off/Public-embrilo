# Embrilo — Audit Addendum: Production OAuth and deployment verification
**Date:** 2026-10-30  
**Repository:** `Sparkmind-obp-off/Public-embrilo`  
**Production Pages project:** `embrilo-public`  
**Latest observed deployment:** `12826633-9995-4d9a-ae1d-c3bcd98a153a`  
**Deployment commit:** `e0449bd2cf630d439cfaa99e0e8069126a3270eb`

This addendum supersedes outdated runtime assumptions in `09-audit-review-2026-10-30.md` where noted below.

## 1. Verified current Cloudflare production state

Read-only inspection of Cloudflare Pages deployment metadata returned:

- Latest production deployment `12826633`, created 2026-10-30 08:17:23 UTC; deploy stage **success**.
- Branch `main`, commit `e0449bd2cf630d439cfaa99e0e8069126a3270eb`.
- Alias includes `https://embrilo.biz.id`.
- `APP_ENV=production`.
- `CLERK_PUBLISHABLE_KEY` is a `pk_live_` key (value deliberately not reproduced here).
- `CLERK_AUTHORIZED_PARTIES` contains `https://embrilo-public.pages.dev` and `https://embrilo.biz.id`.
- Production D1 binding `DB` is attached to database ID `39b023c1-8ba6-4473-9f2d-584f7c8ee293`.
- `PAYMENTS_ENABLED=false`; Duitku remains disabled.
- The Cloudflare API marks the latest deployment's `commit_dirty=true`. This metadata should be investigated: confirm the deployed artifact corresponds exactly to the reviewed Git commit and that no untracked/local modifications were included.

Secret values are intentionally hidden by Cloudflare and were not read or exposed. Metadata confirms a secret slot exists; it does not prove that the Clerk secret is correct or that API verification works.

## 2. Corrections to the earlier audit

The previous audit document said D1 was not wired and tracked configuration still used a test Clerk key. Those statements described the older repository snapshot and are **no longer true for the current observed production deployment**:

- D1 is attached to the latest Pages production deployment.
- The deployed publishable key is `pk_live_`.
- The latest deployment is on the custom domain alias `embrilo.biz.id`.

The user has confirmed Clerk Production and its custom domain/DNS setup are complete. Do not redo DNS or change Clerk instance.

## 3. Google OAuth blocker — external Google Cloud Console action

The user-provided production browser diagnostic reports:

```
Error 400: redirect_uri_mismatch
client_id: 723131203743-pi4tlspo4v3lf6hqs2gpn03fggs7i3iv.apps.googleusercontent.com
redirect_uri: https://embrilo-public.pages.dev/__clerk/v1/oauth_callback
```

This is consistent with Google rejecting a redirect URI that is not registered on the exact OAuth 2.0 Client ID used by Clerk. It is not fixed by changing the website's sign-in button, route, Pages proxy, or deploying the same code again.

**Required operator action in Google Cloud Console:**
1. Open APIs & Services → Credentials in the Google Cloud project that owns the OAuth client.
2. Locate the OAuth 2.0 Client ID and compare the complete ID with the ID shown in Clerk's Google SSO connection. Do not rely on the display name.
3. Under Authorized redirect URIs, add the exact callback reported by Google:
   `https://embrilo-public.pages.dev/__clerk/v1/oauth_callback`
4. Add the authorized JavaScript origin only if required by the Clerk integration's current setup/instructions:
   `https://embrilo-public.pages.dev`
5. Save and allow for propagation, then retest Google sign-in.
6. Check OAuth consent-screen publishing status and test-user restrictions only if Google presents an access/test-user error after redirect mismatch is resolved. Do not blindly publish an app or change audience settings.

Do not add a guessed `clerk.embrilo.biz.id` callback. Use the exact redirect URI shown in the live Google error and the exact client ID used by Clerk. If Clerk's Google connection is changed to a different client, re-read its callback instructions before editing Google Cloud.

**Important:** No Google Cloud Console OAuth credential-editing connector is available in the connected MCP tools inspected for this audit. The available Google Ads connector is not Google Cloud Console and must not be used to change OAuth credentials. This step therefore remains a manual Google Cloud Console action.

## 4. Latest application/deployment status

GitHub history confirms:
- `cc9ed903`: production Clerk FAPI proxy and D1 production binding implementation.
- `020eb7e`: fix to Clerk `verifyToken` return-shape handling, with six additional tests for real RS256 token verification.
- `e0449bd`: in-app `/daftar`, onboarding/service categories, and Clerk sign-up link correction.

Cloudflare reports the `e0449bd` production deployment succeeded. This verifies deployment metadata, not the full interactive browser journey. The Google OAuth failure remains a live external configuration blocker per the supplied browser report.

## 5. Remaining work — revised priorities

### P0 — Google OAuth
- Register the exact redirect URI on the exact OAuth client used by Clerk.
- Retest new Google registration and existing Google login on `https://embrilo.biz.id`.
- Test cancellation/back navigation and logout.
- If it still fails, capture the new Google error and compare the actual client ID and redirect URI again.

### P0 — Runtime auth and database smoke tests
- Verify the production Clerk secret matches the Production instance without exposing it.
- Verify session-protected API returns success for a real authenticated user and rejects unauthenticated requests.
- Verify D1 writes/reads, idempotent brief submission, customer isolation, and persistence.
- Verify the canonical custom domain and Pages preview hostname behavior separately.

### P1 — Signup policy
- Product requirement previously stated Google-only signup. The supplied report says email code is also exposed on `/daftar`. Confirm the intended policy before changing Clerk settings or removing email UI. If Google-only remains locked, align the production Clerk dashboard and UI.

### P1 — Deployment provenance
- Investigate `commit_dirty=true` on deployment `12826633`. Establish whether Cloudflare's ad-hoc deploy metadata is expected for this deployment method. Record the exact source artifact/commit provenance.

### P1 — Embrilo OS and generation
- Configure and verify the OS HMAC connector.
- Implement the freemium entitlement/credit ledger and task state machine.
- Select and verify an AI generation provider or explicitly label the initial workflow as operator-assisted.
- Implement private R2 output delivery and customer-scoped authorization.

### P2 — Payments and hardening
- Keep Duitku disabled until production credentials are safely rotated, verified and explicitly approved for activation.
- Rotate any Clerk/Duitku credentials that were exposed in files or messages. Do not ask the user to paste secrets into chat.
- Complete legal terms/privacy, monitoring, abuse controls and customer account lifecycle.

## 6. Safety / non-actions
- No DNS changes.
- No Clerk instance changes.
- No Google Cloud OAuth changes (no suitable authenticated Google Cloud tool was available).
- No secret values read, printed, or changed.
- No Duitku activation.
- No production deployment initiated by this addendum.
