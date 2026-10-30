import { useEffect, useState } from "react";

/** Non-secret runtime configuration served by /api/v1/config. */
export interface PublicConfig {
  clerk_publishable_key: string | null;
  /** Same-origin Clerk Frontend API proxy (production). */
  clerk_proxy_url?: string | null;
  /** Origin where sign-in works (Clerk production domain). */
  canonical_origin?: string | null;
  terms_version: string;
  intake_enabled: boolean;
  payments_enabled: boolean;
}

export const OFFLINE_CONFIG: PublicConfig = {
  clerk_publishable_key: null,
  terms_version: "terms-2026-10-draft",
  intake_enabled: false,
  payments_enabled: false,
};

let cached: Promise<PublicConfig> | null = null;

export function loadConfig(): Promise<PublicConfig> {
  if (!cached) {
    cached = fetch("/api/v1/config", { headers: { Accept: "application/json" } })
      .then(async (response) => (response.ok ? ({ ...OFFLINE_CONFIG, ...(await response.json()) } as PublicConfig) : OFFLINE_CONFIG))
      .catch(() => OFFLINE_CONFIG);
  }
  return cached;
}

export const resetConfigCacheForTests = () => {
  cached = null;
};

/** Loads config only when `enabled`, so marketing pages make no API calls. */
export function useConfig(enabled = true): PublicConfig | null {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadConfig().then((value) => alive && setConfig(value));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return config;
}

export interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

export async function apiFetch(path: string, token: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");
  const response = await fetch(path, { ...init, headers });
  const json = (await response.json().catch(() => null)) as unknown;
  return { response, json };
}
