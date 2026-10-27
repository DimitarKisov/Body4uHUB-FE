import { act, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "@/api/client";
import { SessionExpiredDialog } from "@/components/feedback/SessionNotices";
import { fakeToken, mockApi, renderScreen, testUser, tr } from "@/test/utils";

const signInExpiringIn = (ms: number) =>
  sessionStorage.setItem("b4u.session", JSON.stringify({ accessToken: fakeToken(ms), user: testUser }));

const dialog = () => screen.queryByRole("alertdialog", { name: tr("session.expired.t") });
const tick = () => act(() => new Promise((r) => setTimeout(r, 1100)));

beforeEach(() => sessionStorage.clear());

describe("SessionExpiredDialog", () => {
  it("signed-in shell: shows as soon as the token runs out", async () => {
    signInExpiringIn(1000);
    renderScreen(<SessionExpiredDialog />);
    await tick();
    expect(dialog()).toBeInTheDocument();
  });

  it("public pages (afterRequest): a token that merely ran out does not interrupt reading", async () => {
    signInExpiringIn(1000);
    renderScreen(<SessionExpiredDialog afterRequest />);
    await tick();
    expect(dialog()).not.toBeInTheDocument();
  });

  it("public pages (afterRequest): shows once an action gets a 401", async () => {
    signInExpiringIn(60_000);
    renderScreen(<SessionExpiredDialog afterRequest />);
    mockApi({ status: 401 });
    await act(() => api("/api/articles/7/publish", { method: "POST" }).catch(() => {}));
    expect(dialog()).toBeInTheDocument();
  });
});
