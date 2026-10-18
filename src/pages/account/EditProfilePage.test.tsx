import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { EditProfilePage } from "@/pages/account/EditProfilePage";
import { mockApi, renderScreen, sentBody, signIn, testUser, tr } from "@/test/utils";

beforeEach(() => signIn({ ...testUser, phoneNumber: "0888123456" }));

describe("EditProfilePage", () => {
  it("sends an emptied phone as null and returns to the profile", async () => {
    const fetchMock = mockApi({ status: 204 });
    renderScreen(<EditProfilePage />, { url: "/profile/edit" });
    const user = userEvent.setup();
    await user.clear(screen.getByLabelText(new RegExp(tr("f.phone"))));
    await user.click(screen.getByRole("button", { name: tr("common.save") }));
    expect(await screen.findByTestId("location")).toHaveTextContent("/profile");
    expect(sentBody(fetchMock)).toEqual({ firstName: "Анна", lastName: "Колева", phoneNumber: null });
    expect(sessionStorage.getItem("b4u.session")).toContain('"phoneNumber":null');
  });

  it("keeps the email read-only", () => {
    renderScreen(<EditProfilePage />, { url: "/profile/edit" });
    expect(screen.getByLabelText(tr("f.email"))).toHaveAttribute("readonly");
  });

  it("puts server field errors (400) under the fields", async () => {
    mockApi({ status: 400, body: { errors: [{ field: "PhoneNumber", error: "Invalid phone number format" }] } });
    renderScreen(<EditProfilePage />, { url: "/profile/edit" });
    await userEvent.setup().click(screen.getByRole("button", { name: tr("common.save") }));
    expect(await screen.findByText(tr("v.phoneNumber.server"))).toBeInTheDocument();
    expect(screen.getByText(tr("err.400"))).toBeInTheDocument();
  });
});
