import { createClerkClient, verifyToken } from "@clerk/backend";
import type { Env } from "../env";
import { ApiError } from "./errors";
import { nowIso } from "./db";
import { newId } from "./crypto";

export interface VerifiedIdentity {
  clerkUserId: string;
}
export interface ClerkProfile {
  email: string | null;
  emailVerified: boolean;
}
export interface Customer {
  id: string;
  clerkUserId: string;
  email: string | null;
  emailVerified: boolean;
  status: "active" | "disabled";
}

export type SessionVerifier = (token: string, env: Env) => Promise<VerifiedIdentity | null>;
export type ProfileLookup = (clerkUserId: string, env: Env) => Promise<ClerkProfile | null>;

export const authorizedParties = (env: Env) =>
  (env.CLERK_AUTHORIZED_PARTIES ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

export const authConfigured = (env: Env) =>
  Boolean(env.CLERK_SECRET_KEY && env.CLERK_PUBLISHABLE_KEY && authorizedParties(env).length > 0);

/** Official Clerk server-side verification (signature, exp/nbf, issuer, azp). Fails closed. */
export const clerkSessionVerifier: SessionVerifier = async (token, env) => {
  if (!authConfigured(env)) throw new ApiError(503, "auth_not_configured", "Login belum aktif.");
  try {
    const result = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      jwtKey: env.CLERK_JWT_KEY || undefined,
      authorizedParties: authorizedParties(env),
    });
    if (result.errors) return null;
    const sub = (result.data as { sub?: unknown } | undefined)?.sub;
    if (typeof sub !== "string" || !/^user_[A-Za-z0-9]{10,64}$/.test(sub)) return null;
    return { clerkUserId: sub };
  } catch {
    return null;
  }
};

/** Reads email + verification status from Clerk Backend API (never trusted from the browser). */
export const clerkProfileLookup: ProfileLookup = async (clerkUserId, env) => {
  if (!env.CLERK_SECRET_KEY) return null;
  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  const user = await clerk.users.getUser(clerkUserId);
  const primary = user.primaryEmailAddress;
  return {
    email: primary?.emailAddress?.toLowerCase() ?? null,
    emailVerified: primary?.verification?.status === "verified",
  };
};

const BEARER = /^Bearer ([A-Za-z0-9._-]{20,4096})$/;

export function bearerToken(header: string | undefined | null): string | null {
  const match = BEARER.exec(header ?? "");
  return match ? match[1] : null;
}

const PROFILE_REFRESH_MS = 60 * 60 * 1000;

type CustomerRow = { id: string; clerk_user_id: string; email: string | null; email_verified: number; status: Customer["status"]; updated_at?: string };
const toCustomer = (row: CustomerRow): Customer => ({
  id: row.id,
  clerkUserId: row.clerk_user_id,
  email: row.email,
  emailVerified: row.email_verified === 1,
  status: row.status,
});

/** Maps a verified Clerk subject to the internal customer record (created once; email is not the key). */
export async function resolveCustomer(db: D1Database, env: Env, identity: VerifiedIdentity, lookup: ProfileLookup): Promise<Customer> {
  const existing = await db
    .prepare("SELECT id, clerk_user_id, email, email_verified, status, updated_at FROM customers WHERE clerk_user_id = ?")
    .bind(identity.clerkUserId)
    .first<CustomerRow>();

  const fresh = existing && existing.email_verified === 1 && Date.now() - Date.parse(existing.updated_at ?? "") < PROFILE_REFRESH_MS;
  if (existing && fresh) return toCustomer(existing);

  const profile = await lookup(identity.clerkUserId, env).catch(() => null);
  if (!profile) {
    if (existing) return toCustomer(existing);
    throw new ApiError(503, "auth_unavailable", "Layanan login sedang tidak dapat dihubungi. Coba lagi.");
  }
  const now = nowIso();
  const row = await db
    .prepare(
      `INSERT INTO customers (id, clerk_user_id, email, email_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(clerk_user_id) DO UPDATE SET
         email = excluded.email, email_verified = excluded.email_verified, updated_at = excluded.updated_at
       RETURNING id, clerk_user_id, email, email_verified, status`,
    )
    .bind(newId("cus"), identity.clerkUserId, profile.email, profile.emailVerified ? 1 : 0, now, now)
    .first<CustomerRow>();
  if (!row) throw new ApiError(500, "internal_error", "Terjadi kesalahan. Coba lagi.");
  return toCustomer(row);
}
