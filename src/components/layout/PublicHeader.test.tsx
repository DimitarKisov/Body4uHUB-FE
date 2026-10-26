import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { renderScreen, tr } from "@/test/utils";

describe("PublicHeader", () => {
  it("Вход from a module page comes back to it", () => {
    renderScreen(<PublicHeader />, { url: "/articles?page=2" });
    expect(within(screen.getByRole("banner")).getByRole("link", { name: tr("home.login") })).toHaveAttribute(
      "href",
      `/login?returnTo=${encodeURIComponent("/articles?page=2")}`,
    );
  });

  it("Вход from the home page is a plain login link", () => {
    renderScreen(<PublicHeader />, { url: "/" });
    expect(within(screen.getByRole("banner")).getByRole("link", { name: tr("home.login") })).toHaveAttribute("href", "/login");
  });
});
