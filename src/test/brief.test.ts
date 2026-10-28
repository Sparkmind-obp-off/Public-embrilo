import { describe, expect, it } from "vitest";
import { containsSensitiveData, emptyBrief, formatBriefSummary, validateBrief, validateField, type BriefData } from "../lib/brief";

const validBrief: BriefData = {
  ...emptyBrief,
  service: "script-pack",
  brand: "Kopi Senja",
  product: "Kopi susu literan, dibuat batch kecil setiap pagi, tahan lima hari di kulkas.",
  audience: "Pekerja muda yang sering lembur",
  objective: "Memperkenalkan produk baru",
  platforms: ["TikTok"],
  tone: "Santai & akrab",
  rightsConfirmed: true,
  aiAcknowledged: true,
};

describe("brief validation", () => {
  it("accepts a complete brief", () => {
    expect(validateBrief(validBrief)).toEqual({});
  });

  it("requires every mandatory field on an empty brief", () => {
    const errors = validateBrief(emptyBrief);
    expect(Object.keys(errors).sort()).toEqual(
      ["aiAcknowledged", "audience", "brand", "objective", "platforms", "product", "rightsConfirmed", "service", "tone"].sort(),
    );
  });

  it("rejects unknown service codes", () => {
    expect(validateField("service", { ...validBrief, service: "admin" })).toBeTruthy();
    expect(validateField("service", { ...validBrief, service: "diskusi" })).toBeUndefined();
  });

  it("enforces minimum and maximum lengths", () => {
    expect(validateField("product", { ...validBrief, product: "terlalu pendek" })).toMatch(/minimal 30/);
    expect(validateField("product", { ...validBrief, product: "a".repeat(1201) })).toMatch(/Maksimal 1200/);
  });

  it("keeps optional fields optional", () => {
    expect(validateField("cta", { ...validBrief, cta: "" })).toBeUndefined();
    expect(validateField("verifiedFacts", { ...validBrief, verifiedFacts: "" })).toBeUndefined();
  });

  it("blocks obvious secrets", () => {
    expect(containsSensitiveData("password: rahasia123")).toBe(true);
    expect(containsSensitiveData("kode OTP 123456")).toBe(true);
    expect(containsSensitiveData("api_key=sk_live_abcdefgh1234")).toBe(true);
    expect(containsSensitiveData("Kopi susu gula aren 1 liter")).toBe(false);
    expect(validateField("constraints", { ...validBrief, constraints: "password: abc12345" })).toMatch(/data sensitif/);
  });
});

describe("brief summary", () => {
  it("includes the key fields and states it was not sent", () => {
    const summary = formatBriefSummary(validBrief);
    expect(summary).toContain("Paket skrip video pendek");
    expect(summary).toContain("Kopi Senja");
    expect(summary).toContain("TikTok");
    expect(summary).toMatch(/belum dikirim/);
  });
});
