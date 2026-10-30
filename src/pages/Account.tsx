import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, Info, LogOut, RefreshCw } from "lucide-react";
import { SectionLabel } from "../components/Layout";
import { useAuthState } from "../auth/context";
import { apiFetch, type ApiErrorBody } from "../lib/config";
import { Link, useRouter, usePageMeta } from "../lib/router";
import { services } from "../lib/content";

const SignInPanel = lazy(() => import("../auth/ClerkShell").then((m) => ({ default: m.SignInPanel })));
const SignUpPanel = lazy(() => import("../auth/ClerkShell").then((m) => ({ default: m.SignUpPanel })));

/** Allows only same-site relative paths as post-login destinations (no open redirects). */
export const safeNext = (value: string | null) => (value && /^\/[a-z0-9/_-]*(\?[a-z0-9=&_-]*)?$/i.test(value) && !value.startsWith("//") ? value : "/akun");

function AuthNotice({ status }: { status: "disabled" | "loading" }) {
  if (status === "loading") return <p className="muted" role="status">Memuat layanan login…</p>;
  return (
    <p className="notice">
      <Info size={16} aria-hidden="true" />
      <span>Login belum aktif di lingkungan ini. Kamu tetap bisa menyusun brief dan menyimpan ringkasannya.</span>
    </p>
  );
}

type AuthMode = "sign-in" | "sign-up";

const AUTH_COPY: Record<AuthMode, { title: string; meta: string; lede: string; swapText: string; swapLabel: string; swapTo: string }> = {
  "sign-in": {
    title: "Masuk ke Embrilo.",
    meta: "Masuk — Embrilo",
    lede: "Gunakan akun Google atau email. Akun dipakai untuk mengirim brief dan melihat status permintaanmu.",
    swapText: "Belum punya akun?",
    swapLabel: "Daftar gratis",
    swapTo: "/daftar",
  },
  "sign-up": {
    title: "Buat akun Embrilo.",
    meta: "Daftar — Embrilo",
    lede: "Cara tercepat: daftar dengan Google. Kamu juga bisa memakai email dengan kode verifikasi.",
    swapText: "Sudah punya akun?",
    swapLabel: "Masuk",
    swapTo: "/masuk",
  },
};

function AuthPage({ mode }: { mode: AuthMode }) {
  const copy = AUTH_COPY[mode];
  usePageMeta({ title: copy.meta, description: "Masuk atau daftar ke Embrilo dengan akun Google atau email terverifikasi." });
  const auth = useAuthState();
  const { navigate } = useRouter();
  const next = safeNext(new URLSearchParams(window.location.search).get("next"));
  const swapHref = next !== "/akun" ? `${copy.swapTo}?next=${encodeURIComponent(next)}` : copy.swapTo;

  useEffect(() => {
    if (auth.status === "signed_in") navigate(next);
  }, [auth.status, navigate, next]);

  return (
    <section className="section auth-page" aria-labelledby="signin-title">
      <div className="container auth-grid">
        <div>
          <SectionLabel>Akun</SectionLabel>
          <h1 id="signin-title">{copy.title}</h1>
          <p className="lede">{copy.lede}</p>
          <ol className="journey-mini" aria-label="Setelah masuk">
            <li><strong>1.</strong> Masuk atau daftar (gratis).</li>
            <li><strong>2.</strong> Susun brief di halaman Brief.</li>
            <li><strong>3.</strong> Pantau status permintaan di Akun.</li>
          </ol>
          <ul className="check-list auth-points">
            <li>Email harus terverifikasi sebelum brief bisa dikirim. Akun Google sudah terverifikasi otomatis.</li>
            <li>Kami tidak mendaftarkanmu ke email promosi.</li>
            <li>Kami tidak pernah meminta password media sosial atau kode OTP.</li>
          </ul>
          <p className="auth-swap">
            {copy.swapText} <Link to={swapHref}>{copy.swapLabel}</Link>
          </p>
        </div>
        <div className="auth-card">
          {auth.status === "signed_out" ? (
            <Suspense fallback={<p className="muted">Memuat formulir…</p>}>
              {mode === "sign-in" ? <SignInPanel redirectUrl={next} /> : <SignUpPanel redirectUrl={next} />}
            </Suspense>
          ) : auth.status === "signed_in" ? (
            <p role="status">Kamu sudah masuk. Mengalihkan…</p>
          ) : (
            <AuthNotice status={auth.status} />
          )}
        </div>
      </div>
    </section>
  );
}

export const SignInPage = () => <AuthPage mode="sign-in" />;
export const SignUpPage = () => <AuthPage mode="sign-up" />;

interface RequestItem {
  public_ref: string;
  service_title: string;
  status_label: string;
  os_sync: string;
  created_at: string;
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(iso));

