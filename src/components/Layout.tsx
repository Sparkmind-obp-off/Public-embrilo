import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Link, useRouter } from "../lib/router";

export const navItems = [
  { to: "/layanan", label: "Layanan" },
  { to: "/cara-kerja", label: "Cara kerja" },
  { to: "/contoh", label: "Contoh" },
  { to: "/faq", label: "FAQ" },
];

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-lockup">
      <svg className="brand-glyph" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect width="32" height="32" rx="9" fill="currentColor" />
        <path d="M10 10.5h11M10 16h8M10 21.5h11" stroke="var(--color-lime)" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span className="brand-word">
          embrilo<span className="brand-dot">.</span>
        </span>
      )}
    </span>
  );
}

function SiteHeader() {
  const { path } = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("menu-locked");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("menu-locked");
    };
  }, [open]);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="Embrilo — beranda">
          <BrandMark />
        </Link>

        <nav id="primary-nav" className={`primary-nav${open ? " is-open" : ""}`} aria-label="Navigasi utama">
          <ul>
            {navItems.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={`nav-link${path === item.to ? " is-active" : ""}`}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/brief" className="button button-primary nav-cta">
            Susun brief <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-controls="primary-nav"
          aria-expanded={open}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>
      {open && <div className="nav-scrim" aria-hidden="true" onClick={() => setOpen(false)} />}
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="brand brand-inverse" aria-label="Embrilo — beranda">
            <BrandMark />
          </Link>
          <p>Paket konten short-form dari brief yang jelas. Disusun dengan bantuan AI, ditinjau manusia.</p>
        </div>
        <nav aria-label="Navigasi footer" className="footer-nav">
          <div>
            <h2 className="footer-heading">Jelajahi</h2>
            <ul>
              {navItems.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
              <li>
                <Link to="/brief">Susun brief</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="footer-heading">Informasi</h2>
            <ul>
              <li>
                <Link to="/privasi">Privasi</Link>
              </li>
              <li>
                <Link to="/ketentuan">Ketentuan</Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Embrilo</span>
        <span>AI-assisted · Human-reviewed</span>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        Langsung ke konten
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function SectionLabel({ index, children }: { index?: string; children: ReactNode }) {
  return (
    <p className="section-label">
      {index && <span className="section-label-index">{index}</span>}
      <span>{children}</span>
    </p>
  );
}

export function ClosingCta({ title, text }: { title?: string; text?: string }) {
  return (
    <section className="closing-cta" aria-labelledby="closing-cta-title">
      <div className="container closing-inner">
        <div>
          <h2 id="closing-cta-title">{title ?? "Mulai dari brief yang rapi."}</h2>
          <p>
            {text ??
              "Susun kebutuhan kontenmu dalam empat langkah singkat. Hasilnya berupa ringkasan brief yang bisa kamu salin atau unduh."}
          </p>
        </div>
        <Link to="/brief" className="button button-lime button-large">
          Susun brief sekarang <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export function PageHero({ label, title, lede, children }: { label: string; title: ReactNode; lede: string; children?: ReactNode }) {
  return (
    <section className="page-hero">
      <div className="container">
        <SectionLabel>{label}</SectionLabel>
        <h1>{title}</h1>
        <p className="lede">{lede}</p>
        {children}
      </div>
    </section>
  );
}
