import { useMemo, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { idID } from "@clerk/localizations";
import { AuthContext, type AuthState } from "./context";

const appearance = {
  variables: {
    colorPrimary: "#1f4d3a",
    colorText: "#15201b",
    colorTextSecondary: "#3d4943",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    borderRadius: "12px",
    fontFamily: '"Manrope Variable", "Manrope Fallback", Arial, sans-serif',
  },
};

function Bridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();

  const value = useMemo<AuthState>(() => {
    if (!isLoaded) return { status: "loading" };
    if (!isSignedIn) return { status: "signed_out" };
    return {
      status: "signed_in",
      email: user?.primaryEmailAddress?.emailAddress ?? null,
      firstName: user?.firstName ?? null,
      getToken: () => getToken(),
      signOut: () => clerk.signOut({ redirectUrl: "/" }),
    };
  }, [isLoaded, isSignedIn, user, getToken, clerk]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default function ClerkShell({ publishableKey, proxyUrl, children }: { publishableKey: string; proxyUrl?: string | null; children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      proxyUrl={proxyUrl ?? undefined}
      localization={idID}
      appearance={appearance}
      afterSignOutUrl="/"
      // Clerk's default points at the hosted Account Portal (accounts.<domain>), which cannot
      // exist on pages.dev (404 "Deployment Not Found"). Keep every auth screen in-app.
      signInUrl="/masuk"
      signUpUrl="/daftar"
      telemetry={false}
    >
      <Bridge>{children}</Bridge>
    </ClerkProvider>
  );
}

const panelAppearance = {
  elements: {
    rootBox: { width: "100%" },
    cardBox: { width: "100%", maxWidth: "440px", boxShadow: "none" },
    // The page already provides the h1; Clerk's own header would duplicate it.
    header: { display: "none" },
  },
};

const withNext = (path: string, next: string) => (next && next !== "/akun" ? `${path}?next=${encodeURIComponent(next)}` : path);

/** Clerk sign-in UI (Google via Clerk social connection, or email + verified code). */
export function SignInPanel({ redirectUrl }: { redirectUrl: string }) {
  return (
    <SignIn
      routing="hash"
      forceRedirectUrl={redirectUrl}
      signUpForceRedirectUrl={redirectUrl}
      signUpUrl={withNext("/daftar", redirectUrl)}
      appearance={panelAppearance}
    />
  );
}

/** Clerk sign-up UI. New accounts land on the onboarding view in /akun. */
export function SignUpPanel({ redirectUrl }: { redirectUrl: string }) {
  return (
    <SignUp
      routing="hash"
      forceRedirectUrl={redirectUrl}
      signInForceRedirectUrl={redirectUrl}
      signInUrl={withNext("/masuk", redirectUrl)}
      appearance={panelAppearance}
    />
  );
}
