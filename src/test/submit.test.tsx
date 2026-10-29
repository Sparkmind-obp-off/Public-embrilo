import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthContext, type AuthState } from "../auth/context";
import { RouterProvider } from "../lib/router";
import { BriefPage } from "../pages/Brief";
import { resetConfigCacheForTests } from "../lib/config";
import { safeNext } from "../pages/Account";

const CONFIG = { clerk_publishable_key: "pk_test_x", terms_version: "terms-2026-10-draft", intake_enabled: true, payments_enabled: false };

function renderBrief(auth: AuthState) {
  window.history.replaceState(null, "", "/brief?layanan=script-pack");
  return render(
    <RouterProvider>
      <AuthContext.Provider value={auth}>
        <BriefPage />
      </AuthContext.Provider>
    </RouterProvider>,
  );
}

async function fillBrief() {
  const user = userEvent.setup();
  await screen.findByText(/dikirim sebagai permintaan penawaran/);
  await user.type(screen.getByLabelText(/Nama brand/), "Kopi Senja");
  await user.type(screen.getByLabelText(/Tentang produk/), "Kopi susu literan, dibuat batch kecil setiap pagi untuk stok.");
  await user.click(screen.getByRole("button", { name: /Lanjut/ }));
  await user.type(screen.getByLabelText(/^Audiens/, { selector: "textarea" }), "Pekerja muda yang sering lembur");
  await user.selectOptions(screen.getByLabelText(/Tujuan utama/), "Edukasi tentang produk");
  await user.click(screen.getByRole("checkbox", { name: "TikTok" }));
  await user.click(screen.getByRole("button", { name: /Lanjut/ }));
  await user.selectOptions(screen.getByLabelText(/Gaya bahasa/), "Profesional");
  await user.click(screen.getByRole("button", { name: /Lanjut/ }));
  await user.click(screen.getByRole("checkbox", { name: /hak atas nama brand/ }));
  await user.click(screen.getByRole("checkbox", { name: /bantuan AI/ }));
  await user.click(screen.getByRole("button", { name: /Tinjau sebelum kirim/ }));
  return user;
}

const signedIn: AuthState = { status: "signed_in", email: "a@example.com", getToken: async () => "session-token-abcdefghijklmnop", signOut: async () => undefined };

describe("online brief submission", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    resetConfigCacheForTests();
    fetchMock = vi.fn(async (url: string) => (url === "/api/v1/config" ? new Response(JSON.stringify(CONFIG)) : new Response("{}", { status: 500 })));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows success only after the server confirms with a reference", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url === "/api/v1/config" ? new Response(JSON.stringify(CONFIG)) : new Response(JSON.stringify({ public_ref: "EMB-ABCDEFGH", status: "received" }), { status: 201 }),
    );
    renderBrief(signedIn);
    const user = await fillBrief();
    expect(screen.getByText(/Brief belum terkirim/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Kirim brief ke Embrilo/ }));
    expect(await screen.findByRole("heading", { name: "Brief terkirim." })).toBeInTheDocument();
    expect(screen.getByText("EMB-ABCDEFGH")).toBeInTheDocument();

    const post = fetchMock.mock.calls.find(([url]) => url === "/api/v1/quote-requests")!;
    const init = post[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(init.method).toBe("POST");
    expect(headers.get("Authorization")).toBe("Bearer session-token-abcdefghijklmnop");
    expect(headers.get("Idempotency-Key")).toMatch(/^brief-.{16,}/);
    const body = JSON.parse(String(init.body));
    expect(Object.keys(body).sort()).toEqual(["brief", "terms_version"]);
    expect(JSON.stringify(body)).not.toMatch(/amount|price/);
  });

  it("keeps input and the same idempotency key when the server fails", async () => {
    renderBrief(signedIn);
    const user = await fillBrief();
    await user.click(screen.getByRole("button", { name: /Kirim brief ke Embrilo/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/belum terkirim/i);
    expect(screen.queryByRole("heading", { name: "Brief terkirim." })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Kirim brief ke Embrilo/ }));
    const keys = fetchMock.mock.calls
      .filter(([url]) => url === "/api/v1/quote-requests")
      .map(([, init]) => new Headers((init as RequestInit).headers).get("Idempotency-Key"));
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
  });

  it("asks a signed-out visitor to sign in instead of sending", async () => {
    renderBrief({ status: "signed_out" });
    await fillBrief();
    expect(screen.getByRole("button", { name: /Masuk untuk mengirim/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Kirim brief ke Embrilo/ })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/v1/quote-requests")).toHaveLength(0);
  });
});

describe("post-login redirect", () => {
  it("accepts only same-site relative paths", () => {
    expect(safeNext("/brief")).toBe("/brief");
    expect(safeNext("/akun/permintaan/EMB-ABCDEFGH")).toBe("/akun/permintaan/EMB-ABCDEFGH");
    expect(safeNext("https://evil.example")).toBe("/akun");
    expect(safeNext("//evil.example")).toBe("/akun");
    expect(safeNext("/x\\@evil")).toBe("/akun");
    expect(safeNext(null)).toBe("/akun");
  });
});
