import { ArrowRight, ArrowUpRight, Check, ShieldCheck, UserCheck, Lock, FileText } from "lucide-react";
import { ClosingCta, SectionLabel } from "../components/Layout";
import { FaqList } from "../components/FaqList";
import { ServiceCard } from "../components/ServiceCard";
import { StepList } from "../components/StepList";
import { DemoPack } from "../components/DemoPack";
import { faqs, services } from "../lib/content";
import { Link, usePageMeta } from "../lib/router";

export function HomePage() {
  usePageMeta({
    title: "Embrilo — Brief produkmu jadi paket konten short-form",
    description:
      "Embrilo membantu bisnis kecil dan kreator Indonesia mengubah brief produk menjadi paket ide, skrip, caption, dan CTA untuk video pendek. Dibantu AI, ditinjau manusia.",
  });

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-grid">
          <div className="hero-copy">
            <SectionLabel>Studio konten short-form</SectionLabel>
            <h1 id="hero-title">
              Brief produkmu, jadi <em>paket konten</em> yang siap diproduksi.
            </h1>
            <p className="lede">
              Embrilo membantu bisnis kecil dan kreator menyusun ide, skrip, caption, dan CTA untuk TikTok, Reels, dan
              Shorts — disusun dengan bantuan AI, lalu ditinjau manusia.
            </p>
            <div className="hero-actions">
              <Link to="/brief" className="button button-primary button-large">
                Susun brief <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/contoh" className="button button-ghost button-large">
                Lihat contoh paket
              </Link>
            </div>
            <ul className="hero-points" aria-label="Prinsip kerja">
              <li>
                <Check size={16} aria-hidden="true" /> Ditinjau manusia sebelum diserahkan
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Tanpa janji viral atau angka penjualan
              </li>
            </ul>
          </div>

          <figure className="hero-figure" aria-labelledby="hero-figure-caption">
            <div className="pack-preview">
              <div className="pack-preview-head">
                <span className="demo-badge">Contoh ilustrasi</span>
                <span className="pack-preview-meta">Paket skrip · 1 dari 3 ide</span>
              </div>
              <dl className="pack-preview-body">
                <div>
                  <dt>Hook</dt>
                  <dd>“Jam 9 malam, kerjaan belum selesai, kopi di kulkas tinggal satu gelas…”</dd>
                </div>
                <div>
                  <dt>Alur adegan</dt>
                  <dd>
                    <ol>
                      <li>Meja kerja, lampu redup</li>
                      <li>Buka kulkas, botol kopi terlihat</li>
                      <li>Tuang ke gelas berisi es</li>
                    </ol>
                  </dd>
                </div>
                <div className="pack-preview-half">
                  <dt>Caption</dt>
                  <dd>Lembur itu pilihan, kehabisan kopi jangan.</dd>
                </div>
                <div className="pack-preview-half">
                  <dt>CTA</dt>
                  <dd>Simpan untuk stok minggu depan.</dd>
                </div>
              </dl>
              <div className="pack-preview-foot">
                <span className="review-chip">
                  <UserCheck size={15} aria-hidden="true" /> Ditinjau manusia
                </span>
                <span className="pack-preview-format">TikTok · Reels · Shorts</span>
              </div>
            </div>
            <figcaption id="hero-figure-caption">
              Format salah satu ide dalam paket. Brand “Kopi Senja” adalah contoh fiktif.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="strip" aria-label="Yang kamu terima">
        <div className="container strip-inner">
          {["Hook pembuka", "Alur adegan", "Arahan visual", "Caption", "CTA"].map((item, index) => (
            <span key={item} className="strip-item">
              <span className="strip-index">{String(index + 1).padStart(2, "0")}</span>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="section" id="layanan" aria-labelledby="home-services-title">
        <div className="container">
          <header className="section-head">
            <div>
              <SectionLabel index="01">Layanan</SectionLabel>
              <h2 id="home-services-title">Tiga cara kami membantu.</h2>
            </div>
            <p>
              Setiap layanan menjelaskan apa yang kamu terima dan apa yang tidak termasuk. Harga dan waktu pengerjaan
              diinformasikan setelah divalidasi.
            </p>
          </header>
          <div className="service-grid">
            {services.map((service) => (
              <ServiceCard key={service.code} service={service} />
            ))}
          </div>
          <Link to="/layanan" className="text-link section-more">
            Bandingkan detail layanan <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="section section-ink" id="cara-kerja" aria-labelledby="home-process-title">
        <div className="container process-grid">
          <header className="process-head">
            <SectionLabel index="02">Cara kerja</SectionLabel>
            <h2 id="home-process-title">Jelas siapa mengerjakan apa.</h2>
            <p>
              AI membantu menyusun draf. Keputusan akhir tentang apa yang layak diserahkan tetap diambil manusia.
            </p>
            <Link to="/cara-kerja" className="button button-lime">
              Pelajari prosesnya <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </header>
          <StepList />
        </div>
      </section>

      <section className="section" id="contoh" aria-labelledby="home-demo-title">
        <div className="container">
          <header className="section-head">
            <div>
              <SectionLabel index="03">Contoh</SectionLabel>
              <h2 id="home-demo-title">Seperti apa isi paketnya?</h2>
            </div>
            <p>
              Contoh ini dibuat untuk brand fiktif agar kamu bisa menilai format dan kedalamannya. Bukan hasil untuk
              pelanggan nyata.
            </p>
          </header>
          <DemoPack />
        </div>
      </section>

      <section className="section section-tint" aria-labelledby="home-trust-title">
        <div className="container">
          <header className="section-head">
            <div>
              <SectionLabel index="04">Prinsip</SectionLabel>
              <h2 id="home-trust-title">Yang kami jaga sejak awal.</h2>
            </div>
          </header>
          <ul className="trust-grid">
            <li className="trust-item">
              <UserCheck size={22} aria-hidden="true" />
              <h3>Tinjauan manusia</h3>
              <p>Setiap paket diperiksa manusia sebelum diserahkan, bukan dikirim mentah dari mesin.</p>
            </li>
            <li className="trust-item">
              <ShieldCheck size={22} aria-hidden="true" />
              <h3>Klaim yang jujur</h3>
              <p>Tidak ada janji viral, jaminan penjualan, testimoni, atau statistik yang tidak bisa dibuktikan.</p>
            </li>
            <li className="trust-item">
              <Lock size={22} aria-hidden="true" />
              <h3>Data seperlunya</h3>
              <p>Brief cukup berisi informasi produk. Kami tidak pernah meminta password, OTP, atau akses akun.</p>
            </li>
            <li className="trust-item">
              <FileText size={22} aria-hidden="true" />
              <h3>Lingkup yang jelas</h3>
              <p>Setiap layanan menyebutkan apa yang termasuk dan apa yang tidak, sebelum kamu memulai.</p>
            </li>
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="home-faq-title">
        <div className="container faq-grid">
          <header>
            <SectionLabel index="05">FAQ</SectionLabel>
            <h2 id="home-faq-title">Pertanyaan yang sering muncul.</h2>
            <Link to="/faq" className="text-link">
              Semua pertanyaan <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </header>
          <FaqList items={faqs.slice(0, 4)} />
        </div>
      </section>

      <ClosingCta />
    </>
  );
}
