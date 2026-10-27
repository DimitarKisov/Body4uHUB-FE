import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "@/pages/auth/LoginPage";
import { authResponse, mockApi, renderScreen, sentBody, testUser, tr } from "@/test/utils";

async function submit(email = "anna@body4u.bg", password = "Parola1!") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(tr("f.email")), email);
  await user.type(screen.getByLabelText(tr("f.password")), password);
  await user.click(screen.getByRole("button", { name: tr("login.submit") }));
  return user;
}

describe("LoginPage", () => {
  it("validates before calling the API", async () => {
    const fetchMock = mockApi({ status: 200 });
    renderScreen(<LoginPage />, { url: "/login" });
    await submit("anna", "x");
    expect(await screen.findByText(tr("v.email.format"))).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stores the session on success", async () => {
    const fetchMock = mockApi({ status: 200, body: authResponse() });
    renderScreen(<LoginPage />, { url: "/login" });
    await submit();
    expect(sentBody(fetchMock)).toEqual({ email: "anna@body4u.bg", password: "Parola1!", rememberMe: false });
    await vi.waitFor(() => expect(sessionStorage.getItem("b4u.session")).toContain(testUser.id));
  });

  it("\"Запомни ме\" (off by default) is sent as rememberMe", async () => {
    const fetchMock = mockApi({ status: 200, body: authResponse() });
    renderScreen(<LoginPage />, { url: "/login" });
    const remember = screen.getByRole("checkbox", { name: tr("login.remember") });
    expect(remember).not.toBeChecked();
    await userEvent.click(remember);
    await submit();
    expect(sentBody(fetchMock)).toMatchObject({ rememberMe: true });
  });

  it("shows one generic banner for wrong credentials (401)", async () => {
    mockApi({ status: 401, body: { title: "Unauthorized", detail: "Invalid email or password." } });
    renderScreen(<LoginPage />, { url: "/login" });
    await submit();
    expect(await screen.findByText(tr("login.err.401"))).toBeInTheDocument();
    expect(screen.queryByText("Invalid email or password.")).not.toBeInTheDocument();
  });

  it("offers a new confirmation link for an unconfirmed email (403)", async () => {
    const fetchMock = mockApi({ status: 403 }, { status: 204 });
    renderScreen(<LoginPage />, { url: "/login" });
    const user = await submit();
    await user.click(await screen.findByRole("button", { name: tr("login.err.403.cta") }));
    expect(await screen.findByText(tr("login.err.403.sent"))).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/resend-confirmation");
    expect(sentBody(fetchMock, 1)).toEqual({ email: "anna@body4u.bg" });
  });

  it("locks the form with a countdown after too many attempts (429)", async () => {
    mockApi({ status: 429 });
    renderScreen(<LoginPage />, { url: "/login" });
    await submit();
    expect(await screen.findByText(tr("login.err.429.t"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /сек\./ })).toBeDisabled();
  });

  it("links to the forgot-password form with the typed email", async () => {
    renderScreen(<LoginPage />, { url: "/login" });
    await userEvent.setup().type(screen.getByLabelText(tr("f.email")), "anna@body4u.bg");
    expect(screen.getByRole("link", { name: tr("login.forgot") })).toHaveAttribute("href", "/forgot-password?email=anna%40body4u.bg");
  });

  it.each(["expired", "deleted", "reset"])("shows the ?reason=%s banner", (reason) => {
    renderScreen(<LoginPage />, { url: `/login?reason=${reason}`, path: "/login" });
    expect(screen.getByText(tr(`login.reason.${reason}.t`))).toBeInTheDocument();
  });

  it("ignores an unknown ?reason=", () => {
    renderScreen(<LoginPage />, { url: "/login?reason=nope", path: "/login" });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("prefills the email from ?email=", () => {
    renderScreen(<LoginPage />, { url: "/login?email=anna%40body4u.bg", path: "/login" });
    expect(screen.getByLabelText(tr("f.email"))).toHaveValue("anna@body4u.bg");
  });
});
