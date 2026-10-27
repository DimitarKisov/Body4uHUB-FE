import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, configureApi, NETWORK_ERROR } from "@/api/client";
import { mockApi } from "@/test/utils";

const onUnauthorized = vi.fn();
const onAccountGone = vi.fn();

beforeEach(() => {
  onUnauthorized.mockReset();
  onAccountGone.mockReset();
  configureApi({ getToken: () => "token-123", onUnauthorized, onAccountGone });
});

const statusOf = (p: Promise<unknown>) => p.then(() => null, (e: ApiError) => e.problem.status);

describe("api", () => {
  it("sends the bearer token and a JSON body", async () => {
    const fetchMock = mockApi({ status: 200, body: { ok: true } });
    await expect(api("/api/x", { method: "POST", body: { a: 1 } })).resolves.toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/x");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer token-123", "Content-Type": "application/json" });
    expect(init?.body).toBe('{"a":1}');
  });

  it("leaves the token out for public calls", async () => {
    const fetchMock = mockApi({ status: 204 });
    await api("/api/auth/login", { auth: false });
    expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty("Authorization");
  });

  it("returns undefined for 204", async () => {
    mockApi({ status: 204 });
    await expect(api("/api/x")).resolves.toBeUndefined();
  });

  it("throws ProblemDetails with the HTTP status", async () => {
    mockApi({ status: 422, body: { title: "Business rule violation", detail: "x", status: 999 } });
    const error = await api("/api/x").catch((e: ApiError) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).problem).toMatchObject({ status: 422, detail: "x" });
  });

  it("copes with an error without a body (429 from the rate limiter)", async () => {
    mockApi({ status: 429 });
    await expect(statusOf(api("/api/x"))).resolves.toBe(429);
  });

  it("reports a network failure as status 0", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(statusOf(api("/api/x"))).resolves.toBe(NETWORK_ERROR);
  });

  it("signs out on 401 from an authenticated call only", async () => {
    mockApi({ status: 401 });
    await statusOf(api("/api/auth/login", { auth: false }));
    expect(onUnauthorized).not.toHaveBeenCalled();
    await statusOf(api("/api/users/me"));
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("optional auth: a 401 is retried without the token and keeps the session", async () => {
    const fetchMock = mockApi({ status: 401 }, { status: 200, body: { id: 7 } });
    await expect(api("/api/articles/7", { auth: "optional" })).resolves.toEqual({ id: 7 });
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: "Bearer token-123" });
    expect(fetchMock.mock.calls[1][1]?.headers).not.toHaveProperty("Authorization");
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("optional auth: other errors are not retried", async () => {
    const fetchMock = mockApi({ status: 404 });
    expect(await statusOf(api("/api/articles/7", { auth: "optional" }))).toBe(404);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("reports a missing account on 404 from the /me endpoints only", async () => {
    mockApi({ status: 404 });
    await statusOf(api("/api/users/u7"));
    await statusOf(api("/api/users/meow"));
    expect(onAccountGone).not.toHaveBeenCalled();
    await statusOf(api("/api/users/me/change-password", { method: "POST" }));
    expect(onAccountGone).toHaveBeenCalledOnce();
  });
});
