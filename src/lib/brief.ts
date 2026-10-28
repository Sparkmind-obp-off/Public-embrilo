import { serviceByCode } from "./content";

/**
 * Brief builder model. The public website has NO live intake endpoint yet
 * (see docs/04-public-api-contract.md). This module only validates and
 * formats a brief locally so the visitor can copy or download it.
 * Nothing here performs a network request or persists data.
 */

export interface BriefData {
  service: string;
  brand: string;
  product: string;
  verifiedFacts: string;
  audience: string;
  objective: string;
  platforms: string[];
  tone: string;
  cta: string;
  constraints: string;
  rightsConfirmed: boolean;
  aiAcknowledged: boolean;
}

export type BriefField = keyof BriefData;
export type BriefErrors = Partial<Record<BriefField, string>>;

export const emptyBrief: BriefData = {
  service: "",
  brand: "",
  product: "",
  verifiedFacts: "",
  audience: "",
  objective: "",
  platforms: [],
  tone: "",
  cta: "",
  constraints: "",
  rightsConfirmed: false,
  aiAcknowledged: false,
};

export const platformOptions = ["TikTok", "Instagram Reels", "YouTube Shorts", "Lainnya"] as const;
export const objectiveOptions = [
  "Memperkenalkan produk baru",
  "Meningkatkan minat pembelian",
  "Membangun kedekatan dengan audiens",
  "Edukasi tentang produk",
  "Masih ingin berdiskusi",
] as const;
export const toneOptions = ["Santai & akrab", "Profesional", "Hangat & personal", "Jenaka", "Belum tahu"] as const;

export const limits = {
  brand: { min: 2, max: 80 },
  product: { min: 30, max: 1200 },
  verifiedFacts: { min: 0, max: 800 },
  audience: { min: 10, max: 400 },
  cta: { min: 0, max: 160 },
  constraints: { min: 0, max: 600 },
} as const;

export interface BriefStep {
  id: string;
  title: string;
  description: string;
  fields: BriefField[];
}

export const briefSteps: BriefStep[] = [
  {
    id: "produk",
    title: "Produk",
    description: "Apa yang ingin kamu kenalkan dan layanan mana yang paling sesuai.",
    fields: ["service", "brand", "product", "verifiedFacts"],
  },
  {
    id: "audiens",
    title: "Audiens & tujuan",
    description: "Siapa yang ingin dijangkau dan apa yang ingin dicapai.",
    fields: ["audience", "objective", "platforms"],
  },
  {
    id: "konten",
    title: "Arah konten",
    description: "Gaya bahasa, ajakan, dan batasan yang perlu dihormati.",
    fields: ["tone", "cta", "constraints"],
  },
  {
    id: "tinjau",
    title: "Tinjau",
    description: "Periksa kembali ringkasan dan beri persetujuan.",
    fields: ["rightsConfirmed", "aiAcknowledged"],
  },
];

/** Patterns that suggest the visitor is pasting secrets. We warn and block. */
const sensitivePatterns: RegExp[] = [
  /\b(password|kata\s*sandi|passwd|pwd)\s*[:=]/i,
  /\b(otp|kode\s*verifikasi)\b\s*[:=]?\s*\d{4,8}\b/i,
  /\b(api[_\s-]?key|secret|token)\s*[:=]\s*\S{8,}/i,
  /\b\d{16}\b/, // card-like number
];

export const containsSensitiveData = (value: string): boolean =>
  sensitivePatterns.some((pattern) => pattern.test(value));

const textFields: BriefField[] = ["brand", "product", "verifiedFacts", "audience", "cta", "constraints"];

const lengthError = (field: keyof typeof limits, value: string): string | undefined => {
  const { min, max } = limits[field];
  const length = value.trim().length;
  if (min > 0 && length === 0) return undefined; // handled by required check
  if (length > 0 && length < min) return `Tulis minimal ${min} karakter agar konteksnya cukup jelas.`;
  if (length > max) return `Maksimal ${max} karakter. Saat ini ${length}.`;
  return undefined;
};

