import { lazy, Suspense, type ReactNode } from "react";
import { AuthContext } from "./context";
import { useConfig } from "../lib/config";
import { useRouter } from "../lib/router";

const ClerkShell = lazy(() => import("./ClerkShell"));

/** Routes that need identity. Clerk is only downloaded on these pages. */
export const AUTH_ROUTE = /^\/(akun|masuk|brief)(\/|$)/;

export function AuthBoundary({ children }: { children: ReactNode }) {
  const { path } = useRouter();
  const needsAuth = AUTH_ROUTE.test(path);
  const config = useConfig(needsAuth);

  if (!needsAuth) return <>{children}</>;
  if (!config) return <AuthContext.Provider value={{ status: "loading" }}>{children}</AuthContext.Provider>;
  if (!config.clerk_publishable_key) return <AuthContext.Provider value={{ status: "disabled" }}>{children}</AuthContext.Provider>;

  return (
    <Suspense fallback={<AuthContext.Provider value={{ status: "loading" }}>{children}</AuthContext.Provider>}>
      <ClerkShell publishableKey={config.clerk_publishable_key}>{children}</ClerkShell>
    </Suspense>
  );
}
