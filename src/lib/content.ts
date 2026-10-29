/**
 * Public, customer-facing copy for Embrilo.
 * Rules (see docs/00, docs/03, docs/08):
 * - No invented prices, turnaround, statistics, testimonials or client logos.
 * - Demo material must be visibly labelled as illustrative.
 * - Distinguish what is available today from what is still on the roadmap.
 */

export type ServiceCode = "script-pack" | "storytelling-pack" | "content-plan";

/**
 * Commercial terms. Prices are NOT approved yet (docs/embrilo-blueprint-v1/25, 27),
 * so every offer is quote-required. The server treats this file as the
 * authoritative offer snapshot; browser-supplied prices are always ignored.
 */
export type Pricing = { mode: "quote" } | { mode: "fixed"; amount: number; currency: "IDR" };

export interface Service {
  code: ServiceCode;
  /** Code understood by Embrilo OS connector (docs/09-connector-contract.md in OS repo). */
  osServiceCode: "SCRIPT_PACK" | "PRODUCT_STORY" | "CONTENT_CALENDAR";
  offerVersion: string;
  pricing: Pricing;
  /** Proposed scope shown to customers; confirmed in the written quote. */
  proposedScope: string;
  revisionRounds: number;
  number: string;
  title: string;
  summary: string;
  forWho: string;
  deliverables: string[];
  excludes: string[];
  inputs: string[];
}

export const services: Service[] = [
  {
    code: "script-pack",
    osServiceCode: "SCRIPT_PACK",
    offerVersion: "script-pack@2026-10",
    pricing: { mode: "quote" },
    proposedScope: "Usulan awal: 5 skrip siap rekam untuk satu produk atau kampanye.",
    revisionRounds: 2,
    number: "01",
    title: "Paket skrip video pendek",
    summary:
      "Kumpulan ide video pendek yang saling terhubung: hook pembuka, alur adegan, arahan visual, caption, dan CTA.",
    forWho: "Bisnis kecil dan kreator yang rutin membuat konten TikTok, Reels, atau Shorts.",
    deliverables: [
      "Hook pembuka untuk tiap ide video",
      "Alur adegan singkat (urutan shot)",
      "Arahan visual dan teks di layar",
      "Draf caption dan CTA",
    ],
    excludes: ["Syuting, editing, atau rendering video", "Unggah otomatis ke media sosial"],
    inputs: ["Deskripsi produk", "Target audiens", "Platform tujuan", "Fakta produk yang sudah diverifikasi"],
  },
  {
    code: "storytelling-pack",
    osServiceCode: "PRODUCT_STORY",
    offerVersion: "storytelling-pack@2026-10",
    pricing: { mode: "quote" },
    proposedScope: "Usulan awal: 3 sudut cerita, pesan utama, panduan tone, dan 2 contoh skrip untuk satu produk.",
    revisionRounds: 2,
    number: "02",
    title: "Paket storytelling produk",
    summary:
      "Sudut cerita dan arahan kreatif agar produkmu disampaikan dengan pesan yang lebih jelas dan konsisten.",
    forWho: "Brand yang punya produk bagus tetapi belum menemukan cara bercerita yang pas.",
    deliverables: [
      "Beberapa alternatif sudut cerita (angle)",
      "Rekomendasi tone dan gaya bahasa",
      "Pesan utama dan poin pendukung",
      "Contoh penerapan dalam format konten pendek",
    ],
    excludes: ["Desain identitas visual atau logo", "Jaminan peningkatan penjualan"],
    inputs: ["Cerita dan keunggulan produk", "Audiens", "Batasan brand (hal yang harus dihindari)"],
  },
  {
    code: "content-plan",
    osServiceCode: "CONTENT_CALENDAR",
    offerVersion: "content-plan@2026-10",
    pricing: { mode: "quote" },
    proposedScope: "Usulan awal: 12 ide konten untuk 4 minggu (3 per minggu) beserta kalender CSV.",
    revisionRounds: 2,
    number: "03",
    title: "Rencana konten mingguan",
    summary:
      "Ide konten yang disusun menjadi rencana terstruktur sehingga lebih mudah ditinjau, dibagi, dan dijalankan tim.",
    forWho: "Tim kecil yang ingin ritme posting lebih teratur tanpa kehabisan ide.",
    deliverables: [
      "Daftar ide konten per minggu",
      "Tujuan dan format untuk setiap ide",
      "Catatan produksi singkat",
      "Struktur yang siap dipindahkan ke kalender tim",
    ],
    excludes: ["Pengelolaan akun media sosial", "Penjadwalan dan publikasi otomatis"],
    inputs: ["Tujuan bisnis", "Jadwal atau momen penting", "Platform yang digunakan"],
  },
];

export const serviceByCode = (code: string): Service | undefined =>
  services.find((service) => service.code === code);

export interface Step {
  number: string;
  title: string;
  text: string;
  actor: "Kamu" | "AI + tim" | "Tim Embrilo";
}

