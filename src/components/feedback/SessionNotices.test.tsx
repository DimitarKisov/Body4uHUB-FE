import { act, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "@/api/client";
import { SessionExpiredDialog } from "@/components/feedback/SessionNotices";
import { authResponse, mockApi, renderScreen, testUser, tr } from "@/test/utils";

// A token close to its end makes AuthContext refresh at once; the mocked refresh answers 401 → the session is over.
const signInExpiringIn = (ms: number) => sessionStorage.setItem("b4u.session", JSON.stringify(authResponse(testUser, ms)));

const dialog = () => screen.queryByRole("alertdialog", { name: tr("session.expired.t") });
const tick = () => act(() => new Promise((r) => setTimeout(r, 1100)));

beforeEach(() => sessionStorage.clear());

describe("SessionExpiredDialog", () => {
  it("signed-in shell: shows as soon as the session can no longer be refreshed", async () => {
    signInExpiringIn(1000);
    mockApi({ status: 401 });
    renderScreen(<SessionExpiredDialog />);
    await tick();
    expect(dialog()).toBeInTheDocument();
  });

  it("public pages (afterRequest): a session that ended in the background does not interrupt reading", async () => {
    signInExpiringIn(1000);
    mockApi({ status: 401 });
    renderScreen(<SessionExpiredDialog afterRequest />);
    await tick();
    expect(dialog()).not.toBeInTheDocument();
  });

  it("public pages (afterRequest): shows once an action gets a 401 and the refresh is refused", async () => {
    signInExpiringIn(10 * 60_000);
    renderScreen(<SessionExpiredDialog afterRequest />);
    mockApi({ status: 401 });
    await act(() => api("/api/articles/7/publish", { method: "POST" }).catch(() => {}));
    expect(dialog()).toBeInTheDocument();
  });
});
