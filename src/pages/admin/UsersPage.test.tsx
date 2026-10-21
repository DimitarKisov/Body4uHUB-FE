import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PagedResult, UserListItem } from "@/api/users";
import { UsersPage } from "@/pages/admin/UsersPage";
import { mockApi, renderScreen, signIn, testUser, tr } from "@/test/utils";

const admin = { ...testUser, roles: [{ id: "r-admin", name: "Administrator" }] };
beforeEach(() => signIn(admin));

const row = (n: number, extra: Partial<UserListItem> = {}): UserListItem => ({
  id: `u${n}`,
  email: `user${n}@body4u.bg`,
  firstName: "Потребител",
  lastName: String(n),
  phoneNumber: null,
  createdAt: "2026-01-05T09:00:00",
  isEmailConfirmed: true,
  roles: ["User"],
  ...extra,
});

const pageOf = (items: UserListItem[], totalCount: number, page = 1, pageSize = 10): PagedResult<UserListItem> => ({
  items,
  totalCount,
  page,
  pageSize,
  totalPages: Math.ceil(totalCount / pageSize),
  hasNext: false,
  hasPrevious: false,
});

describe("UsersPage", () => {
  it("lists users with the total, the confirmed badge and the roles", async () => {
    mockApi({ status: 200, body: pageOf([row(1), row(2, { isEmailConfirmed: false, phoneNumber: "0888123456" })], 2) });
    renderScreen(<UsersPage />, { url: "/admin/users" });
    expect(await screen.findByText(tr("users.lead", { n: 2 }))).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getByText("0888 123 456")).toBeInTheDocument();
    expect(within(table).getAllByText(tr("role.User"))).toHaveLength(2);
    expect(within(table).getByText(tr("common.no"))).toBeInTheDocument();
  });

  it("orders roles, shows at most two and folds the rest into +N", async () => {
    mockApi({ status: 200, body: pageOf([row(1, { roles: ["User", "Trainer", "Administrator"] }), row(2, { roles: [] })], 2) });
    renderScreen(<UsersPage />, { url: "/admin/users" });
    await screen.findByText(tr("users.lead", { n: 2 }));
    const [, first, second] = within(screen.getByRole("table")).getAllByRole("row");
    const more = within(first).getByTitle(tr("users.roles.more", { list: tr("role.User") }));
    expect(more.parentElement).toHaveTextContent(`${tr("role.Administrator")}${tr("role.Trainer")}+1 ${tr("role.User")}`);
    expect(within(second).getByText(tr("users.roles.none"))).toHaveClass("sr-only");
  });

  it("opens the details from a mobile list row", async () => {
    mockApi({ status: 200, body: pageOf([row(1)], 1) });
    renderScreen(<UsersPage />, { url: "/admin/users" });
    // jsdom applies no CSS, so both the table and the mobile list exist; the list rows are the buttons.
    await userEvent.setup().click(await screen.findByRole("button", { name: /Потребител 1/ }));
    expect(screen.getByTestId("location")).toHaveTextContent("/admin/users/u1");
  });

  it("asks the API for the page and size from the URL", async () => {
    const fetchMock = mockApi({ status: 200, body: pageOf([row(1)], 30, 2, 25) });
    renderScreen(<UsersPage />, { url: "/admin/users?page=2&size=25", path: "/admin/users" });
    await screen.findByText(tr("users.lead", { n: 30 }));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/users?page=2&pageSize=25");
  });

  it("jumps back to the last page when the URL points past the end", async () => {
    const fetchMock = mockApi({ status: 200, body: pageOf([], 15, 9) }, { status: 200, body: pageOf([row(11)], 15, 2) });
    renderScreen(<UsersPage />, { url: "/admin/users?page=9", path: "/admin/users" });
    await vi.waitFor(() => expect(fetchMock.mock.calls.at(-1)?.[0]).toBe("/api/users?page=2&pageSize=10"));
  });

  it("shows the empty state", async () => {
    mockApi({ status: 200, body: pageOf([], 0) });
    renderScreen(<UsersPage />, { url: "/admin/users" });
    expect(await screen.findByText(tr("users.empty.t"))).toBeInTheDocument();
  });

  it("shows the no-access state for 403", async () => {
    mockApi({ status: 403 });
    renderScreen(<UsersPage />, { url: "/admin/users" });
    expect(await screen.findByText(tr("err.403"))).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
