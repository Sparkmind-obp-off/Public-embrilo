/// <reference types="@cloudflare/workers-types" />

/** Cloudflare Pages Functions bindings for Public Embrilo. Secrets are set with `wrangler pages secret put`. */
export interface Env {
  DB?: D1Database;
  APP_ENV?: string;
  PUBLIC_BASE_URL?: string;

  // Clerk (publishable key is public by design; secret key is a server-side secret)
  CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  /** Optional PEM public key for networkless verification. Falls back to JWKS via secret key. */
  CLERK_JWT_KEY?: string;
  /** Comma-separated origins allowed as the token `azp`. Empty = fail closed. */
  CLERK_AUTHORIZED_PARTIES?: string;

  // Duitku Pop
  DUITKU_ENV?: "production" | "sandbox";
  DUITKU_MERCHANT_CODE?: string;
  DUITKU_API_KEY?: string;
  /** Kill switch: checkout is only offered when this is exactly "true". */
  PAYMENTS_ENABLED?: string;

  // Embrilo OS connector (server-to-server, HMAC v1)
  OS_CONNECTOR_URL?: string;
  CONNECTOR_KEY_ID?: string;
  CONNECTOR_HMAC_SECRET?: string;
}
