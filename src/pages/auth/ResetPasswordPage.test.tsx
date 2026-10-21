import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { mockApi, renderScreen, sentBody, tr } from "@/test/utils";

const URL = "/reset-password?token=abc&email=anna%40body4u.bg";
const open = (url = URL) => renderScreen(<ResetPasswordPage />, { url, path: "/reset-password" });

async function submit(password = "NovaParola1!") {
  const user = userEvent.setup();
  if (password) await user.type(screen.getByLabelText(tr("f.newPassword")), password);
  await user.click(screen.getByRole("button", { name: tr("reset.submit") }));
  return user;
}

describe("ResetPasswordPage", () => {
  it("goes straight to the invalid state without token or email", () => {
    const fetchMock = mockApi({ status: 204 });
    open("/reset-password?email=anna%40body4u.bg");
    expect(screen.getByRole("heading", { name: tr("reset.bad.t") })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: tr("reset.bad.cta") })).toHaveAttribute("href", "/forgot-password?email=anna%40body4u.bg");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends email + token from the URL and shows the success state (204)", async () => {
    const fetchMock = mockApi({ status: 204 });
    open();
    expect(document.querySelector('input[autocomplete="username"]')).toHaveValue("anna@body4u.bg");
    await submit();
    expect(await screen.findByRole("heading", { name: tr("reset.ok.t") })).toBeInTheDocument();
    expect(sentBody(fetchMock)).toEqual({ email: "anna@body4u.bg", token: "abc", newPassword: "NovaParola1!" });
    expect(screen.getByRole("link", { name: tr("reset.ok.cta") })).toHaveAttribute("href", "/login?email=anna%40body4u.bg&reason=reset");
  });

  it("checks the password rules before calling the API", async () => {
    const fetchMock = mockApi({ status: 204 });
    open();
    await submit("weak");
    expect(await screen.findByText(tr("v.password.rules"))).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the invalid state for an expired or used link (422)", async () => {
    mockApi({ status: 422, body: { title: "x", detail: "Invalid token" } });
    open();
    await submit();
    expect(await screen.findByRole("heading", { name: tr("reset.bad.t") })).toBeInTheDocument();
  });

  it("locks submit after too many attempts (429)", async () => {
    mockApi({ status: 429 });
    open();
    await submit();
    expect(await screen.findByText(tr("reset.err.429"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: tr("reset.submit") })).toBeDisabled();
  });

  it("keeps the typed password on a server error", async () => {
    mockApi({ status: 500 });
    open();
    await submit();
    expect(await screen.findByText(tr("err.500"))).toBeInTheDocument();
    expect(screen.getByLabelText(tr("f.newPassword"))).toHaveValue("NovaParola1!");
  });
});
