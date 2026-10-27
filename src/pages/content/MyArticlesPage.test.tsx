import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ArticleSummaryDto } from "@/api/content";
import type { PagedResult } from "@/api/users";
import { MyArticlesPage } from "@/pages/content/MyArticlesPage";
import { mockApi, renderScreen, signIn, testUser, tr } from "@/test/utils";

const trainer = { ...testUser, roles: [{ id: "r-trainer", name: "Trainer" as const }] };

const article = (id: number, extra: Partial<ArticleSummaryDto> = {}): ArticleSummaryDto => ({
  id,
  title: `Моя статия ${id}`,
  category: "Training",
  readingMinutes: 4,
  authorId: testUser.id,
  status: "Published",
  publishedAt: "2026-10-20T08:00:00",
  viewCount: 1284,
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

const open = (url = "/articles/mine") => renderScreen(<MyArticlesPage />, { url });

describe("MyArticlesPage", () => {
  it("lists own articles: status, last change, views (not for drafts), row → article, pencil → editor", async () => {
    signIn(trainer);
    const fetchMock = mockApi({
      status: 200,
      body: pageOf([
        article(1, { status: "Draft", publishedAt: null, viewCount: 0, modifiedAt: "2026-10-26T08:00:00" }),
        article(2, { createdAt: "2026-10-24T08:00:00" }),
      ]),
    });
    open();

    const draft = (await screen.findByRole("link", { name: /^Моя статия 1/ })).closest("li")!;
    expect(fetchMock.mock.calls[0][0]).toBe("/api/articles/mine?page=1&pageSize=10");
    expect(within(draft).getByText(tr("status.Draft"))).toBeInTheDocument();
    expect(within(draft).getByText(tr("mine.changed", { date: "26.10.2026" }))).toBeInTheDocument();
    expect(within(draft).queryByText(tr("content.views", { n: 0 }))).not.toBeInTheDocument();

    const published = screen.getByRole("link", { name: /^Моя статия 2/ }).closest("li")!;
    expect(within(published).getByText(tr("status.Published"))).toBeInTheDocument();
    expect(within(published).getByText(tr("mine.changed", { date: "24.10.2026" }))).toBeInTheDocument();
    expect(within(published).getByText(tr("content.views", { n: 1284 }))).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /^Моя статия 2/ })).toHaveAttribute("href", "/articles/2");
    expect(screen.getByRole("link", { name: `${tr("article.edit")}: Моя статия 2` })).toHaveAttribute("href", "/articles/2/edit");
    expect(screen.getByRole("link", { name: tr("mine.new") })).toHaveAttribute("href", "/articles/new");
  });

  it("empty: accent EmptyState with its own CTA, no header button", async () => {
    signIn(trainer);
    mockApi({ status: 200, body: pageOf([]) });
    open();
    expect(await screen.findByText(tr("mine.empty.t"))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: tr("mine.empty.cta") })).toHaveAttribute("href", "/articles/new");
    expect(screen.queryByRole("link", { name: tr("mine.new") })).not.toBeInTheDocument();
  });

  it("paging comes from the URL; the pager shows only when there is more than one page", async () => {
    signIn(trainer);
    const fetchMock = mockApi({ status: 200, body: { ...pageOf([article(21)], 21, 10), page: 3, totalPages: 3 } });
    open("/articles/mine?page=3&size=10");
    await screen.findByText("Моя статия 21");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/articles/mine?page=3&pageSize=10");
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("403 → no access", async () => {
    signIn(trainer);
    mockApi({ status: 403, body: { status: 403 } });
    open();
    expect(await screen.findByText(tr("err.403"))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: tr("common.retry") })).not.toBeInTheDocument();
  });

  it("500 → error with retry", async () => {
    signIn(trainer);
    mockApi({ status: 500 }, { status: 200, body: pageOf([article(1)]) });
    open();
    const retry = await screen.findByRole("button", { name: tr("common.retry") });
    retry.click();
    expect(await screen.findByText("Моя статия 1")).toBeInTheDocument();
  });
});
