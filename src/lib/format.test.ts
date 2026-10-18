import { describe, expect, it } from "vitest";
import { formatDate, formatPhone, parseUtc } from "@/lib/format";

describe("parseUtc", () => {
  it("treats a zone-less backend timestamp as UTC", () => {
    expect(parseUtc("2026-01-03T22:30:00").toISOString()).toBe("2026-01-03T22:30:00.000Z");
  });

  it("keeps an explicit zone", () => {
    expect(parseUtc("2026-01-03T22:30:00Z").toISOString()).toBe("2026-01-03T22:30:00.000Z");
    expect(parseUtc("2026-01-03T22:30:00+02:00").toISOString()).toBe("2026-01-03T20:30:00.000Z");
  });
});

describe("formatDate", () => {
  it("formats as dd.mm.yyyy without the trailing „г.“", () => {
    expect(formatDate("2026-01-03T12:00:00")).toMatch(/^03\.01\.2026$/);
  });
});

describe("formatPhone", () => {
  it("groups a 10-digit number as 0888 123 456", () => {
    expect(formatPhone("0888123456")).toBe("0888 123 456");
  });

  it("leaves other shapes as stored", () => {
    expect(formatPhone("+359888123456")).toBe("+359888123456");
  });
});
