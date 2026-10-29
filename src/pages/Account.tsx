import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, Info, LogOut, RefreshCw } from "lucide-react";
import { SectionLabel } from "../components/Layout";
import { useAuthState } from "../auth/context";
import { apiFetch, type ApiErrorBody } from "../lib/config";
import { Link, useRouter, usePageMeta } from "../lib/router";

const SignInPanel = lazy(() => import("../auth/ClerkShell").then((m) => ({ default: m.SignInPanel })));

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

export function SignInPage() {
  usePageMeta({ title: "Masuk — Embrilo", description: "Masuk atau daftar ke Embrilo dengan email terverifikasi atau akun Google." });
  const auth = useAuthState();
  const { navigate } = useRouter();
  const next = safeNext(new URLSearchParams(window.location.search).get("next"));

  useEffect(() => {
    if (auth.status === "signed_in") navigate(next);
  }, [auth.status, navigate, next]);

  return (
    <section className="section auth-page" aria-labelledby="signin-title">
      <div className="container auth-grid">
        <div>
          <SectionLabel>Akun</SectionLabel>
          <h1 id="signin-title">Masuk ke Embrilo.</h1>
          <p className="lede">Gunakan email atau akun Google. Akun dipakai untuk mengirim brief dan melihat status permintaanmu.</p>
          <ul className="check-list auth-points">
            <li>Email harus diverifikasi sebelum brief bisa dikirim.</li>
            <li>Kami tidak mendaftarkanmu ke email promosi.</li>
            <li>Kami tidak pernah meminta password media sosial atau kode OTP.</li>
          </ul>
        </div>
        <div className="auth-card">
          {auth.status === "signed_out" ? (
            <Suspense fallback={<p className="muted">Memuat formulir masuk…</p>}>
              <SignInPanel redirectUrl={next} />
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
        Masuk atau daftar
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
              <div className="brief-card empty-state">
                <p>Belum ada permintaan. Mulai dengan menyusun brief pertamamu.</p>
                <Link to="/brief" className="button button-primary">
                  Susun brief <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
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
