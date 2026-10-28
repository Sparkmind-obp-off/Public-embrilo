import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    target: "es2020",
    // Never inline fonts as data: URIs — the CSP only allows same-origin fonts.
    assetsInlineLimit: (file: string) => (file.endsWith(".woff2") ? false : undefined),
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
