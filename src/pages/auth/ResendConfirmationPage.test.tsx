import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ResendConfirmationPage } from "@/pages/auth/ResendConfirmationPage";
import { mockApi, renderScreen, tr } from "@/test/utils";

async function send() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: tr("resend.submit") }));
}

describe("ResendConfirmationPage", () => {
  it.each([204, 500])("shows the same neutral result for %i (never reveals whether the email exists)", async (status) => {
    mockApi({ status });
    renderScreen(<ResendConfirmationPage />, { url: "/resend-confirmation?email=anna%40body4u.bg", path: "/resend-confirmation" });
    await send();
    expect(await screen.findByText(tr("resend.done"))).toBeInTheDocument();
  });

  it("locks the button after too many requests (429)", async () => {
    mockApi({ status: 429 });
    renderScreen(<ResendConfirmationPage />, { url: "/resend-confirmation?email=anna%40body4u.bg", path: "/resend-confirmation" });
    await send();
    expect(await screen.findByText(tr("resend.err.429.t"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: tr("resend.submit") })).toBeDisabled();
  });
});