function apiMessage(status: number, json: unknown) {
  const body = json as ApiErrorBody | null;
  if (status === 401) return "Sesi berakhir. Silakan masuk kembali.";
  if (status === 503 && body?.error?.code === "storage_unavailable") return "Penyimpanan pesanan belum aktif. Pengiriman brief online belum dapat digunakan.";
  return body?.error?.message ?? "Terjadi kesalahan. Coba lagi.";
}

/** Small hook: runs an authenticated GET and exposes loading/error/data. */
function useAuthedGet<T>(path: string | null) {
  const auth = useAuthState();
  const [state, setState] = useState<{ loading: boolean; error: string | null; data: T | null }>({ loading: true, error: null, data: null });

  const load = useCallback(async () => {
    if (auth.status !== "signed_in" || !path) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const token = await auth.getToken();
      if (!token) throw new Error("no_token");
      const { response, json } = await apiFetch(path, token);
      if (!response.ok) setState({ loading: false, error: apiMessage(response.status, json), data: null });
      else setState({ loading: false, error: null, data: json as T });
    } catch {
      setState({ loading: false, error: "Koneksi gagal. Periksa internet lalu coba lagi.", data: null });
    }
  }, [auth, path]);

  useEffect(() => {
    void load();
  }, [load]);
  return { ...state, reload: load };
}

function SignedOutPrompt({ next }: { next: string }) {
  return (
    <div className="brief-card">
      <p>Masuk untuk melihat permintaan yang pernah kamu kirim.</p>
      <Link to={`/masuk?next=${encodeURIComponent(next)}`} className="button button-primary">
        Masuk
      </Link>
      <Link to={`/daftar?next=${encodeURIComponent(next)}`} className="button button-ghost">
        Daftar gratis
      </Link>
    </div>
  );
}

const ONBOARDING_STEPS = [
  { title: "Akun dibuat", text: "Kamu sudah masuk. Email akunmu dipakai untuk kabar status permintaan.", done: true },
  { title: "Pilih layanan", text: "Skrip video pendek, storytelling produk, rencana konten mingguan, atau konsultasi jika belum yakin.", done: false },
  { title: "Susun brief (±5 menit)", text: "Ceritakan produk, audiens, tujuan, dan platform. Hanya fakta yang sudah kamu verifikasi.", done: false },
  { title: "Tinjauan & penawaran", text: "Tim meninjau brief lalu mengirim lingkup dan harga tertulis. Belum ada tagihan sebelum kamu setuju.", done: false },
];

