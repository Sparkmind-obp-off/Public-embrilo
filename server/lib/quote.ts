import { validateBrief, platformOptions, type BriefData } from "../../src/lib/brief";
import { serviceByCode, type Pricing } from "../../src/lib/content";
import { ApiError } from "./errors";

export const TERMS_VERSION = "terms-2026-10-draft";

const BRIEF_KEYS: (keyof BriefData)[] = [
  "service", "brand", "product", "verifiedFacts", "audience", "objective",
  "platforms", "tone", "cta", "constraints", "rightsConfirmed", "aiAcknowledged",
];

export interface OfferSnapshot {
  code: string;
  osServiceCode: string;
  offerVersion: string;
  title: string;
  pricing: Pricing;
  proposedScope: string;
  revisionRounds: number;
}

/** For visitors unsure which offer fits. Maps to OS PRODUCTION_BRIEF. */
const consultation: OfferSnapshot = {
  code: "diskusi",
  osServiceCode: "PRODUCTION_BRIEF",
  offerVersion: "consultation@2026-10",
  title: "Konsultasi kebutuhan konten",
  pricing: { mode: "quote" },
  proposedScope: "Kebutuhan ditinjau lalu diarahkan ke layanan yang sesuai.",
  revisionRounds: 0,
};

export interface ValidatedQuote {
  brief: BriefData;
  offer: OfferSnapshot;
}

/** Strict server-side validation. Unknown fields are rejected; browser prices are never accepted. */
export function parseQuoteRequest(input: unknown): ValidatedQuote {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ApiError(400, "invalid_json", "Format permintaan tidak valid.");
  const body = input as Record<string, unknown>;
  const unknownTop = Object.keys(body).filter((key) => !["brief", "terms_version"].includes(key));
  if (unknownTop.length)
    throw new ApiError(422, "validation_failed", "Ada isian yang tidak dikenal.", unknownTop.map((field) => ({ field, code: "unknown_field" })));
  if (body.terms_version !== TERMS_VERSION)
    throw new ApiError(422, "validation_failed", "Versi ketentuan sudah berubah. Muat ulang halaman.", [{ field: "terms_version", code: "mismatch" }]);

  const raw = body.brief;
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new ApiError(422, "validation_failed", "Brief wajib diisi.", [{ field: "brief", code: "required" }]);
  const record = raw as Record<string, unknown>;
  const unknownBrief = Object.keys(record).filter((key) => !BRIEF_KEYS.includes(key as keyof BriefData));
  if (unknownBrief.length)
    throw new ApiError(422, "validation_failed", "Ada isian yang tidak dikenal.", unknownBrief.map((field) => ({ field, code: "unknown_field" })));

  const str = (key: keyof BriefData) => (typeof record[key] === "string" ? (record[key] as string).trim() : "");
  const platforms = Array.isArray(record.platforms) ? record.platforms.filter((p): p is string => typeof p === "string").slice(0, 8) : [];
  const brief: BriefData = {
    service: str("service"), brand: str("brand"), product: str("product"), verifiedFacts: str("verifiedFacts"),
    audience: str("audience"), objective: str("objective"), platforms: [...new Set(platforms)], tone: str("tone"),
    cta: str("cta"), constraints: str("constraints"),
    rightsConfirmed: record.rightsConfirmed === true, aiAcknowledged: record.aiAcknowledged === true,
  };

  const errors: Record<string, string | undefined> = { ...validateBrief(brief) };
  if (brief.platforms.some((p) => !(platformOptions as readonly string[]).includes(p))) errors.platforms = "Platform tidak dikenal.";
  const failed = Object.entries(errors).filter(([, message]) => message);
  if (failed.length)
    throw new ApiError(422, "validation_failed", "Periksa kembali isian brief.", failed.map(([field, message]) => ({ field, message })));

  const service = serviceByCode(brief.service);
  const offer: OfferSnapshot = service
    ? {
        code: service.code, osServiceCode: service.osServiceCode, offerVersion: service.offerVersion, title: service.title,
        pricing: service.pricing, proposedScope: service.proposedScope, revisionRounds: service.revisionRounds,
      }
    : consultation;
  return { brief, offer };
}

const PLATFORM_TO_OS: Record<string, string> = {
  TikTok: "tiktok", "Instagram Reels": "instagram_reels", "YouTube Shorts": "youtube_shorts", Lainnya: "other",
};

/** Body for Embrilo OS `POST /v1/public/requests` (OS repo docs/09-connector-contract.md). */
export function toOsPayload(customerId: string, quote: ValidatedQuote, acceptedAt: string) {
  const { brief, offer } = quote;
  const facts = [brief.product, brief.verifiedFacts ? `Fakta terverifikasi: ${brief.verifiedFacts}` : ""].filter(Boolean).join("\n\n");
  return {
    customer: { external_ref: customerId, display_name: brief.brand.slice(0, 80) },
    consent: { accepted: true, terms_version: TERMS_VERSION, accepted_at: acceptedAt },
    service_code: offer.osServiceCode,
    brief: {
      objective: brief.objective,
      audience: brief.audience,
      product_facts: facts.slice(0, 5000),
      platforms: brief.platforms.map((p) => PLATFORM_TO_OS[p]).filter(Boolean),
      language: "id",
      tone: brief.tone,
      cta: brief.cta,
      constraints: brief.constraints,
      references: [],
      rights_confirmed: true,
    },
  };
}
