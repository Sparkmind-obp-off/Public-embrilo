import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { AuthContext } from "./context";
import { useConfig } from "../lib/config";
import { useRouter } from "../lib/router";

const ClerkShell = lazy(() => import("./ClerkShell"));

/** Routes that need identity. Clerk is only downloaded on these pages. */
export const AUTH_ROUTE = /^\/(akun|masuk|daftar|brief)(\/|$)/;

export function AuthBoundary({ children }: { children: ReactNode }) {
  const { path } = useRouter();
  const needsAuth = AUTH_ROUTE.test(path);
  const config = useConfig(needsAuth);

  // Clerk production is bound to one domain. On other origins (e.g. embrilo.biz.id) send
  // account pages to the canonical origin instead of showing a broken sign-in.
  const canonical = config?.canonical_origin;
  const offCanonical = Boolean(needsAuth && config?.clerk_proxy_url && canonical && window.location.origin !== canonical);
  useEffect(() => {
    if (offCanonical && canonical) window.location.replace(`${canonical}${window.location.pathname}${window.location.search}`);
  }, [offCanonical, canonical]);

  if (!needsAuth) return <>{children}</>;
  if (offCanonical) return <AuthContext.Provider value={{ status: "loading" }}>{children}</AuthContext.Provider>;
  if (!config) return <AuthContext.Provider value={{ status: "loading" }}>{children}</AuthContext.Provider>;
  if (!config.clerk_publishable_key) return <AuthContext.Provider value={{ status: "disabled" }}>{children}</AuthContext.Provider>;

  return (
    <Suspense fallback={<AuthContext.Provider value={{ status: "loading" }}>{children}</AuthContext.Provider>}>
      <ClerkShell publishableKey={config.clerk_publishable_key} proxyUrl={config.clerk_proxy_url}>
        {children}
      </ClerkShell>
    </Suspense>
  );
}
