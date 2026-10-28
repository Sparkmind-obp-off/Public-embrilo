import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowDownRight, ArrowUpRight, Check, ChevronDown, CirclePlay, Clapperboard, Layers3, Menu, ShieldCheck, Sparkles, WandSparkles, X } from "lucide-react";
import "./styles.css";

const services = [
  { number: "01", icon: Clapperboard, title: "Short-form content pack", text: "Rangka ide video pendek dengan hook, alur cerita, arahan visual, dan CTA yang saling terhubung.", tags: ["TikTok", "Reels", "Shorts"] },
  { number: "02", icon: WandSparkles, title: "Creative direction", text: "Ubah produk dan tujuan kampanye menjadi sudut cerita serta arahan kreatif yang lebih jelas.", tags: ["Angle", "Tone", "Brief"] },
  { number: "03", icon: Layers3, title: "Content planning", text: "Susun ide ke dalam paket terstruktur agar proses produksi lebih mudah ditinjau dan dijalankan.", tags: ["Series", "Calendar", "Workflow"] },
];

const steps = [
  { number: "01", title: "Ceritakan kebutuhanmu", text: "Isi brief tentang produk, audiens, platform, dan tujuan konten." },
  { number: "02", title: "Kami tinjau dan susun", text: "Brief diperiksa. AI dapat membantu proses, dengan peninjauan manusia pada hasil." },
  { number: "03", title: "Terima paket konten", text: "Hasil yang disetujui disiapkan dengan arahan dan struktur yang mudah digunakan." },
];

