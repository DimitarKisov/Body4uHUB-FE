import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { ArticleSummaryDto } from "@/api/content";
import type { PagedResult } from "@/api/users";
import { resetAuthorsCache } from "@/hooks/useAuthors";
import { ArticlesPage } from "@/pages/content/ArticlesPage";
import { mockApi, renderScreen, tr } from "@/test/utils";

const A1 = "aaaaaaaa-0000-0000-0000-000000000001";
const GONE = "aaaaaaaa-0000-0000-0000-000000000099";

const article = (id: number, extra: Partial<ArticleSummaryDto> = {}): ArticleSummaryDto => ({
  id,
  title: `Статия номер ${id}`,
  category: "Training",
  readingMinutes: 4,
  authorId: A1,
  status: "Published",
  publishedAt: "2026-10-20T08:00:00",
  viewCount: 10,
  createdAt: "2026-10-19T08:00:00",
  modifiedAt: null,
  ...extra,
});

const pageOf = (items: ArticleSummaryDto[], totalCount = items.length, pageSize = 10): PagedResult<ArticleSummaryDto> => ({
  items,
  totalCount,
  page: 1,
  pageSize,
  totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  hasNext: totalCount > pageSize,
  hasPrevious: false,
});

const anna = { id: A1, firstName: "Анна", lastName: "Колева" };

beforeEach(() => resetAuthorsCache());

describe("ArticlesPage", () => {
  it("lists articles with category, author, date and reading time; author names come in one batched call", async () => {
    const fetchMock = mockApi(
      { status: 200, body: pageOf([article(1), article(2, { category: "Nutrition", authorId: GONE }), article(3)]) },
      { status: 200, body: [anna] },
    );
    renderScreen(<ArticlesPage />, { url: "/articles" });

    expect(await screen.findByText("Статия номер 1")).toBeInTheDocument();
    expect(screen.getAllByText(tr("cat.Training"))).toHaveLength(2);
    expect(screen.getByText(tr("cat.Nutrition"))).toBeInTheDocument();
    expect(screen.getAllByText(tr("content.minutes", { n: 4 }))).toHaveLength(3);
    expect(screen.getAllByText("20.10.2026")).toHaveLength(3);
    expect(await screen.findAllByText("Анна Колева")).toHaveLength(2);
    expect(screen.getByText(tr("content.deletedUser"))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Статия номер 1/ })).toHaveAttribute("href", "/articles/1");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/articles?page=1&pageSize=10");
    // Duplicates collapse into one id each; anonymous call.
    expect(fetchMock.mock.calls[1][0]).toBe(`/api/users/public?ids=${A1}&ids=${GONE}`);
  });

  it("hides the pager when everything fits on one page and shows it otherwise", async () => {
    mockApi({ status: 200, body: pageOf([article(1)], 1) }, { status: 200, body: [anna] });
    const { unmount } = renderScreen(<ArticlesPage />, { url: "/articles" });
    await screen.findByText("Статия номер 1");
    expect(screen.queryByRole("navigation", { name: tr("table.pages") })).not.toBeInTheDocument();
    unmount();

    mockApi({ status: 200, body: pageOf([article(1)], 25) }, { status: 200, body: [anna] });
    renderScreen(<ArticlesPage />, { url: "/articles" });
    expect(await screen.findByRole("navigation", { name: tr("table.pages") })).toBeInTheDocument();
  });

  it("asks for the page from the URL", async () => {
    const fetchMock = mockApi({ status: 200, body: { ...pageOf([article(11)], 11), page: 2 } }, { status: 200, body: [anna] });
    renderScreen(<ArticlesPage />, { url: "/articles?page=2&size=10" });
    await screen.findByText("Статия номер 11");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/articles?page=2&pageSize=10");
  });

  it("shows the empty state", async () => {
    mockApi({ status: 200, body: pageOf([]) });
    renderScreen(<ArticlesPage />, { url: "/articles" });
    expect(await screen.findByText(tr("articles.empty.t"))).toBeInTheDocument();
  });

  it("shows an error with retry", async () => {
    mockApi({ status: 500 }, { status: 200, body: pageOf([article(1)]) }, { status: 200, body: [anna] });
    renderScreen(<ArticlesPage />, { url: "/articles" });
    expect(await screen.findByText(tr("articles.loadErr.t"))).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: tr("common.retry") }));
    expect(await screen.findByText("Статия номер 1")).toBeInTheDocument();
  });

  it("keeps the article list when the names request fails", async () => {
    mockApi({ status: 200, body: pageOf([article(1)]) }, { status: 429 });
    renderScreen(<ArticlesPage />, { url: "/articles" });
    expect(await screen.findByText("Статия номер 1")).toBeInTheDocument();
    expect(await screen.findByText("—")).toBeInTheDocument();
  });
});
