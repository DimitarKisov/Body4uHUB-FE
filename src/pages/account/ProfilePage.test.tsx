import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePage } from "@/pages/account/ProfilePage";
import { mockApi, renderScreen, signIn, testUser, tr } from "@/test/utils";

beforeEach(() => signIn());

describe("ProfilePage", () => {
  it("shows the profile with formatted phone and date", async () => {
    mockApi({ status: 200, body: { ...testUser, phoneNumber: "0888123456", firstName: "Мария" } });
    renderScreen(<ProfilePage />, { url: "/profile" });
    expect(await screen.findByRole("heading", { name: "Мария Колева" })).toBeInTheDocument();
    expect(screen.getByText("0888 123 456")).toBeInTheDocument();
    expect(screen.getByText("03.01.2026")).toBeInTheDocument();
    // The session copy follows the server (top bar, role nav).
    expect(sessionStorage.getItem("b4u.session")).toContain("Мария");
  });

  it("offers a retry when loading fails", async () => {
    const fetchMock = mockApi({ status: 500 }, { status: 200, body: testUser });
    renderScreen(<ProfilePage />, { url: "/profile" });
    await userEvent.setup().click(await screen.findByRole("button", { name: tr("common.retry") }));
    expect(await screen.findByRole("heading", { name: "Анна Колева" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("signs out when the account no longer exists (404)", async () => {
    mockApi({ status: 404 });
    renderScreen(<ProfilePage />, { url: "/profile" });
    await vi.waitFor(() => expect(sessionStorage.getItem("b4u.session")).toBeNull());
  });
});