export const steps: Step[] = [
  {
    number: "01",
    title: "Kamu menyusun brief",
    text: "Ceritakan produk, audiens, platform, dan tujuan konten melalui formulir terpandu.",
    actor: "Kamu",
  },
  {
    number: "02",
    title: "Penyusunan draf",
    text: "Brief diolah menjadi draf paket konten. AI dapat membantu menyusun variasi ide dan struktur.",
    actor: "AI + tim",
  },
  {
    number: "03",
    title: "Tinjauan manusia",
    text: "Draf diperiksa: relevansi dengan brief, konsistensi pesan, dan kecocokan dengan fakta yang kamu berikan.",
    actor: "Tim Embrilo",
  },
  {
    number: "04",
    title: "Hasil diserahkan",
    text: "Paket yang sudah disetujui diserahkan dalam struktur yang mudah dibaca dan diteruskan ke produksi.",
    actor: "Tim Embrilo",
  },
];

export interface Faq {
  q: string;
  a: string;
}

export const faqs: Faq[] = [
  {
    q: "Apakah saya sudah bisa mengirim brief lewat website ini?",
    a: "Belum. Formulir brief saat ini membantu kamu menyusun dan merapikan kebutuhan, lalu menyalin atau mengunduh ringkasannya. Pengiriman online belum aktif, dan tidak ada data yang dikirim atau disimpan oleh website ini.",
  },
  {
    q: "Apakah Embrilo membuat dan mengunggah video secara otomatis?",
    a: "Tidak. Fokus Embrilo adalah paket konten dan arahan kreatif. Rendering video penuh dan auto-publishing tidak termasuk dalam layanan awal.",
  },
  {
    q: "Apakah hasilnya dibuat oleh AI?",
    a: "AI dapat membantu proses penyusunan. Hasil tetap ditinjau manusia dan sebaiknya kamu periksa kembali sebelum dipublikasikan, terutama klaim tentang produk.",
  },
  {
    q: "Berapa harga dan lama pengerjaannya?",
    a: "Harga dan waktu pengerjaan belum dipublikasikan karena masih divalidasi. Kami tidak ingin menjanjikan angka yang belum teruji.",
  },
  {
    q: "Apakah saya dijamin mendapat views atau penjualan?",
    a: "Tidak. Embrilo tidak menjanjikan viralitas, jangkauan, atau penjualan tertentu. Performa konten dipengaruhi banyak faktor di luar proses kreatif.",
  },
  {
    q: "Data apa yang sebaiknya tidak saya tulis di brief?",
    a: "Jangan menulis password, kode OTP, cookie, data pribadi pelanggan, atau informasi rahasia perusahaan. Brief cukup berisi informasi produk dan kebutuhan konten.",
  },
];

/** Clearly fictional, illustrative example — never presented as a customer result. */
export interface DemoIdea {
  id: string;
  label: string;
  hook: string;
  scenes: string[];
  caption: string;
  cta: string;
}

export const demoBrand = {
  name: "Kopi Senja",
  note: "Brand fiktif. Contoh ilustrasi untuk menunjukkan format paket, bukan hasil pelanggan.",
  product: "Kopi susu literan untuk stok di rumah",
  audience: "Pekerja muda yang sering lembur",
};

export const demoIdeas: DemoIdea[] = [
  {
    id: "ide-1",
    label: "Ide 01 · Relatable",
    hook: "“Jam 9 malam, kerjaan belum selesai, kopi di kulkas tinggal satu gelas…”",
    scenes: [
      "Close-up meja kerja berantakan, lampu redup",
      "Tangan membuka kulkas, botol kopi literan terlihat",
      "Menuang kopi ke gelas berisi es, suara es jelas",
      "Kembali ke laptop dengan ekspresi lega",
    ],
    caption: "Lembur itu pilihan, kehabisan kopi jangan. Satu botol untuk seminggu.",
    cta: "Simpan dulu untuk stok minggu depan.",
  },
  {
    id: "ide-2",
    label: "Ide 02 · Edukasi",
    hook: "“Tiga cara supaya kopi literan tetap enak sampai hari kelima.”",
    scenes: [
      "Teks di layar: Tips 1 — simpan di rak dalam, bukan di pintu kulkas",
      "Tips 2 — kocok sebelum dituang",
      "Tips 3 — tuang secukupnya, jangan kembalikan sisa ke botol",
      "Penutup: botol diletakkan rapi di kulkas",
    ],
    caption: "Biar setiap gelas rasanya tetap konsisten.",
    cta: "Bagikan ke teman yang suka stok kopi.",
  },
  {
    id: "ide-3",
    label: "Ide 03 · Behind the scene",
    hook: "“Ini yang terjadi sebelum kopimu sampai di rumah.”",
    scenes: [
      "Proses menyeduh kopi dalam jumlah besar",
      "Pencampuran susu dan pengisian botol",
      "Label ditempel dan botol dikemas",
      "Kurir mengambil paket di depan toko",
    ],
    caption: "Dibuat dalam batch kecil, dikirim dalam kondisi dingin.",
    cta: "Tanya varian yang tersedia minggu ini.",
  },
];
