// Session end flow (design 2026-10-21 → "12 · Сесията"): 401 / 404 on /me → dialog → login → back to ?returnTo=.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getMe } from "@/api/users";
import { AuthProvider } from "@/auth/AuthContext";
import { GuestOnly, RequireAuth } from "@/auth/guards";
import { safeReturnTo } from "@/auth/returnTo";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/pages/auth/LoginPage";
import { LocationProbe } from "@/test/LocationProbe";
import { fakeToken, mockApi, signIn, testUser, tr } from "@/test/utils";

function CallsMe() {
  return (
    <button type="button" onClick={() => getMe().catch(() => {})}>
      call
    </button>
  );
}

function renderApp(url: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route element={<GuestOnly />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="/security" element={<CallsMe />} />
                <Route path="/profile" element={<LocationProbe />} />
              </Route>
            </Route>
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.useRealTimers());

describe("session", () => {
  it("a 401 opens the expired dialog; signing in again returns to the page", async () => {
    signIn();
    mockApi({ status: 401 }, { status: 200, body: { accessToken: fakeToken(), user: testUser } });
    renderApp("/security?tab=1");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "call" }));

    const dialog = await screen.findByRole("alertdialog", { name: tr("session.expired.t") });
    expect(sessionStorage.getItem("b4u.session")).toBeNull();
    await user.keyboard("{Escape}");
    expect(dialog).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: tr("session.expired.cta") }));
    expect(screen.getAllByTestId("location").at(-1)).toHaveTextContent(
      "/login?reason=expired&email=anna%40body4u.bg&returnTo=%2Fsecurity%3Ftab%3D1",
    );
    expect(screen.getByText(tr("login.reason.expired.t"))).toBeInTheDocument();
    expect(screen.getByLabelText(tr("f.email"))).toHaveValue("anna@body4u.bg");

    await user.type(screen.getByLabelText(tr("f.password")), "Parola1!");
    await user.click(screen.getByRole("button", { name: tr("login.submit") }));
    await vi.waitFor(() => expect(screen.getAllByTestId("location").at(-1)).toHaveTextContent(/^\/security\?tab=1$/));
    expect(screen.getByRole("button", { name: "call" })).toBeInTheDocument();
  });

  it("a 404 on /api/users/me opens the account-unavailable dialog → login without returnTo", async () => {
    signIn();
    mockApi({ status: 404 });
    renderApp("/security");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "call" }));
    await user.click(await screen.findByRole("button", { name: tr("session.deleted.cta") }));
    expect(screen.getAllByTestId("location").at(-1)).toHaveTextContent(/^\/login\?reason=deleted$/);
    expect(screen.getByText(tr("login.reason.deleted.t"))).toBeInTheDocument();
  });

  it("warns 5 minutes before exp, then expires at exp", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    sessionStorage.setItem("b4u.session", JSON.stringify({ accessToken: fakeToken(6 * 60 * 1000), user: testUser }));
    renderApp("/security");
    expect(screen.queryByText(/Сесията ти изтича/)).not.toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(61 * 1000));
    expect(screen.getByText(/Сесията ти изтича след 4:5\d мин\./)).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(5 * 60 * 1000));
    expect(screen.queryByText(/Сесията ти изтича/)).not.toBeInTheDocument();
    expect(screen.getByRole("alertdialog", { name: tr("session.expired.t") })).toBeInTheDocument();
  });

  it("accepts only same-origin returnTo paths", () => {
    expect(safeReturnTo("/admin/users?page=2")).toBe("/admin/users?page=2");
    expect(safeReturnTo("//evil.com")).toBeNull();
    expect(safeReturnTo("/\\evil.com")).toBeNull();
    expect(safeReturnTo("https://evil.com")).toBeNull();
    expect(safeReturnTo(null)).toBeNull();
  });
});
