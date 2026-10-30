import { clerkFrontendApiProxy } from "@clerk/backend/proxy";
import type { Env } from "../../server/env";

/**
 * Clerk Frontend API proxy (official helper; https://clerk.com/docs/guides/dashboard/dns-domains/proxy-fapi).
 * Used because the production domain (pages.dev) cannot host Clerk's CNAME records.
 * The secret key is added server-side by the helper and never reaches the browser.
 */
export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.CLERK_SECRET_KEY || !env.CLERK_PUBLISHABLE_KEY?.startsWith("pk_live_")) {
    return new Response(JSON.stringify({ errors: [{ code: "proxy_not_configured" }] }), {
      status: 404,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  return clerkFrontendApiProxy(request, {
    proxyPath: "/__clerk",
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY,
  });
};
