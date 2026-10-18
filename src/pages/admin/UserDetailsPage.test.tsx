import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserDto } from "@/api/types";
import { UserDetailsPage } from "@/pages/admin/UserDetailsPage";
import { renderScreen, signIn, testUser, tr } from "@/test/utils";

beforeEach(() => signIn({ ...testUser, roles: [{ id: "r-admin", name: "Administrator" }] }));

const ROLES = [
  { id: "r-user", name: "User" },
  { id: "r-trainer", name: "Trainer" },
  { id: "r-admin", name: "Administrator" },
];
const target: UserDto = { ...testUser, id: "u7", firstName: "Александър", lastName: "Николов" };
const trainer: UserDto = { ...target, roles: [...target.roles, { id: "r-trainer", name: "Trainer" }] };

type Reply = { status: number; body?: unknown };

/** Routes fetch by method + URL (the page loads the user and the roles in parallel). Each route replays its replies in order; the last one repeats. */
function api(routes: Record<string, Reply[]>) {
  const calls: { key: string; body?: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const key = `${init?.method ?? "GET"} ${url}`;
      calls.push({ key, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      const queue = routes[key];
      if (!queue) throw new Error(`unexpected request: ${key}`);
      const { status, body } = queue.length > 1 ? (queue.shift() as Reply) : queue[0];
      return new Response(body === undefined ? null : JSON.stringify(body), { status });
    }),
  );
  return calls;
}

const open = () => renderScreen(<UserDetailsPage />, { url: "/admin/users/u7", path: "/admin/users/:id" });

describe("UserDetailsPage", () => {
  it("shows the user's data and current roles", async () => {
    api({ "GET /api/users/u7": [{ status: 200, body: target }], "GET /api/roles": [{ status: 200, body: ROLES }] });
    open();
    expect(await screen.findByRole("heading", { name: "Александър Николов" })).toBeInTheDocument();
    expect(screen.getByText("u7")).toBeInTheDocument();
  });

  it("never offers Trainer or an owned role, and adds the picked ones", async () => {
    const calls = api({
      "GET /api/users/u7": [{ status: 200, body: target }, { status: 200, body: { ...target, roles: [...target.roles, ROLES[2]] } }],
      "GET /api/roles": [{ status: 200, body: ROLES }],
      "POST /api/users/u7/roles": [{ status: 204 }],
    });
    open();
    const user = userEvent.setup();
    const picker = await screen.findByRole("button", { name: new RegExp(tr("user.addRoles")) });
    await vi.waitFor(() => expect(picker).toBeEnabled());
    await user.click(picker);
    const list = screen.getByRole("listbox");
    expect(within(list).getByRole("option", { name: new RegExp(tr("role.Trainer")) })).toBeDisabled();
    expect(within(list).getByRole("option", { name: new RegExp(tr("role.User")) })).toBeDisabled();
    await user.click(within(list).getByRole("option", { name: new RegExp(tr("role.Administrator")) }));
    await user.click(screen.getByRole("button", { name: tr("user.addRoles.btn") }));
    await vi.waitFor(() => expect(calls.filter((c) => c.key === "GET /api/users/u7")).toHaveLength(2));
    expect(calls.find((c) => c.key === "POST /api/users/u7/roles")?.body).toEqual({ roleIds: ["r-admin"] });
  });

  it("warns when the user is already a trainer (409)", async () => {
    api({
      "GET /api/users/u7": [{ status: 200, body: target }],
      "GET /api/roles": [{ status: 200, body: ROLES }],
      "POST /api/users/trainers": [{ status: 409, body: { detail: "User is already a trainer." } }],
    });
    open();
    await userEvent.setup().click(await screen.findByRole("button", { name: tr("user.makeTrainer") }));
    expect(await screen.findByText(tr("user.err.409"))).toBeInTheDocument();
  });

  it("asks before removing the trainer role, then deletes it", async () => {
    const calls = api({
      "GET /api/users/u7": [{ status: 200, body: trainer }, { status: 200, body: target }],
      "GET /api/roles": [{ status: 200, body: ROLES }],
      "DELETE /api/users/trainers/u7": [{ status: 204 }],
    });
    open();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: tr("user.removeTrainer") }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText(tr("user.remove.text", { name: "Александър Николов" }))).toBeInTheDocument();
    expect(calls.some((c) => c.key.startsWith("DELETE"))).toBe(false);
    await user.click(within(dialog).getByRole("button", { name: tr("user.removeTrainer") }));
    expect(await screen.findByRole("button", { name: tr("user.makeTrainer") })).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows an error without retry for a missing user (404)", async () => {
    api({ "GET /api/users/u7": [{ status: 404 }], "GET /api/roles": [{ status: 200, body: ROLES }] });
    open();
    expect(await screen.findByText(tr("err.500"))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: tr("common.retry") })).not.toBeInTheDocument();
  });
});