function Onboarding({ name }: { name: string | null }) {
  return (
    <div className="onboarding" aria-labelledby="onboarding-title">
      <h2 id="onboarding-title" className="detail-h2">{name ? `Selamat datang, ${name}.` : "Selamat datang di Embrilo."}</h2>
      <p className="muted">Belum ada permintaan. Ini langkah berikutnya:</p>
      <ol className="onboarding-steps">
        {ONBOARDING_STEPS.map((step, index) => (
          <li key={step.title} className={step.done ? "is-done" : index === 1 ? "is-current" : ""}>
            <span className="onboarding-dot" aria-hidden="true">{step.done ? "✓" : index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              {step.done && <span className="visually-hidden"> (selesai)</span>}
              <p>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="onboarding-categories" aria-label="Pilih layanan">
        {services.map((service) => (
          <Link key={service.code} to={`/brief?layanan=${service.code}`} className="category-card">
            <span className="service-number" aria-hidden="true">{service.number}</span>
            <strong>{service.title}</strong>
            <span className="muted">{service.forWho}</span>
          </Link>
        ))}
        <Link to="/brief?layanan=diskusi" className="category-card category-card-alt">
          <span className="service-number" aria-hidden="true">?</span>
          <strong>Belum yakin? Konsultasi</strong>
          <span className="muted">Ceritakan kebutuhanmu, kami arahkan ke layanan yang cocok.</span>
        </Link>
      </div>
      <Link to="/brief" className="button button-primary">
        Susun brief pertama <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

export function AccountPage() {
  usePageMeta({ title: "Akun — Embrilo", description: "Lihat permintaan brief dan status pengerjaan di akun Embrilo-mu." });
  const auth = useAuthState();
  const list = useAuthedGet<{ items: RequestItem[] }>(auth.status === "signed_in" ? "/api/v1/quote-requests" : null);

  return (
    <section className="section" aria-labelledby="account-title">
      <div className="container narrow">
        <SectionLabel>Akun</SectionLabel>
        <h1 id="account-title">Permintaanmu.</h1>
        {auth.status === "signed_in" ? (
          <>
            <div className="account-bar">
              <span>
                Masuk sebagai <strong>{auth.email ?? "akun tanpa email"}</strong>
              </span>
              <button type="button" className="button button-text" onClick={() => void auth.signOut()}>
                <LogOut size={16} aria-hidden="true" /> Keluar
              </button>
            </div>
            {list.loading ? (
              <p className="muted" role="status">Memuat permintaan…</p>
            ) : list.error ? (
              <div className="notice" role="alert">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>
                  {list.error}{" "}
                  <button type="button" className="button button-text" onClick={() => void list.reload()}>
                    <RefreshCw size={14} aria-hidden="true" /> Coba lagi
                  </button>
                </span>
              </div>
            ) : list.data && list.data.items.length > 0 ? (
              <ul className="request-list">
                {list.data.items.map((item) => (
                  <li key={item.public_ref}>
                    <Link to={`/akun/permintaan/${item.public_ref}`} className="request-row">
                      <span className="request-ref">{item.public_ref}</span>
                      <span className="request-title">{item.service_title}</span>
                      <span className="status status-soon">{item.status_label}</span>
                      <span className="request-date">{formatDate(item.created_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Onboarding name={auth.firstName ?? null} />
            )}
          </>
        ) : auth.status === "signed_out" ? (
          <SignedOutPrompt next="/akun" />
        ) : (
          <AuthNotice status={auth.status} />
        )}
      </div>
    </section>
  );
}

interface RequestDetail {
  public_ref: string;
  service: { title: string; proposed_scope: string; pricing_mode: string; revision_rounds: number };
  brief: { brand: string; product: string; audience: string; objective: string; platforms: string[]; tone: string; cta: string };
  status_label: string;
  os_sync: string;
  production: { label: string; message?: string } | null;
  created_at: string;
}

const OS_SYNC_TEXT: Record<string, string> = {
  synced: "Sudah diteruskan ke tim produksi Embrilo.",
  pending: "Sedang diteruskan ke tim produksi.",
  failed: "Belum berhasil diteruskan ke tim produksi. Sistem akan mencoba lagi saat halaman ini dibuka.",
  not_configured: "Tersimpan di Embrilo. Penerusan otomatis ke tim produksi belum aktif; brief ditinjau manual.",
};

export function RequestDetailPage({ refId }: { refId: string }) {
  usePageMeta({ title: `Permintaan ${refId} — Embrilo`, description: "Status permintaan brief di Embrilo." });
  const auth = useAuthState();
  const detail = useAuthedGet<RequestDetail>(auth.status === "signed_in" ? `/api/v1/quote-requests/${encodeURIComponent(refId)}` : null);

  return (
    <section className="section" aria-labelledby="detail-title">
      <div className="container narrow">
        <Link to="/akun" className="text-link">
          ← Semua permintaan
        </Link>
        <h1 id="detail-title" className="detail-title">
          {refId}
        </h1>
        {auth.status !== "signed_in" ? (
          auth.status === "signed_out" ? <SignedOutPrompt next={`/akun/permintaan/${refId}`} /> : <AuthNotice status={auth.status} />
        ) : detail.loading ? (
          <p className="muted" role="status">Memuat…</p>
        ) : detail.error || !detail.data ? (
          <p className="notice" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>{detail.error ?? "Permintaan tidak ditemukan."}</span>
          </p>
        ) : (
          <div className="detail-grid">
            <div className="brief-card">
              <p className="section-label">Status</p>
              <p className="detail-status">{detail.data.production?.label ?? detail.data.status_label}</p>
              {detail.data.production?.message && <p className="muted">{detail.data.production.message}</p>}
              <p className="muted">{OS_SYNC_TEXT[detail.data.os_sync] ?? ""}</p>
              <p className="muted">Dikirim {formatDate(detail.data.created_at)}</p>
            </div>
            <div className="brief-card">
              <p className="section-label">Layanan</p>
              <h2 className="detail-h2">{detail.data.service.title}</h2>
              <p>{detail.data.service.proposed_scope}</p>
              <p className="notice notice-inline">
                <Info size={16} aria-hidden="true" />
                {detail.data.service.pricing_mode === "quote"
                  ? "Ini permintaan penawaran. Belum ada tagihan; harga dan lingkup final dikirim setelah brief ditinjau."
                  : "Harga mengikuti paket yang dipilih."}
              </p>
              <dl className="review-list">
                <div><dt>Brand</dt><dd>{detail.data.brief.brand}</dd></div>
                <div><dt>Audiens</dt><dd>{detail.data.brief.audience}</dd></div>
                <div><dt>Tujuan</dt><dd>{detail.data.brief.objective}</dd></div>
                <div><dt>Platform</dt><dd>{detail.data.brief.platforms.join(", ")}</dd></div>
                <div><dt>Gaya bahasa</dt><dd>{detail.data.brief.tone}</dd></div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