export function validateField(field: BriefField, data: BriefData): string | undefined {
  const value = data[field];

  if (typeof value === "string" && textFields.includes(field) && containsSensitiveData(value)) {
    return "Sepertinya ada data sensitif (password, OTP, token, atau nomor kartu). Hapus bagian tersebut.";
  }

  switch (field) {
    case "service":
      return serviceByCode(data.service) || data.service === "diskusi" ? undefined : "Pilih salah satu layanan.";
    case "brand":
      if (!data.brand.trim()) return "Nama brand atau usaha wajib diisi.";
      return lengthError("brand", data.brand);
    case "product":
      if (!data.product.trim()) return "Ceritakan produk atau layananmu.";
      return lengthError("product", data.product);
    case "verifiedFacts":
      return lengthError("verifiedFacts", data.verifiedFacts);
    case "audience":
      if (!data.audience.trim()) return "Jelaskan siapa audiens yang ingin dijangkau.";
      return lengthError("audience", data.audience);
    case "objective":
      return data.objective ? undefined : "Pilih tujuan utama konten.";
    case "platforms":
      return data.platforms.length > 0 ? undefined : "Pilih minimal satu platform.";
    case "tone":
      return data.tone ? undefined : "Pilih gaya bahasa yang paling mendekati.";
    case "cta":
      return lengthError("cta", data.cta);
    case "constraints":
      return lengthError("constraints", data.constraints);
    case "rightsConfirmed":
      return data.rightsConfirmed ? undefined : "Konfirmasi ini diperlukan sebelum melanjutkan.";
    case "aiAcknowledged":
      return data.aiAcknowledged ? undefined : "Konfirmasi ini diperlukan sebelum melanjutkan.";
    default:
      return undefined;
  }
}

export function validateFields(fields: BriefField[], data: BriefData): BriefErrors {
  const errors: BriefErrors = {};
  for (const field of fields) {
    const message = validateField(field, data);
    if (message) errors[field] = message;
  }
  return errors;
}

export const validateBrief = (data: BriefData): BriefErrors =>
  validateFields(
    briefSteps.flatMap((step) => step.fields),
    data,
  );

const orDash = (value: string) => (value.trim() ? value.trim() : "—");

/** Produces a plain-text summary the visitor can copy or download. */
export function formatBriefSummary(data: BriefData): string {
  const service = serviceByCode(data.service)?.title ?? (data.service === "diskusi" ? "Masih ingin berdiskusi" : "—");
  return [
    "BRIEF KONTEN — EMBRILO",
    "Disusun di embrilo (draf lokal, belum dikirim ke mana pun)",
    "",
    `Layanan        : ${service}`,
    `Brand / usaha  : ${orDash(data.brand)}`,
    "",
    "PRODUK",
    orDash(data.product),
    "",
    "Fakta terverifikasi:",
    orDash(data.verifiedFacts),
    "",
    "AUDIENS & TUJUAN",
    `Audiens        : ${orDash(data.audience)}`,
    `Tujuan         : ${orDash(data.objective)}`,
    `Platform       : ${data.platforms.length ? data.platforms.join(", ") : "—"}`,
    "",
    "ARAH KONTEN",
    `Gaya bahasa    : ${orDash(data.tone)}`,
    `CTA            : ${orDash(data.cta)}`,
    `Batasan        : ${orDash(data.constraints)}`,
  ].join("\n");
}

export const fieldLabels: Record<BriefField, string> = {
  service: "Layanan",
  brand: "Nama brand atau usaha",
  product: "Tentang produk",
  verifiedFacts: "Fakta yang sudah terverifikasi",
  audience: "Audiens",
  objective: "Tujuan utama",
  platforms: "Platform",
  tone: "Gaya bahasa",
  cta: "Ajakan (CTA)",
  constraints: "Batasan",
  rightsConfirmed: "Hak atas materi",
  aiAcknowledged: "Pemrosesan dengan bantuan AI",
};
