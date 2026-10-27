// Test helpers: render a screen inside the app providers, fake API responses, and a signed-in session.
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import type { AuthResponseDto, UserDto } from "@/api/types";
import { AuthProvider } from "@/auth/AuthContext";
import i18n from "@/lib/i18n";
import { LocationProbe } from "@/test/LocationProbe";

/** Bulgarian copy for an i18n key, so assertions follow locales/bg.json. */
export const tr = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts);

/** Renders `ui` at `path` (route pattern) opened as `url`; any other route renders the location probe. */
export function renderScreen(ui: ReactElement, { url = "/", path = url.split("?")[0] }: { url?: string; path?: string } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path={path} element={ui} />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

type Reply = { status: number; body?: unknown };

/** Stubs global fetch with the given replies, in order (the last one repeats). Returns the mock for call assertions. */
export function mockApi(...replies: Reply[]) {
  let i = 0;
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => {
    const { status, body } = replies[Math.min(i++, replies.length - 1)];
    // Status-only replies (204, a 429 from the rate limiter) have no body; Response forbids one on 204.
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Body of the n-th fetch call, parsed. */
export const sentBody = (fetchMock: ReturnType<typeof mockApi>, n = 0) => JSON.parse(String(fetchMock.mock.calls[n][1]?.body));

export const testUser: UserDto = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "anna@body4u.bg",
  firstName: "Анна",
  lastName: "Колева",
  phoneNumber: null,
  createdAt: "2026-01-03T10:00:00",
  isEmailConfirmed: true,
  roles: [{ id: "r-user", name: "User" }],
};

/** An unsigned JWT that expires in an hour — enough for AuthContext (it only reads `exp`). */
export function fakeToken(expiresInMs = 60 * 60 * 1000) {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64({ alg: "none" })}.${b64({ exp: Math.floor((Date.now() + expiresInMs) / 1000) })}.sig`;
}

/** Backend-style UTC timestamp (no "Z") `ms` from now. */
export const utcIn = (ms: number) => new Date(Date.now() + ms).toISOString().replace("Z", "");

/** A login / refresh response: 1-hour token, session ending in 30 days. */
export const authResponse = (user: UserDto = testUser, tokenMs = 60 * 60 * 1000): AuthResponseDto => ({
  accessToken: fakeToken(tokenMs),
  user,
  sessionExpiresAt: utcIn(30 * 24 * 60 * 60 * 1000),
});

/** Puts a signed-in session in sessionStorage; call before renderScreen. */
export function signIn(user: UserDto = testUser) {
  const session: AuthResponseDto = authResponse(user);
  sessionStorage.setItem("b4u.session", JSON.stringify(session));
}
