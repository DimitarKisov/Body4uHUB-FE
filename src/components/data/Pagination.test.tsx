import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "@/components/data/Pagination";
import { tr } from "@/test/utils";

const setup = (page: number, total: number, pageSize = 10) => {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();
  render(<Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);
  return { onPageChange, onPageSizeChange };
};

describe("Pagination", () => {
  it("shows the range and marks the current page", () => {
    setup(2, 45);
    expect(screen.getByText("11–20 от 45")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
  });

  it("collapses far pages into an ellipsis", () => {
    setup(5, 100);
    const pages = screen.getAllByRole("button").map((b) => b.textContent).filter(Boolean);
    expect(pages).toEqual(["1", "4", "5", "6", "10"]);
    expect(screen.getAllByText("…")).toHaveLength(2);
  });

  it("disables previous on the first page and next on the last", () => {
    setup(1, 15);
    expect(screen.getByRole("button", { name: tr("table.prev") })).toBeDisabled();
    expect(screen.getByRole("button", { name: tr("table.next") })).toBeEnabled();
  });

  it("reports page and size changes", async () => {
    const user = userEvent.setup();
    const { onPageChange, onPageSizeChange } = setup(1, 45);
    await user.click(screen.getByRole("button", { name: tr("table.next") }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    await user.selectOptions(screen.getByRole("combobox"), "25");
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });
});
