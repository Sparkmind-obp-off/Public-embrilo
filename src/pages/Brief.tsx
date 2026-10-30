import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, Download, Info, LogIn, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { SectionLabel } from "../components/Layout";
import {
  briefSteps,
  emptyBrief,
  fieldLabels,
  formatBriefSummary,
  limits,
  objectiveOptions,
  platformOptions,
  toneOptions,
  validateBrief,
  validateField,
  validateFields,
  type BriefData,
  type BriefErrors,
  type BriefField,
} from "../lib/brief";
import { serviceByCode, services } from "../lib/content";
import { Link, useRouter, usePageMeta } from "../lib/router";
import { useAuthState } from "../auth/context";
import { apiFetch, useConfig, type ApiErrorBody } from "../lib/config";

const DRAFT_KEY = "embrilo:brief-draft";
const newIdempotencyKey = () =>
  `brief-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`}`;

/** Restores a draft saved right before the visitor went to sign in (same tab only). */
function takeDraft(): BriefData | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(DRAFT_KEY);
    const parsed = JSON.parse(raw) as Partial<BriefData>;
    return { ...emptyBrief, ...parsed, platforms: Array.isArray(parsed.platforms) ? parsed.platforms : [] };
  } catch {
    return null;
  }
}

type SubmitState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; ref: string }
  | { kind: "error"; message: string; details?: string[] };

function submitErrorMessage(status: number, json: unknown): { message: string; details?: string[] } {
  const body = json as ApiErrorBody | null;
  const code = body?.error?.code;
  if (status === 401) return { message: "Sesi berakhir. Silakan masuk kembali, lalu kirim ulang." };
  if (code === "email_not_verified") return { message: "Verifikasi email akunmu terlebih dahulu, lalu kirim ulang." };
  if (status === 422) {
    const details = (body?.error?.details as Array<{ message?: string }> | undefined)?.map((d) => d.message).filter((m): m is string => Boolean(m));
    return { message: body?.error?.message ?? "Periksa kembali isian brief.", details };
  }
  if (status === 429) return { message: "Terlalu banyak pengiriman dalam waktu singkat. Coba lagi beberapa menit lagi." };
  if (status === 503) return { message: body?.error?.message ?? "Layanan sedang tidak tersedia. Brief belum terkirim; coba lagi nanti." };
  return { message: "Brief belum terkirim karena terjadi kesalahan. Isianmu masih aman di halaman ini; coba kirim ulang." };
}

const initialService = () => {
  const code = new URLSearchParams(window.location.search).get("layanan") ?? "";
  return serviceByCode(code) || code === "diskusi" ? code : "";
};

function Field({
  id,
  label,
  hint,
  error,
  optional,
  counter,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  counter?: { value: number; max: number };
  children: ReactNode;
}) {
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <div className="field-label-row">
        <label htmlFor={id} className="field-label">
          {label} {optional && <span className="field-optional">(opsional)</span>}
        </label>
        {counter && (
          <span className={`field-counter${counter.value > counter.max ? " is-over" : ""}`} aria-hidden="true">
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          <AlertTriangle size={14} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, hint: boolean, error?: string) =>
  [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

export function BriefPage() {
  usePageMeta({
    title: "Susun brief — Embrilo",
    description:
      "Susun brief konten short-form dalam empat langkah: produk, audiens, arah konten, dan tinjauan. Kirim sebagai permintaan penawaran, atau simpan ringkasannya.",
  });

  const [restored] = useState(() => takeDraft());
  const [data, setData] = useState<BriefData>(() => restored ?? { ...emptyBrief, service: initialService() });
  const [errors, setErrors] = useState<BriefErrors>({});
  const [step, setStep] = useState(restored ? briefSteps.length - 1 : 0);
  const [done, setDone] = useState(Boolean(restored));
  const [submit, setSubmit] = useState<SubmitState>({ kind: "idle" });
  const idempotencyKey = useRef(newIdempotencyKey());
  const auth = useAuthState();
  const config = useConfig(true);
  const { navigate } = useRouter();
  /** Online intake only when the server says storage + auth are live. Otherwise honest local mode. */
  const online = Boolean(config?.intake_enabled) && auth.status !== "disabled";
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const current = briefSteps[step];
  const isLast = step === briefSteps.length - 1;
  const summary = useMemo(() => formatBriefSummary(data), [data]);
  const dirty = JSON.stringify(data) !== JSON.stringify({ ...emptyBrief, service: data.service });

  // Warn before leaving with unsaved input (data is never persisted).
  useEffect(() => {
    if (!dirty || submit.kind === "sent") return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, submit.kind]);

  // Move focus to the step heading when the step changes (not on first load).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, done, submit.kind]);

  const update = <K extends BriefField>(field: K, value: BriefData[K]) => {
    idempotencyKey.current = newIdempotencyKey(); // a changed brief is a new request
    if (submit.kind === "error") setSubmit({ kind: "idle" });
    setData((previous) => {
      const next = { ...previous, [field]: value };
      if (errors[field]) {
        setErrors((current) => ({ ...current, [field]: validateField(field, next) }));
      }
      return next;
    });
    setCopyState("idle");
  };

  const onText = (field: BriefField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    update(field, event.target.value as never);

  const onBlur = (field: BriefField) => () => {
    const message = validateField(field, data);
    setErrors((current) => ({ ...current, [field]: message }));
  };

  const togglePlatform = (platform: string) => {
    const next = data.platforms.includes(platform)
      ? data.platforms.filter((item) => item !== platform)
      : [...data.platforms, platform];
    update("platforms", next);
  };

  const goNext = (event: FormEvent) => {
    event.preventDefault();
    const stepErrors = validateFields(current.fields, data);
    setErrors((existing) => ({ ...existing, ...Object.fromEntries(current.fields.map((f) => [f, stepErrors[f]])) }));

    if (Object.keys(stepErrors).length > 0) {
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }

    if (isLast) {
      const allErrors = validateBrief(data);
      if (Object.keys(allErrors).length > 0) {
        setErrors(allErrors);
        const firstBad = briefSteps.findIndex((s) => s.fields.some((f) => allErrors[f]));
        setStep(firstBad);
        return;
      }
      setDone(true);
      return;
    }
    setStep((value) => value + 1);
  };

  const goBack = () => setStep((value) => Math.max(0, value - 1));

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  const downloadSummary = () => {
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const slug = data.brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brief";
    anchor.href = url;
    anchor.download = `brief-embrilo-${slug}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const sendBrief = async () => {
    if (auth.status !== "signed_in" || !config || submit.kind === "sending") return;
    setSubmit({ kind: "sending" });
    try {
      const token = await auth.getToken();
      if (!token) {
        setSubmit({ kind: "error", message: "Sesi berakhir. Silakan masuk kembali, lalu kirim ulang." });
        return;
      }
      const { response, json } = await apiFetch("/api/v1/quote-requests", token, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify({ brief: data, terms_version: config.terms_version }),
      });
      const ref = (json as { public_ref?: unknown } | null)?.public_ref;
      // Success is shown ONLY after the server confirms persistence (201 new / 200 idempotent replay).
      if ((response.status === 201 || response.status === 200) && typeof ref === "string") {
        setSubmit({ kind: "sent", ref });
        return;
      }
      setSubmit({ kind: "error", ...submitErrorMessage(response.status, json) });
    } catch {
      // Same idempotency key is kept, so a retry cannot create a duplicate request.
      setSubmit({ kind: "error", message: "Koneksi terputus sebelum brief terkonfirmasi. Isianmu masih aman; tekan kirim lagi." });
    }
  };

  const signInToSend = () => {
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable: user can still copy the summary first */
    }
    navigate("/masuk?next=/brief");
  };

  const reset = () => {
    idempotencyKey.current = newIdempotencyKey();
    setSubmit({ kind: "idle" });
    setData({ ...emptyBrief });
    setErrors({});
    setStep(0);
    setDone(false);
    setCopyState("idle");
  };

  const stepErrorList = current.fields.filter((field) => errors[field]);

  const textProps = (field: BriefField, hint: boolean) => ({
    id: field,
    name: field,
    value: data[field] as string,
    onChange: onText(field),
    onBlur: onBlur(field),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": describedBy(field, hint, errors[field]),
  });

  return (
    <section className="brief-page" aria-labelledby="brief-title">
      <div className="container brief-layout">
        <aside className="brief-aside">
          <SectionLabel>Penyusun brief</SectionLabel>
          <h1 id="brief-title">Susun brief kontenmu.</h1>
          <p className="lede">Empat langkah singkat untuk merapikan kebutuhan konten menjadi brief yang jelas.</p>

          {!config ? (
            <p className="muted" role="status">Memeriksa ketersediaan pengiriman…</p>
          ) : online ? (
            <div className="notice notice-strong notice-online" role="note">
              <Info size={18} aria-hidden="true" />
              <div>
                <strong>Brief dikirim sebagai permintaan penawaran.</strong>
                <p>
                  Kirim setelah masuk dengan email terverifikasi. Belum ada tagihan: harga dan lingkup final kami kirim
                  setelah brief ditinjau.
                </p>
              </div>
            </div>
          ) : (
            <div className="notice notice-strong" role="note">
              <Info size={18} aria-hidden="true" />
              <div>
                <strong>Pengiriman online belum aktif.</strong>
                <p>
                  Formulir ini berjalan di browsermu saja. Tidak ada data yang dikirim atau disimpan. Di akhir, kamu bisa
                  menyalin atau mengunduh ringkasan brief.
                </p>
              </div>
            </div>
          )}

          {!done && (
            <ol className="stepper" aria-label="Langkah penyusunan brief">
              {briefSteps.map((item, index) => {
                const state = index < step ? "done" : index === step ? "current" : "todo";
                return (
                  <li key={item.id} className={`stepper-item is-${state}`} aria-current={state === "current" ? "step" : undefined}>
                    <span className="stepper-dot" aria-hidden="true">
                      {state === "done" ? <Check size={14} /> : index + 1}
                    </span>
                    <span className="stepper-text">
                      <span className="stepper-title">{item.title}</span>
                      <span className="visually-hidden">
                        {state === "done" ? " — selesai" : state === "current" ? " — langkah saat ini" : ""}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <p className="brief-safety">
            <ShieldCheck size={16} aria-hidden="true" />
            Jangan menulis password, OTP, cookie, atau data pribadi pelanggan.
          </p>
        </aside>

        <div className="brief-card">
          {submit.kind === "sent" ? (
            <div className="brief-done">
              <h2 ref={headingRef} tabIndex={-1}>
                Brief terkirim.
              </h2>
              <p className="brief-done-lede" role="status">
                Brief sudah tersimpan di Embrilo dengan nomor <strong className="ref-chip">{submit.ref}</strong>. Ini
                permintaan penawaran — belum ada tagihan dan pengerjaan belum dimulai.
              </p>
              <ol className="next-steps">
                <li>Tim Embrilo meninjau brief dan menghubungimu bila ada yang perlu diperjelas.</li>
                <li>Kamu menerima penawaran tertulis: lingkup, harga, waktu, dan jumlah revisi.</li>
                <li>Pengerjaan dimulai hanya setelah penawaran kamu setujui.</li>
              </ol>
              <div className="brief-actions">
                <Link to={`/akun/permintaan/${submit.ref}`} className="button button-primary">
                  Lihat status <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <button type="button" className="button button-text" onClick={reset}>
                  <RotateCcw size={16} aria-hidden="true" /> Susun brief lain
                </button>
              </div>
            </div>
          ) : done ? (
            <div className="brief-done">
              <h2 ref={headingRef} tabIndex={-1}>
                {online ? "Brief siap dikirim." : "Ringkasan brief siap."}
              </h2>
              {online ? (
                <p className="brief-done-lede" role="status">
                  Periksa ringkasan di bawah. <strong>Brief belum terkirim</strong> sampai kamu menekan tombol kirim dan
                  Embrilo mengonfirmasinya.
                </p>
              ) : (
                <p className="brief-done-lede" role="status">
                  Brief sudah lengkap dan tersusun. Karena pengiriman online belum aktif, <strong>brief ini belum dikirim
                  ke Embrilo</strong>. Simpan ringkasannya dengan menyalin atau mengunduh.
                </p>
              )}
              {online && (
                <div className="send-panel">
                  {auth.status === "signed_in" ? (
                    <button type="button" className="button button-primary button-large" onClick={() => void sendBrief()} disabled={submit.kind === "sending"} aria-busy={submit.kind === "sending"}>
                      <Send size={16} aria-hidden="true" /> {submit.kind === "sending" ? "Mengirim…" : "Kirim brief ke Embrilo"}
                    </button>
                  ) : auth.status === "signed_out" ? (
                    <button type="button" className="button button-primary button-large" onClick={signInToSend}>
                      <LogIn size={16} aria-hidden="true" /> Masuk untuk mengirim
                    </button>
                  ) : (
                    <p className="muted" role="status">Memuat status login…</p>
                  )}
                  {auth.status === "signed_out" && <p className="muted">Isian brief disimpan sementara di tab ini dan dipulihkan setelah kamu masuk.</p>}
                  {submit.kind === "error" && (
                    <div className="error-summary" role="alert">
                      <strong>{submit.message}</strong>
                      {submit.details && submit.details.length > 0 && (
                        <ul>
                          {submit.details.map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
              <pre className="summary-box" tabIndex={0} aria-label="Ringkasan brief">
                {summary}
              </pre>
              <div className="brief-actions">
                <button type="button" className={`button ${online ? "button-ghost" : "button-primary"}`} onClick={copySummary}>
                  {copyState === "copied" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                  {copyState === "copied" ? "Tersalin" : "Salin ringkasan"}
                </button>
                <button type="button" className="button button-ghost" onClick={downloadSummary}>
                  <Download size={16} aria-hidden="true" /> Unduh .txt
                </button>
                <button type="button" className="button button-text" onClick={() => setDone(false)}>
                  <ArrowLeft size={16} aria-hidden="true" /> Ubah brief
                </button>
              </div>
              <p className="copy-feedback" aria-live="polite">
                {copyState === "copied" && "Ringkasan sudah disalin ke clipboard."}
                {copyState === "failed" && "Browser menolak akses clipboard. Gunakan tombol unduh, atau pilih teks lalu salin manual."}
              </p>
              <div className="brief-next">
                <h3>Langkah berikutnya</h3>
                <p>
                  {online
                    ? "Setelah terkirim, kamu bisa memantau statusnya di halaman Akun."
                    : "Simpan ringkasan ini. Saat kanal pengiriman resmi Embrilo dibuka, kamu cukup menempelkan atau melampirkannya — tidak perlu menulis ulang."}
                </p>
                <button type="button" className="button button-text" onClick={reset}>
                  <RotateCcw size={16} aria-hidden="true" /> Mulai brief baru
                </button>
              </div>
            </div>
          ) : (
            <form noValidate onSubmit={goNext} aria-labelledby="step-title">
              <div className="brief-card-head">
                <span className="brief-progress-text">
                  Langkah {step + 1} dari {briefSteps.length}
                </span>
                <div
                  className="progress"
                  role="progressbar"
                  aria-label="Kemajuan brief"
                  aria-valuemin={1}
                  aria-valuemax={briefSteps.length}
                  aria-valuenow={step + 1}
                >
                  <span style={{ width: `${((step + 1) / briefSteps.length) * 100}%` }} />
                </div>
                <h2 id="step-title" ref={headingRef} tabIndex={-1}>
                  {current.title}
                </h2>
                <p className="brief-step-desc">{current.description}</p>
              </div>

              {stepErrorList.length > 0 && (
                <div className="error-summary" role="alert" tabIndex={-1} ref={errorSummaryRef}>
                  <strong>Periksa {stepErrorList.length} isian berikut:</strong>
                  <ul>
                    {stepErrorList.map((field) => (
                      <li key={field}>
                        <a
                          href={`#${field === "platforms" ? "platform-0" : field}`}
                          onClick={(event) => {
                            event.preventDefault();
                            document.getElementById(field === "platforms" ? "platform-0" : field)?.focus();
                          }}
                        >
                          {fieldLabels[field]}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="brief-fields">
                {current.id === "produk" && (
                  <>
                    <fieldset className={`field${errors.service ? " has-error" : ""}`} aria-describedby={errors.service ? "service-error" : undefined}>
                      <legend className="field-label">Layanan yang dibutuhkan</legend>
                      <div className="choice-grid">
                        {[...services.map((s) => ({ value: s.code, label: s.title, desc: s.summary })), { value: "diskusi", label: "Belum yakin", desc: "Ceritakan kebutuhanmu, kita tentukan layanan yang paling sesuai." }].map(
                          (option, index) => (
                            <label key={option.value} className={`choice-card${data.service === option.value ? " is-selected" : ""}`}>
                              <input
                                type="radio"
                                name="service"
                                id={index === 0 ? "service" : undefined}
                                value={option.value}
                                checked={data.service === option.value}
                                onChange={() => update("service", option.value)}
                              />
                              <span className="choice-title">{option.label}</span>
                              <span className="choice-desc">{option.desc}</span>
                            </label>
                          ),
                        )}
                      </div>
                      {errors.service && (
                        <p className="field-error" id="service-error">
                          <AlertTriangle size={14} aria-hidden="true" /> {errors.service}
                        </p>
                      )}
                    </fieldset>

                    <Field id="brand" label={fieldLabels.brand} error={errors.brand}>
                      <input type="text" autoComplete="organization" placeholder="Contoh: Kopi Senja" maxLength={limits.brand.max + 20} {...textProps("brand", false)} />
                    </Field>

                    <Field
                      id="product"
                      label={fieldLabels.product}
                      hint="Apa produknya, apa keunggulannya, dan masalah apa yang diselesaikan."
                      error={errors.product}
                      counter={{ value: data.product.length, max: limits.product.max }}
                    >
                      <textarea rows={5} placeholder="Contoh: Kopi susu literan, dibuat batch kecil setiap pagi, tahan 5 hari di kulkas…" {...textProps("product", true)} />
                    </Field>

                    <Field
                      id="verifiedFacts"
                      label={fieldLabels.verifiedFacts}
                      optional
                      hint="Klaim yang boleh disebut di konten (misalnya bahan, sertifikasi, harga). Kami tidak akan menambah klaim di luar daftar ini."
                      error={errors.verifiedFacts}
                      counter={{ value: data.verifiedFacts.length, max: limits.verifiedFacts.max }}
                    >
                      <textarea rows={3} {...textProps("verifiedFacts", true)} />
                    </Field>
                  </>
                )}

                {current.id === "audiens" && (
                  <>
                    <Field
                      id="audience"
                      label={fieldLabels.audience}
                      hint="Siapa mereka, apa kebiasaannya, dan apa yang mereka pedulikan."
                      error={errors.audience}
                      counter={{ value: data.audience.length, max: limits.audience.max }}
                    >
                      <textarea rows={3} placeholder="Contoh: Pekerja muda 22–30 tahun yang sering lembur dan suka stok minuman di rumah." {...textProps("audience", true)} />
                    </Field>

                    <Field id="objective" label={fieldLabels.objective} error={errors.objective}>
                      <select {...textProps("objective", false)}>
                        <option value="">Pilih tujuan</option>
                        {objectiveOptions.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </Field>

                    <fieldset className={`field${errors.platforms ? " has-error" : ""}`} aria-describedby={errors.platforms ? "platforms-error" : undefined}>
                      <legend className="field-label">Platform tujuan</legend>
                      <p className="field-hint">Boleh pilih lebih dari satu.</p>
                      <div className="pill-group">
                        {platformOptions.map((platform, index) => (
                          <label key={platform} className={`pill-check${data.platforms.includes(platform) ? " is-selected" : ""}`}>
                            <input
                              type="checkbox"
                              id={`platform-${index}`}
                              name="platforms"
                              value={platform}
                              checked={data.platforms.includes(platform)}
                              onChange={() => togglePlatform(platform)}
                            />
                            {data.platforms.includes(platform) && <Check size={14} aria-hidden="true" />}
                            {platform}
                          </label>
                        ))}
                      </div>
                      {errors.platforms && (
                        <p className="field-error" id="platforms-error">
                          <AlertTriangle size={14} aria-hidden="true" /> {errors.platforms}
                        </p>
                      )}
                    </fieldset>
                  </>
                )}

                {current.id === "konten" && (
                  <>
                    <Field id="tone" label={fieldLabels.tone} error={errors.tone}>
                      <select {...textProps("tone", false)}>
                        <option value="">Pilih gaya bahasa</option>
                        {toneOptions.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      id="cta"
                      label={fieldLabels.cta}
                      optional
                      hint="Apa yang kamu ingin audiens lakukan setelah menonton."
                      error={errors.cta}
                      counter={{ value: data.cta.length, max: limits.cta.max }}
                    >
                      <input type="text" placeholder="Contoh: Pesan lewat link di bio" {...textProps("cta", true)} />
                    </Field>
                    <Field
                      id="constraints"
                      label={fieldLabels.constraints}
                      optional
                      hint="Kata, topik, atau gaya yang harus dihindari. Juga catatan lain yang perlu kami tahu."
                      error={errors.constraints}
                      counter={{ value: data.constraints.length, max: limits.constraints.max }}
                    >
                      <textarea rows={3} {...textProps("constraints", true)} />
                    </Field>
                  </>
                )}

                {current.id === "tinjau" && (
                  <>
                    <div className="review-block">
                      <h3>Periksa kembali</h3>
                      <dl className="review-list">
                        {(["service", "brand", "product", "audience", "objective", "platforms", "tone", "cta"] as BriefField[]).map((field) => {
                          const raw = data[field];
                          const value =
                            field === "service"
                              ? serviceByCode(data.service)?.title ?? (data.service === "diskusi" ? "Belum yakin" : "")
                              : Array.isArray(raw)
                                ? raw.join(", ")
                                : String(raw);
                          return (
                            <div key={field}>
                              <dt>{fieldLabels[field]}</dt>
                              <dd>{value.trim() ? value : <span className="muted">Tidak diisi</span>}</dd>
                            </div>
                          );
                        })}
                      </dl>
                      <button type="button" className="button button-text" onClick={() => setStep(0)}>
                        Ubah dari awal
                      </button>
                    </div>

                    <div className={`consent${errors.rightsConfirmed ? " has-error" : ""}`}>
                      <label className="check-row">
                        <input
                          type="checkbox"
                          id="rightsConfirmed"
                          checked={data.rightsConfirmed}
                          onChange={(event) => update("rightsConfirmed", event.target.checked)}
                          aria-invalid={errors.rightsConfirmed ? true : undefined}
                          aria-describedby={errors.rightsConfirmed ? "rightsConfirmed-error" : undefined}
                        />
                        <span>Saya memiliki hak atas nama brand, informasi produk, dan materi yang saya cantumkan.</span>
                      </label>
                      {errors.rightsConfirmed && (
                        <p className="field-error" id="rightsConfirmed-error">
                          <AlertTriangle size={14} aria-hidden="true" /> {errors.rightsConfirmed}
                        </p>
                      )}
                    </div>
                    <div className={`consent${errors.aiAcknowledged ? " has-error" : ""}`}>
                      <label className="check-row">
                        <input
                          type="checkbox"
                          id="aiAcknowledged"
                          checked={data.aiAcknowledged}
                          onChange={(event) => update("aiAcknowledged", event.target.checked)}
                          aria-invalid={errors.aiAcknowledged ? true : undefined}
                          aria-describedby={errors.aiAcknowledged ? "aiAcknowledged-error" : undefined}
                        />
                        <span>
                          Saya memahami bahwa saat layanan berjalan, brief dapat diproses dengan bantuan AI dan ditinjau
                          manusia, serta tidak ada jaminan hasil views atau penjualan.
                        </span>
                      </label>
                      {errors.aiAcknowledged && (
                        <p className="field-error" id="aiAcknowledged-error">
                          <AlertTriangle size={14} aria-hidden="true" /> {errors.aiAcknowledged}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="brief-nav">
                {step > 0 ? (
                  <button type="button" className="button button-ghost" onClick={goBack}>
                    <ArrowLeft size={16} aria-hidden="true" /> Kembali
                  </button>
                ) : (
                  <Link to="/layanan" className="button button-text">
                    Lihat detail layanan
                  </Link>
                )}
                <button type="submit" className="button button-primary">
                  {isLast ? (online ? "Tinjau sebelum kirim" : "Buat ringkasan brief") : "Lanjut"} <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
