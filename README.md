# Embrilo — Public Layer

Website publik Embrilo, dikembangkan terpisah dari operasional internal Embrilo OS (trust boundary terpisah).

**Tujuan:** menjelaskan layanan paket konten short-form secara jujur dan membantu calon pelanggan menyusun brief yang jelas.

## URL
- **Produksi (Cloudflare Pages):** https://embrilo-public.pages.dev
- **GitHub:** https://github.com/Sparkmind-obp-off/Public-embrilo

## Stack
Vite 6 + React 18 + TypeScript (strict), CSS dengan design tokens, `lucide-react` untuk ikon, font variable di-host sendiri (`@fontsource-variable/fraunces`, `@fontsource-variable/manrope`). Vitest + Testing Library untuk test. Situs statis (SPA) di Cloudflare Pages — tidak ada backend, database, atau secret.

## Route
| Path | Isi |
|---|---|
| `/` | Hero, ringkasan layanan, proses, contoh ilustrasi, prinsip, FAQ, CTA |
| `/layanan` | Detail layanan: untuk siapa, yang diterima, tidak termasuk, input; tabel status fitur |
| `/cara-kerja` | 4 langkah dengan peran (Kamu / AI + tim / Tim Embrilo) dan cakupan tinjauan manusia |
| `/contoh` | Paket contoh untuk brand **fiktif**, berlabel jelas |
| `/brief` | Penyusun brief 4 langkah (`?layanan=script-pack\|storytelling-pack\|content-plan` untuk preselect) |
| `/faq`, `/privasi`, `/ketentuan` | FAQ; draf privasi & ketentuan (ditandai belum final) |
| lainnya | Halaman 404 |

Cloudflare Pages menyajikan `index.html` untuk path yang tidak dikenal (SPA fallback), sehingga deep link berfungsi.

## Fitur yang sudah selesai
- Design system: tokens warna/tipografi/spacing/radius/fokus/motion (`src/styles/tokens.css`)
- Navigasi responsif; menu mobile dengan `aria-expanded`, tutup via Escape, fokus kembali ke tombol
- Skip link, fokus dipindah ke konten saat ganti halaman, judul & meta description per halaman
- Accordion FAQ dan tab contoh sesuai pola WAI-ARIA (navigasi panah)
- **Penyusun brief**: field dikelompokkan (Produk → Audiens & tujuan → Arah konten → Tinjau), validasi per langkah, ringkasan error yang bisa diklik, batas panjang + penghitung karakter, deteksi data sensitif (password/OTP/token/nomor kartu), persetujuan hak & pemrosesan AI, peringatan sebelum meninggalkan halaman, hasil berupa ringkasan teks untuk **disalin / diunduh**
- `prefers-reduced-motion` dihormati; target sentuh ≥ 44px; input 16px (tanpa zoom di iOS)
- Security headers via `public/_headers` (CSP ketat tanpa sumber pihak ketiga, `X-Frame-Options: DENY`, `nosniff`, Referrer/Permissions-Policy)

## Batasan yang disengaja (belum aktif)
- **Pengiriman brief online belum aktif.** Brief tidak dikirim atau disimpan; UI menyatakannya secara eksplisit dan test memastikan tidak ada `fetch`.
- Status pesanan, pengambilan hasil, revisi, dan pembayaran belum ada — ditampilkan sebagai "Belum aktif".
- Harga & waktu pengerjaan belum dipublikasikan. Tidak ada testimoni, logo klien, atau statistik.
- Halaman privasi & ketentuan adalah draf dan perlu tinjauan hukum sebelum menerima data pelanggan.
- Canonical URL dan structured data belum dipasang sampai domain produksi final ditetapkan.

## Backend (v0.3) — status jujur per 2026-10-29
| Komponen | Status | Catatan |
|---|---|---|
| Pages Functions `/api/*` (Hono) | ✅ Live | `functions/api/[[path]].ts` → `server/app.ts` |
| Login Clerk (email terverifikasi + Google) | ⚠️ Development instance | `pk_test`/`sk_test`. Untuk production: buat Clerk production instance + domain sendiri, ganti `CLERK_PUBLISHABLE_KEY` & secret `CLERK_SECRET_KEY`, perbarui CSP `_headers` |
| Verifikasi sesi server-side | ✅ | `@clerk/backend` `verifyToken` + `authorizedParties`; gagal = 401 |
| Penyimpanan brief (D1) | ⛔ BLOCKED | Akun Cloudflare mencapai batas D1 (10). Tanpa binding `DB`, UI tetap mode lokal & menyatakannya |
| Konektor ke Embrilo OS (HMAC v1) | ⛔ Belum dikonfigurasi | Butuh `OS_CONNECTOR_URL` + `CONNECTOR_HMAC_SECRET` yang sama dengan OS |
| Duitku Pop (production) | ⛔ BLOCKED | Kredensial ditolak server production Duitku (`Merchant Not Found`). Kill switch `PAYMENTS_ENABLED=false`. Tidak ada endpoint checkout aktif, tidak ada tagihan yang bisa dibuat |

### API
`GET /api/v1/health`, `GET /api/v1/config`, `GET /api/v1/catalog` (publik) ·
`GET /api/v1/me`, `POST /api/v1/quote-requests` (Idempotency-Key wajib), `GET /api/v1/quote-requests[/:ref]` (Bearer Clerk) ·
`POST /api/v1/payment-callbacks/duitku` (HMAC resmi + cek ulang `transactionStatus`, idempotent).

### Secrets (Cloudflare Pages, tidak pernah di repo)
`CLERK_SECRET_KEY`, `DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY`, (nanti) `CONNECTOR_HMAC_SECRET`. Lokal: `.dev.vars` (gitignored).

### Mengaktifkan penyimpanan (setelah ada slot D1)
```bash
npx wrangler d1 create embrilo-public-production   # salin database_id ke wrangler.jsonc (binding "DB")
npx wrangler d1 migrations apply embrilo-public-production --remote
```

## Langkah pengembangan berikutnya
1. Implementasi `POST /v1/public/requests` server-side (Pages Functions/Hono) sesuai `docs/04-public-api-contract.md`, dengan idempotency key dan konektor terautentikasi ke Embrilo OS.
2. Ganti langkah akhir brief dengan pengiriman sungguhan; sukses hanya setelah konfirmasi 201/replay.
3. Status & pengiriman hasil yang terikat ke pelanggan (bukan hanya referensi).
4. Tinjauan hukum privasi/ketentuan; tetapkan domain lalu tambah canonical/sitemap.

## Menjalankan
```bash
npm install
npm run dev         # dev server
npm run typecheck   # tsc -b
npm test            # vitest (unit + integration)
npm run build       # tsc -b && vite build → dist/
npm run check       # semuanya
```

## Deployment
- Platform: Cloudflare Pages (static), build `npm run build`, output `dist`, production branch `main`
- Deploy manual: `npx wrangler pages deploy dist --project-name embrilo-public --branch main`
- Status: ✅ Live di https://embrilo-public.pages.dev (proyek Pages `embrilo-public`, branch `main`)
- Proyek ini **terpisah** dari proyek Pages `embrilo-os` (internal). Jangan gunakan konfigurasi atau secret internal di sini.

## Dokumentasi
`docs/00`–`docs/08` (source of truth, positioning, arsitektur, IA/UX, API contract, privasi/keamanan, roadmap, runbook, premium UI system) dan `prompts/`.

## Security boundary
Website publik dan Embrilo OS adalah trust boundary terpisah. Jangan pernah mengekspos master prompt internal, kredensial provider, kontrol admin, data pelanggan privat, atau akses langsung D1/R2 ke browser.
