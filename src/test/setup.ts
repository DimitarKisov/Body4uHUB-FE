// Vitest setup: jest-dom matchers, Bulgarian i18n, and a clean DOM + storage between tests.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@/lib/i18n";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});
