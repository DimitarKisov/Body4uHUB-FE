import { describe, expect, it } from "vitest";
import { readPaging } from "@/lib/pagination";

const read = (qs: string) => readPaging(new URLSearchParams(qs));

describe("readPaging", () => {
  it("reads page and size from the URL", () => {
    expect(read("page=3&size=25")).toEqual({ page: 3, size: 25 });
  });

  it("defaults to page 1 and 10 per page", () => {
    expect(read("")).toEqual({ page: 1, size: 10 });
  });

  it.each(["page=0", "page=-2", "page=1.5", "page=abc"])("falls back to page 1 for %s", (qs) => {
    expect(read(qs).page).toBe(1);
  });

  it.each(["size=7", "size=1000", "size=x"])("falls back to the default size for %s", (qs) => {
    expect(read(qs).size).toBe(10);
  });
});
