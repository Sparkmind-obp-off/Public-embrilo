import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Server tests run in the node environment (no DOM); only patch browser globals when present.
if (typeof window !== "undefined") {
  afterEach(() => {
    cleanup();
    window.history.replaceState(null, "", "/");
  });

  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }) as MediaQueryList;
  }
  window.scrollTo = () => undefined;
  Element.prototype.scrollIntoView = function () {};
}
