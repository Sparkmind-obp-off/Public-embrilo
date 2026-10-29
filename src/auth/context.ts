import { createContext, useContext } from "react";

/**
 * UI-only auth state. It is never authorization: every API call sends the Clerk
 * session token and the server verifies it (server/lib/auth.ts).
 */
export type AuthState =
  | { status: "disabled" }
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "signed_in"; email: string | null; getToken: () => Promise<string | null>; signOut: () => Promise<void> };

export const AuthContext = createContext<AuthState>({ status: "disabled" });
export const useAuthState = () => useContext(AuthContext);
