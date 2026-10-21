import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { mockApi, renderScreen, sentBody, tr } from "@/test/utils";

const submit = (user = userEvent.setup()) => user.click(screen.getByRole("button", { name: tr("forgot.submit") })).then(() => user);

describe("ForgotPasswordPage", () => {
  it("prefills ?email= and replaces the form with the sent state", async () => {
    const fetchMock = mockApi({ status: 204 });
    renderScreen(<ForgotPasswordPage />, { url: "/forgot-password?email=anna%40body4u.bg", path: "/forgot-password" });
    const user = await submit();
    expect(await screen.findByRole("heading", { name: tr("forgot.sent.t") })).toBeInTheDocument();
    expect(screen.getByText("anna@body4u.bg")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/forgot-password");
    expect(sentBody(fetchMock)).toEqual({ email: "anna@body4u.bg" });

    // "Изпрати нов линк" → back to the form, email kept.
    await user.click(screen.getByRole("button", { name: tr("forgot.again") }));
    expect(screen.getByLabelText(tr("f.email"))).toHaveValue("anna@body4u.bg");
  });

  it("validates before calling the API", async () => {
    const fetchMock = mockApi({ status: 204 });
    renderScreen(<ForgotPasswordPage />, { url: "/forgot-password" });
    await submit();
    expect(await screen.findByText(tr("v.email.required"))).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("locks submit after too many requests (429)", async () => {
    mockApi({ status: 429 });
    renderScreen(<ForgotPasswordPage />, { url: "/forgot-password?email=anna%40body4u.bg", path: "/forgot-password" });
    await submit();
    expect(await screen.findByText(tr("forgot.err.429"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: tr("forgot.submit") })).toBeDisabled();
  });

  it("shows a generic banner on a server error and keeps the form", async () => {
    mockApi({ status: 500 });
    renderScreen(<ForgotPasswordPage />, { url: "/forgot-password?email=anna%40body4u.bg", path: "/forgot-password" });
    await submit();
    expect(await screen.findByText(tr("err.500"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: tr("forgot.submit") })).toBeEnabled();
  });
});
