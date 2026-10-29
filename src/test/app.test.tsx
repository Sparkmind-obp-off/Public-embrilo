import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App, routes } from "../App";

const renderAt = (path: string) => {
  window.history.replaceState(null, "", path);
  return render(<App />);
};

describe("routing", () => {
  it.each(Object.keys(routes))("renders %s with a single h1", (path) => {
    renderAt(path);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("renders a 404 page for unknown paths", () => {
    renderAt("/tidak-ada");
    expect(screen.getByRole("heading", { level: 1, name: /tidak ditemukan/i })).toBeInTheDocument();
  });

  it("navigates client-side via header links and updates the title", async () => {
    const user = userEvent.setup();
    renderAt("/");
    const nav = screen.getByRole("navigation", { name: "Navigasi utama" });
    await user.click(within(nav).getByRole("link", { name: "Layanan" }));
    expect(window.location.pathname).toBe("/layanan");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Lingkup yang jelas/);
    expect(document.title).toBe("Layanan — Embrilo");
  });

  it("every internal link points to a known route", () => {
    for (const path of Object.keys(routes)) {
      const { unmount } = renderAt(path);
      for (const link of screen.getAllByRole("link")) {
        const href = link.getAttribute("href") ?? "";
        if (href.startsWith("#")) continue;
        const target = href.split(/[?#]/)[0];
        expect(Object.keys(routes), `${path} → ${href}`).toContain(target);
      }
      unmount();
    }
  });
});

describe("navigation & disclosure", () => {
  it("mobile menu toggle exposes expanded state and closes on Escape", async () => {
    const user = userEvent.setup();
    renderAt("/");
    const toggle = screen.getByRole("button", { name: "Buka menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("FAQ accordion toggles aria-expanded and panel visibility", async () => {
    const user = userEvent.setup();
    renderAt("/faq");
    const trigger = screen.getByRole("button", { name: /Berapa harga/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Harga dan waktu pengerjaan belum dipublikasikan karena masih divalidasi\. Kami/)).toBeVisible();
  });

  it("demo tabs support arrow-key navigation and are labelled as illustrative", async () => {
    const user = userEvent.setup();
    renderAt("/contoh");
    expect(screen.getAllByText(/brand fiktif/i).length).toBeGreaterThan(0);
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[0]);
    await user.keyboard("{ArrowRight}");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveFocus();
  });
});

describe("brief builder", () => {
  it("preselects the service from the query string", () => {
    renderAt("/brief?layanan=content-plan");
    expect(screen.getByRole("radio", { name: /Rencana konten mingguan/ })).toBeChecked();
  });

  it("blocks progress and lists errors when required fields are empty", async () => {
    const user = userEvent.setup();
    renderAt("/brief");
    await user.click(screen.getByRole("button", { name: /Lanjut/ }));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/Periksa 3 isian/);
    expect(screen.getByLabelText(/Nama brand/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Langkah 1 dari 4")).toBeInTheDocument();
  });

  it("completes all steps and produces a local summary without submitting anything", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify({ intake_enabled: false, clerk_publishable_key: null }), { status: 200 }));
    const user = userEvent.setup();
    renderAt("/brief?layanan=script-pack");

    await user.type(screen.getByLabelText(/Nama brand/), "Kopi Senja");
    await user.type(screen.getByLabelText(/Tentang produk/), "Kopi susu literan, dibuat batch kecil setiap pagi untuk stok.");
    await user.click(screen.getByRole("button", { name: /Lanjut/ }));

    expect(screen.getByText("Langkah 2 dari 4")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^Audiens/, { selector: "textarea" }), "Pekerja muda yang sering lembur");
    await user.selectOptions(screen.getByLabelText(/Tujuan utama/), "Edukasi tentang produk");
    await user.click(screen.getByRole("checkbox", { name: "TikTok" }));
    await user.click(screen.getByRole("button", { name: /Lanjut/ }));

    await user.selectOptions(screen.getByLabelText(/Gaya bahasa/), "Profesional");
    await user.click(screen.getByRole("button", { name: /Lanjut/ }));

    expect(screen.getByText("Langkah 4 dari 4")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Buat ringkasan/ }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Periksa 2 isian/);

    await user.click(screen.getByRole("checkbox", { name: /hak atas nama brand/ }));
    await user.click(screen.getByRole("checkbox", { name: /bantuan AI/ }));
    await user.click(screen.getByRole("button", { name: /Buat ringkasan/ }));

    expect(screen.getByRole("heading", { name: "Ringkasan brief siap." })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/belum dikirim ke Embrilo/);
    expect(screen.getByLabelText("Ringkasan brief")).toHaveTextContent(/Kopi Senja/);
    expect(screen.queryByText(/berhasil dikirim/i)).not.toBeInTheDocument();
    const writes = fetchSpy.mock.calls.filter(([, init]) => (init?.method ?? "GET").toUpperCase() !== "GET");
    expect(writes).toHaveLength(0);
    fetchSpy.mockRestore();
  });
});
