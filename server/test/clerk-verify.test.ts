// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { SignJWT, exportSPKI, generateKeyPair } from "jose";
import { clerkSessionVerifier } from "../lib/auth";
import type { Env } from "../env";

/**
 * Exercises the REAL Clerk verifier (not a mock) with locally signed RS256 tokens,
 * networkless via CLERK_JWT_KEY. Regression guard for the legacy return shape.
 */
let privateKey: CryptoKey;
let env: Env;
const ORIGIN = "https://embrilo-public.pages.dev";
const KID = "ins_test_kid";

beforeAll(async () => {
  const pair = await generateKeyPair("RS256", { extractable: true });
  privateKey = pair.privateKey as CryptoKey;
  env = {
    CLERK_SECRET_KEY: "sk_test_unused_for_networkless",
    CLERK_PUBLISHABLE_KEY: "pk_test_x",
    CLERK_AUTHORIZED_PARTIES: `${ORIGIN},https://embrilo.biz.id`,
    CLERK_JWT_KEY: await exportSPKI(pair.publicKey),
  };
});

const sign = (claims: Record<string, unknown>, opts: { exp?: number; key?: CryptoKey } = {}) => {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ azp: ORIGIN, sid: "sess_test", sts: "active", v: 2, ...claims })
    .setProtectedHeader({ alg: "RS256", kid: KID, typ: "JWT" })
    .setSubject((claims.sub as string) ?? "user_abcdefghij0123")
    .setIssuer(`${ORIGIN}/__clerk`)
    .setIssuedAt(now - 5)
    .setNotBefore(now - 5)
    .setExpirationTime(opts.exp ?? now + 60)
    .sign(opts.key ?? privateKey);
};

describe("clerkSessionVerifier (real @clerk/backend)", () => {
  it("accepts a valid session token and returns the Clerk subject", async () => {
    expect(await clerkSessionVerifier(await sign({}), env)).toEqual({ clerkUserId: "user_abcdefghij0123" });
  });

  it("rejects an expired token", async () => {
    const now = Math.floor(Date.now() / 1000);
    expect(await clerkSessionVerifier(await sign({}, { exp: now - 600 }), env)).toBeNull();
  });

  it("rejects a token from an unauthorized party (azp)", async () => {
    expect(await clerkSessionVerifier(await sign({ azp: "https://evil.example" }), env)).toBeNull();
  });

  it("rejects a token signed by a different key", async () => {
    const other = await generateKeyPair("RS256");
    expect(await clerkSessionVerifier(await sign({}, { key: other.privateKey as CryptoKey }), env)).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const [h, , s] = (await sign({})).split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "user_attackerxxxx0000", azp: ORIGIN, exp: 9_999_999_999 })).toString("base64url");
    expect(await clerkSessionVerifier(`${h}.${forged}.${s}`, env)).toBeNull();
  });

  it("rejects non-active session status and malformed subjects", async () => {
    expect(await clerkSessionVerifier(await sign({ sts: "pending" }), env)).toBeNull();
    expect(await clerkSessionVerifier(await sign({ sub: "not-a-user" }), env)).toBeNull();
  });
});