const faqs = [
  { q: "Apakah Embrilo otomatis membuat dan mengunggah video?", a: "Belum. Fokus awal Embrilo adalah membantu menyusun paket konten dan arahan kreatif. Rendering video penuh dan auto-publishing belum termasuk dalam layanan awal." },
  { q: "Apakah hasilnya dibuat oleh AI?", a: "AI dapat membantu proses penyusunan. Hasil tetap perlu ditinjau manusia, dicek faktanya, dan disesuaikan dengan kebutuhan brand sebelum digunakan." },
  { q: "Apakah saya dijamin mendapat views atau penjualan?", a: "Tidak. Embrilo tidak menjanjikan viralitas, jangkauan, atau penjualan tertentu. Performa konten dipengaruhi banyak faktor di luar proses kreatif." },
  { q: "Apakah brief saya langsung masuk ke proses produksi?", a: "Tidak otomatis. Pengiriman brief pada antarmuka ini belum terhubung ke sistem penerimaan produksi. Jangan masukkan data rahasia atau informasi sensitif." },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [demoMessage, setDemoMessage] = useState(false);

  const goToBrief = () => {
    setMenuOpen(false);
    document.getElementById("brief")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="site-shell">
      <div className="announcement"><span className="announcement-dot" /> Ruang baru untuk ide yang ingin jadi nyata <ArrowUpRight size={14} /></div>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Embrilo, beranda"><span className="brand-mark"><Sparkles size={19} strokeWidth={2.3} /></span><span>embrilo<span className="brand-period">.</span></span></a>
        <button className="mobile-menu" aria-label={menuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"} aria-label="Navigasi utama">
          <a onClick={() => setMenuOpen(false)} href="#layanan">Layanan</a>
          <a onClick={() => setMenuOpen(false)} href="#cara-kerja">Cara kerja</a>
          <a onClick={() => setMenuOpen(false)} href="#tentang">Tentang</a>
          <button className="button button-dark nav-cta" onClick={goToBrief}>Mulai brief <ArrowUpRight size={16} /></button>
        </nav>
      </header>

      <main id="home">
        <section className="hero section-wrap">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> CREATIVE WORK, WITH CLARITY</div>
            <h1>Ide bagus layak punya <span className="headline-accent">arah yang jelas.</span></h1>
            <p className="hero-lede">Dari cerita tentang produkmu menjadi konsep konten yang lebih terarah. Embrilo membantu bisnis dan kreator merapikan ide, brief, dan langkah kreatif berikutnya.</p>
            <div className="hero-actions"><button className="button button-dark button-large" onClick={goToBrief}>Ceritakan idemu <ArrowUpRight size={17} /></button><a className="text-link" href="#cara-kerja">Lihat cara kerja <ArrowDownRight size={16} /></a></div>
            <div className="hero-note"><span className="note-icon"><ShieldCheck size={17} /></span><span>AI-assisted, human-reviewed.<br /><strong>Jelas sejak brief pertama.</strong></span></div>
          </div>
          <div className="hero-visual" aria-label="Ilustrasi konsep paket konten" role="img">
            <div className="visual-topline"><span>EMBRILO / CREATIVE STUDIO</span><span>01 — 03</span></div>
            <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
            <div className="visual-glow" />
            <div className="visual-card card-back"><span className="mini-label">CONTENT DIRECTION</span><div className="fake-lines"><i /><i /><i /></div><div className="card-footer"><span>Draft / 02</span><span>↗</span></div></div>
            <div className="visual-card card-front"><div className="card-symbol"><CirclePlay size={24} /></div><span className="mini-label">THE BIG IDEA</span><h3>Make it<br /><em>meaningful.</em></h3><div className="card-bottom"><span className="pill">HOOK</span><span className="pill">STORY</span><span className="pill">CTA</span></div></div>
            <div className="floating-chip"><span className="chip-spark"><Sparkles size={14} /></span><span><strong>One clear direction</strong><small>Less guesswork, more focus.</small></span></div>
            <div className="visual-caption">IDEA → STRUCTURE → CREATION</div>
          </div>
          <div className="hero-bottom"><span>UNTUK BISNIS & KREATOR YANG SEDANG BERTUMBUH</span><span className="scroll-cue">SCROLL TO EXPLORE <ArrowDownRight size={14} /></span></div>
        </section>

        <section className="intro-band" id="tentang"><div className="section-wrap intro-inner"><span className="section-index">01 / OUR APPROACH</span><p>Ide tidak harus langsung sempurna. Yang dibutuhkan adalah <em>arah yang tepat</em> untuk mulai bergerak.</p><span className="intro-aside">Kejelasan sebelum produksi.<br />Konteks sebelum kreativitas.</span></div></section>

        <section className="services section-wrap" id="layanan">
          <div className="section-heading"><div><span className="section-index">02 / WHAT WE HELP WITH</span><h2>Mulai dari ide.<br /><span>Bergerak dengan arah.</span></h2></div><p>Fokus pada fondasi kreatif yang bisa ditinjau, diperbaiki, dan diteruskan ke proses produksi.</p></div>
          <div className="service-grid">{services.map((service) => { const Icon = service.icon; return <article className="service-card" key={service.number}><div className="service-card-top"><span className="service-number">{service.number}</span><span className="service-icon"><Icon size={21} strokeWidth={1.7} /></span></div><h3>{service.title}</h3><p>{service.text}</p><div className="tag-row">{service.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div><a className="card-arrow" href="#brief" aria-label={`Tanyakan tentang ${service.title}`}><ArrowUpRight size={18} /></a></article>; })}</div>
          <p className="service-footnote"><span className="small-star">✳</span> Lingkup dan ketersediaan layanan dikonfirmasi setelah brief ditinjau.</p>
        </section>

        <section className="process-section" id="cara-kerja"><div className="section-wrap process-inner"><div className="process-heading"><span className="section-index">03 / HOW IT WORKS</span><h2>Proses yang terasa<br /><em>lebih ringan.</em></h2><p>Langkah sederhana untuk mengubah konteks menjadi arahan yang bisa ditindaklanjuti.</p><button className="button button-light" onClick={goToBrief}>Mulai dari brief <ArrowUpRight size={16} /></button></div><div className="steps-list">{steps.map(step => <article className="step-row" key={step.number}><span className="step-number">{step.number}</span><div><h3>{step.title}</h3><p>{step.text}</p></div><ArrowUpRight className="step-arrow" size={19} /></article>)}<div className="human-review"><ShieldCheck size={19} /><p><strong>Keputusan tetap di tangan manusia.</strong><br />AI membantu proses, bukan menggantikan penilaian dan tanggung jawabmu.</p></div></div></div></section>

        <section className="faq-section section-wrap"><div className="faq-intro"><span className="section-index">04 / GOOD TO KNOW</span><h2>Jelas dari<br /><em>awal.</em></h2><p>Jawaban singkat untuk membantumu memahami apa yang bisa dan belum bisa dilakukan Embrilo.</p></div><div className="faq-list">{faqs.map((faq, i) => <article className={openFaq === i ? "faq-item faq-active" : "faq-item"} key={faq.q}><button className="faq-question" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}><span>{faq.q}</span><ChevronDown size={19} /></button>{openFaq === i && <p className="faq-answer">{faq.a}</p>}</article>)}</div></section>

        <section className="brief-section" id="brief"><div className="section-wrap brief-inner"><div className="brief-copy"><span className="section-index">05 / YOUR NEXT STEP</span><h2>Punya ide?<br /><em>Mari beri arah.</em></h2><p>Ceritakan kebutuhan kontenmu. Mulai dari konteks sederhana—kita bisa memperjelas langkah berikutnya setelah kebutuhannya dipahami.</p><div className="brief-trust"><ShieldCheck size={18} /><span>Hindari mengirim password, OTP, cookie, atau data rahasia.</span></div></div><form className="brief-form" onSubmit={(e) => { e.preventDefault(); setDemoMessage(true); }}><div className="form-heading"><span>START WITH CONTEXT</span><span className="form-step">01 / 01</span></div><label htmlFor="name">Nama atau nama brand</label><input id="name" name="name" placeholder="Contoh: Kopi Pagi" autoComplete="organization" required onChange={() => setDemoMessage(false)} /><label htmlFor="need">Apa yang ingin kamu buat?</label><select id="need" name="need" defaultValue="" required onChange={() => setDemoMessage(false)}><option value="" disabled>Pilih kebutuhan konten</option><option>Paket ide video pendek</option><option>Arah kreatif untuk produk</option><option>Perencanaan konten</option><option>Masih ingin berdiskusi</option></select><label htmlFor="context">Ceritakan sedikit tentang idemu</label><textarea id="context" name="context" placeholder="Produk, audiens, tujuan, atau tantangan yang ingin diselesaikan…" rows={4} required onChange={() => setDemoMessage(false)} /><button className="button button-dark button-submit" type="submit">Periksa brief <ArrowUpRight size={17} /></button>{demoMessage && <div className="form-notice" role="status"><Check size={17} /><span>Form sudah terisi, tetapi belum terhubung ke layanan pengiriman. Tidak ada data yang dikirim atau disimpan. Integrasi intake perlu diaktifkan sebelum menerima brief sungguhan.</span></div>}<p className="form-legal">Dengan melanjutkan, kamu memahami bahwa ini adalah formulir antarmuka awal, belum menjadi pengajuan layanan.</p></form></div></section>
      </main>

      <footer className="site-footer"><div className="section-wrap footer-main"><a className="brand footer-brand" href="#home"><span className="brand-mark"><Sparkles size={18} /></span><span>embrilo<span className="brand-period">.</span></span></a><p>Ideas, with direction.<br />Konten yang dimulai dari pemahaman.</p><div className="footer-links"><a href="#layanan">Layanan</a><a href="#cara-kerja">Cara kerja</a><a href="#brief">Mulai brief</a></div></div><div className="section-wrap footer-bottom"><span>© {new Date().getFullYear()} Embrilo</span><span>AI-assisted. Human-reviewed.</span><a href="#home">Kembali ke atas ↑</a></div></footer>
    </div>
  );
}

export default App;


const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
createRoot(rootElement).render(<App />);
