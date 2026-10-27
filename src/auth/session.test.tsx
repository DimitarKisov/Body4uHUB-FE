// Session flow: silent refresh (refresh cookie), restore in a new tab, 30-day end with warning,
// refused refresh / 404 on /me → dialog → login → back to ?returnTo=.
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
import { authResponse, mockApi, signIn, testUser, tr, utcIn } from "@/test/utils";

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
  it("a 401 whose refresh is refused opens the expired dialog; signing in again returns to the page", async () => {
    signIn();
    // /me 401 → refresh 401 → (dialog) → logout 204 → login 200
    const fetchMock = mockApi({ status: 401 }, { status: 401 }, { status: 204 }, { status: 200, body: authResponse() });
    renderApp("/security?tab=1");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "call" }));

    const dialog = await screen.findByRole("alertdialog", { name: tr("session.expired.t") });
    expect(sessionStorage.getItem("b4u.session")).toBeNull();
    await user.keyboard("{Escape}");
    expect(dialog).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: tr("session.expired.cta") }));
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
    expect(fetchMock.mock.calls[2][0]).toBe("/api/auth/logout");
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

  it("a 401 is refreshed silently: the call is repeated with the new token and the user stays", async () => {
    signIn();
    const fresh = authResponse();
    const fetchMock = mockApi({ status: 401 }, { status: 200, body: fresh }, { status: 200, body: testUser });
    renderApp("/security");
    await userEvent.click(screen.getByRole("button", { name: "call" }));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[2][1]?.headers).toMatchObject({ Authorization: `Bearer ${fresh.accessToken}` });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("b4u.session")).toContain(fresh.accessToken);
  });

  it("renews the token 1 minute before it runs out", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    sessionStorage.setItem("b4u.session", JSON.stringify(authResponse(testUser, 3 * 60 * 1000)));
    const fresh = authResponse();
    const fetchMock = mockApi({ status: 200, body: fresh });
    renderApp("/security");
    expect(fetchMock).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(2 * 60 * 1000 + 100));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/refresh");
    expect(sessionStorage.getItem("b4u.session")).toContain(fresh.accessToken);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("a new tab restores the session with one refresh before rendering", async () => {
    localStorage.setItem("b4u.signedIn", "1");
    const fetchMock = mockApi({ status: 200, body: authResponse() });
    renderApp("/security");
    expect(await screen.findByRole("button", { name: "call" })).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/refresh");
  });

  it("a new tab without a live session goes to the login", async () => {
    localStorage.setItem("b4u.signedIn", "1");
    mockApi({ status: 401 });
    renderApp("/security");
    await vi.waitFor(() => expect(screen.getAllByTestId("location").at(-1)).toHaveTextContent(/^\/login$/));
    expect(localStorage.getItem("b4u.signedIn")).toBeNull();
  });

  it("signing out revokes the session on the server", async () => {
    signIn();
    const fetchMock = mockApi({ status: 204 });
    renderApp("/security");
    await userEvent.click(screen.getAllByRole("button", { name: tr("nav.logout") })[0]);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/logout");
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
    expect(sessionStorage.getItem("b4u.session")).toBeNull();
  });

  it("warns 5 minutes before the 30-day end, then ends the session", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    sessionStorage.setItem("b4u.session", JSON.stringify({ ...authResponse(), sessionExpiresAt: utcIn(6 * 60 * 1000) }));
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
