import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChangePasswordPage } from "@/pages/account/ChangePasswordPage";
import { mockApi, renderScreen, signIn, tr } from "@/test/utils";

beforeEach(() => signIn());

async function change(current: string, next: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(tr("f.currentPassword")), current);
  await user.type(screen.getByLabelText(tr("f.newPassword")), next);
  await user.click(screen.getByRole("button", { name: tr("pw.submit") }));
}

describe("ChangePasswordPage", () => {
  it("rejects a new password equal to the current one without calling the API", async () => {
    const fetchMock = mockApi({ status: 204 });
    renderScreen(<ChangePasswordPage />, { url: "/security" });
    await change("Parola1!", "Parola1!");
    expect(await screen.findByText(tr("pw.err.same"))).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a wrong current password (422) under its field and keeps the session", async () => {
    mockApi({ status: 422, body: { detail: "Current password is incorrect." } });
    renderScreen(<ChangePasswordPage />, { url: "/security" });
    await change("Wrong1!x", "Parola2!");
    expect(await screen.findByText(tr("pw.err.wrong"))).toBeInTheDocument();
    expect(sessionStorage.getItem("b4u.session")).not.toBeNull();
  });

  it("clears the form after a successful change", async () => {
    mockApi({ status: 204 });
    renderScreen(<ChangePasswordPage />, { url: "/security" });
    await change("Parola1!", "Parola2!");
    await vi.waitFor(() => expect(screen.getByLabelText(tr("f.currentPassword"))).toHaveValue(""));
  });

  it("locks the button after too many attempts (429)", async () => {
    mockApi({ status: 429 });
    renderScreen(<ChangePasswordPage />, { url: "/security" });
    await change("Parola1!", "Parola2!");
    expect(await screen.findByText(tr("password.err.429.t"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: tr("pw.submit") })).toBeDisabled();
  });
});
