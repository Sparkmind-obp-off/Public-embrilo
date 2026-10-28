# Embrilo — Public Layer

Website publik Embrilo, dikembangkan terpisah dari operasional internal Embrilo OS (trust boundary terpisah).

**Tujuan:** menjelaskan layanan paket konten short-form secara jujur dan membantu calon pelanggan menyusun brief yang jelas.

## URL
- **Produksi (Cloudflare Pages):** lihat bagian *Deployment* di bawah
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
- Proyek ini **terpisah** dari proyek Pages `embrilo-os` (internal). Jangan gunakan konfigurasi atau secret internal di sini.

## Dokumentasi
`docs/00`–`docs/08` (source of truth, positioning, arsitektur, IA/UX, API contract, privasi/keamanan, roadmap, runbook, premium UI system) dan `prompts/`.

## Security boundary
Website publik dan Embrilo OS adalah trust boundary terpisah. Jangan pernah mengekspos master prompt internal, kredensial provider, kontrol admin, data pelanggan privat, atau akses langsung D1/R2 ke browser.
