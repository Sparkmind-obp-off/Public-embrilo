import { ArrowUpRight, Check, Minus, AlertTriangle } from "lucide-react";
import { ClosingCta, PageHero, SectionLabel } from "../components/Layout";
import { FaqList } from "../components/FaqList";
import { StepList } from "../components/StepList";
import { DemoPack } from "../components/DemoPack";
import { faqs, services } from "../lib/content";
import { Link, usePageMeta } from "../lib/router";

export function ServicesPage() {
  usePageMeta({
    title: "Layanan — Embrilo",
    description:
      "Paket skrip video pendek, storytelling produk, dan rencana konten mingguan. Lihat apa yang termasuk, apa yang tidak, dan informasi yang perlu kamu siapkan.",
  });

  return (
    <>
      <PageHero
        label="Layanan"
        title={
          <>
            Lingkup yang jelas, <em>sebelum</em> kamu memulai.
          </>
        }
        lede="Setiap layanan menjelaskan untuk siapa, apa yang kamu terima, apa yang tidak termasuk, dan informasi apa yang perlu kamu siapkan."
      >
        <p className="notice notice-inline">
          <AlertTriangle size={16} aria-hidden="true" />
          Harga dan waktu pengerjaan belum dipublikasikan karena masih divalidasi.
        </p>
      </PageHero>

      <section className="section section-tight" aria-label="Daftar layanan">
        <div className="container service-detail-list">
          {services.map((service) => (
            <article key={service.code} className="service-detail" id={service.code} aria-labelledby={`detail-${service.code}`}>
              <header className="service-detail-head">
                <span className="service-number" aria-hidden="true">
                  {service.number}
                </span>
                <div>
                  <h2 id={`detail-${service.code}`}>{service.title}</h2>
                  <p>{service.summary}</p>
                  <p className="service-for">
                    <strong>Cocok untuk:</strong> {service.forWho}
                  </p>
                </div>
              </header>
              <div className="service-detail-cols">
                <div>
                  <h3>Yang kamu terima</h3>
                  <ul className="check-list">
                    {service.deliverables.map((item) => (
                      <li key={item}>
                        <Check size={16} aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Tidak termasuk</h3>
                  <ul className="check-list check-list-muted">
                    {service.excludes.map((item) => (
                      <li key={item}>
                        <Minus size={16} aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Siapkan informasi</h3>
                  <ul className="plain-list">
                    {service.inputs.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <Link to={`/brief?layanan=${service.code}`} className="button button-primary">
                Susun brief untuk layanan ini <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-tint" aria-labelledby="roadmap-title">
        <div className="container roadmap">
          <div>
            <SectionLabel>Status</SectionLabel>
            <h2 id="roadmap-title">Yang sudah dan belum tersedia.</h2>
          </div>
          <dl className="status-table">
            <div>
              <dt>Informasi layanan & contoh format</dt>
              <dd className="status status-live">Tersedia</dd>
            </div>
            <div>
              <dt>Penyusun brief terpandu (salin / unduh)</dt>
              <dd className="status status-live">Tersedia</dd>
            </div>
            <div>
              <dt>Masuk dengan email atau Google</dt>
              <dd className="status status-soon">Uji coba</dd>
            </div>
            <div>
              <dt>Pengiriman brief online</dt>
              <dd className="status status-soon">Belum aktif</dd>
            </div>
            <div>
              <dt>Pelacakan status & pengambilan hasil</dt>
              <dd className="status status-soon">Belum aktif</dd>
            </div>
            <div>
              <dt>Pembayaran online</dt>
              <dd className="status status-soon">Belum aktif</dd>
            </div>
          </dl>
        </div>
      </section>

      <ClosingCta />
    </>
  );
}

export function ProcessPage() {
  usePageMeta({
    title: "Cara kerja — Embrilo",
    description:
      "Dari brief ke paket konten: kamu menyusun brief, draf disusun dengan bantuan AI, ditinjau manusia, lalu diserahkan. Lihat peran setiap langkah.",
  });

  return (
    <>
      <PageHero
        label="Cara kerja"
        title={
          <>
            Empat langkah, <em>satu tanggung jawab</em> yang jelas.
          </>
        }
        lede="Kami memisahkan apa yang dibantu AI dan apa yang diputuskan manusia, agar kamu tahu persis bagaimana hasil disusun."
      />
      <section className="section section-tight" aria-label="Langkah-langkah">
        <div className="container narrow">
          <StepList detailed />
        </div>
      </section>
      <section className="section section-tint" aria-labelledby="review-title">
        <div className="container two-col">
          <div>
            <SectionLabel>Tinjauan manusia</SectionLabel>
            <h2 id="review-title">Apa yang diperiksa sebelum diserahkan.</h2>
          </div>
          <ul className="check-list check-list-large">
            <li>
              <Check size={18} aria-hidden="true" /> Kesesuaian dengan tujuan dan audiens di brief
            </li>
            <li>
              <Check size={18} aria-hidden="true" /> Konsistensi pesan antar ide dalam satu paket
            </li>
            <li>
              <Check size={18} aria-hidden="true" /> Klaim produk hanya berdasarkan fakta yang kamu berikan
            </li>
            <li>
              <Check size={18} aria-hidden="true" /> Bahasa yang natural untuk audiens Indonesia
            </li>
            <li>
              <Check size={18} aria-hidden="true" /> Batasan brand yang kamu tulis dihormati
            </li>
          </ul>
        </div>
      </section>
      <ClosingCta />
    </>
  );
}

export function ExamplesPage() {
  usePageMeta({
    title: "Contoh paket — Embrilo",
    description:
      "Contoh ilustrasi format paket skrip video pendek Embrilo untuk brand fiktif. Lihat hook, alur adegan, caption, dan CTA dalam satu paket.",
  });

  return (
    <>
      <PageHero
        label="Contoh"
        title={
          <>
            Format paket, <em>dalam satu tampilan.</em>
          </>
        }
        lede="Contoh di bawah dibuat untuk brand fiktif. Tujuannya menunjukkan struktur dan kedalaman paket — bukan hasil untuk pelanggan nyata."
      />
      <section className="section section-tight" aria-label="Contoh paket">
        <div className="container">
          <DemoPack />
        </div>
      </section>
      <ClosingCta title="Ingin paket seperti ini untuk produkmu?" />
    </>
  );
}

export function FaqPage() {
  usePageMeta({
    title: "FAQ — Embrilo",
    description: "Jawaban jujur tentang apa yang bisa dan belum bisa dilakukan Embrilo: brief, AI, harga, hasil, dan data.",
  });

  return (
    <>
      <PageHero
        label="FAQ"
        title={
          <>
            Jawaban yang <em>jujur</em>, termasuk soal batasan.
          </>
        }
        lede="Kalau pertanyaanmu belum terjawab di sini, tuliskan di bagian batasan atau catatan saat menyusun brief."
      />
      <section className="section section-tight" aria-label="Daftar pertanyaan">
        <div className="container narrow">
          <FaqList items={faqs} />
        </div>
      </section>
      <ClosingCta />
    </>
  );
}

function LegalDraftNotice() {
  return (
    <p className="notice">
      <AlertTriangle size={16} aria-hidden="true" />
      <span>
        <strong>Draf, belum final.</strong> Halaman ini menjelaskan praktik saat ini dan belum ditinjau secara hukum. Versi
        final akan diterbitkan sebelum website menerima data pelanggan.
      </span>
    </p>
  );
}

export function PrivacyPage() {
  usePageMeta({
    title: "Privasi — Embrilo",
    description: "Bagaimana website Embrilo memperlakukan data yang kamu ketik di penyusun brief.",
  });

  return (
    <>
      <PageHero label="Privasi" title="Privasi" lede="Ringkasan praktik data pada website publik Embrilo saat ini." />
      <section className="section section-tight">
        <div className="container prose">
          <LegalDraftNotice />
          <h2>Akun</h2>
          <p>
            Login dikelola oleh <strong>Clerk</strong> (penyedia layanan autentikasi). Saat kamu masuk dengan email atau
            Google, Clerk memproses alamat email dan data sesi untuk memverifikasi identitasmu. Embrilo menyimpan ID akun
            dari Clerk, alamat email, dan status verifikasinya. Kami tidak menerima password Google-mu. Membuat akun tidak
            mendaftarkanmu ke email promosi.
          </p>
          <h2>Brief yang kamu kirim</h2>
          <p>
            Jika pengiriman online aktif dan kamu menekan tombol kirim, isi brief disimpan di server Embrilo bersama akunmu
            agar bisa ditinjau dan kamu bisa melihat statusnya. Brief hanya dapat dilihat oleh akunmu dan tim Embrilo.
            Sebelum dikirim, penyusun brief berjalan di browsermu saja; draf disimpan sementara di tab yang sama hanya
            saat kamu beralih ke halaman masuk.
          </p>
          <p>
            Masa simpan data dan cara meminta penghapusan akan ditetapkan dalam versi final halaman ini. Sementara itu,
            permintaan penghapusan dapat disampaikan melalui kanal kontak resmi Embrilo.
          </p>
          <h2>Pelacakan dan cookie</h2>
          <p>Website ini tidak memasang cookie pelacakan atau skrip analitik pihak ketiga.</p>
          <h2>Layanan pihak ketiga</h2>
          <p>
            Font dan aset website disajikan dari domain ini sendiri. Skrip pihak ketiga hanya dimuat di halaman masuk, akun,
            dan brief, yaitu skrip login dari Clerk. Hosting dan penyimpanan disediakan oleh Cloudflare.
          </p>
          <h2>Jangan kirim data sensitif</h2>
          <p>
            Embrilo tidak pernah meminta password, kode OTP, cookie, atau akses akun media sosial. Jangan menuliskannya di
            brief atau mengirimkannya kepada siapa pun yang mengaku dari Embrilo.
          </p>
          <h2>Ke depan</h2>
          <p>
            Saat pengiriman brief online diaktifkan, halaman ini akan diperbarui untuk menjelaskan data apa yang
            dikumpulkan, tujuannya, penggunaan alat bantu AI, masa simpan, dan cara meminta penghapusan.
          </p>
        </div>
      </section>
    </>
  );
}

export function TermsPage() {
  usePageMeta({
    title: "Ketentuan — Embrilo",
    description: "Ketentuan penggunaan website publik Embrilo pada tahap saat ini.",
  });

  return (
    <>
      <PageHero label="Ketentuan" title="Ketentuan penggunaan" lede="Ketentuan singkat untuk website publik Embrilo pada tahap saat ini." />
      <section className="section section-tight">
        <div className="container prose">
          <LegalDraftNotice />
          <h2>Sifat website</h2>
          <p>
            Website ini memberikan informasi tentang layanan Embrilo dan alat bantu untuk menyusun brief. Menyusun brief di
            website ini bukan merupakan pemesanan, penawaran harga, atau perjanjian layanan.
          </p>
          <h2>Contoh konten</h2>
          <p>
            Contoh paket yang ditampilkan menggunakan brand fiktif dan hanya bersifat ilustrasi. Contoh tersebut bukan hasil
            pekerjaan untuk pelanggan nyata.
          </p>
          <h2>Tidak ada jaminan hasil</h2>
          <p>
            Embrilo tidak menjamin jumlah tayangan, jangkauan, viralitas, maupun penjualan dari konten apa pun. Kamu
            bertanggung jawab memeriksa ulang klaim produk sebelum mempublikasikan konten.
          </p>
          <h2>Materi milikmu</h2>
          <p>
            Pastikan kamu memiliki hak atas informasi, nama brand, dan materi yang kamu cantumkan di brief.
          </p>
        </div>
      </section>
    </>
  );
}

export function NotFoundPage() {
  usePageMeta({ title: "Halaman tidak ditemukan — Embrilo", description: "Halaman yang kamu cari tidak tersedia." });
  return (
    <section className="section not-found">
      <div className="container narrow">
        <SectionLabel>404</SectionLabel>
        <h1>Halaman ini tidak ditemukan.</h1>
        <p className="lede">Tautannya mungkin salah ketik atau halamannya sudah dipindahkan.</p>
        <div className="hero-actions">
          <Link to="/" className="button button-primary">
            Kembali ke beranda
          </Link>
          <Link to="/brief" className="button button-ghost">
            Susun brief
          </Link>
        </div>
      </div>
    </section>
  );
}
