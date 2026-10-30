import { useMemo, type ReactNode } from "react";
import { ClerkProvider, SignIn, useAuth, useClerk, useUser } from "@clerk/clerk-react";
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
      telemetry={false}
    >
      <Bridge>{children}</Bridge>
    </ClerkProvider>
  );
}

/** Clerk's hosted sign-in/up UI (email + verified code, Google via Clerk social connection). */
export function SignInPanel({ redirectUrl }: { redirectUrl: string }) {
  return (
    <SignIn
      routing="hash"
      forceRedirectUrl={redirectUrl}
      signUpForceRedirectUrl={redirectUrl}
      appearance={{
        elements: {
          rootBox: { width: "100%" },
          cardBox: { width: "100%", maxWidth: "440px", boxShadow: "none" },
          // The page already provides the h1; Clerk's own header would duplicate it.
          header: { display: "none" },
        },
      }}
    />
  );
}
