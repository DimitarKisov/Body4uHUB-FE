import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { ArticleDto } from "@/api/content";
import { resetAuthorsCache } from "@/hooks/useAuthors";
import { ArticlePage } from "@/pages/content/ArticlePage";
import { mockApi, renderScreen, signIn, testUser, tr } from "@/test/utils";

const A1 = testUser.id;

const article = (extra: Partial<ArticleDto> = {}): ArticleDto => ({
  id: 7,
  title: "Как да започнеш със силови тренировки",
  content: "Първи абзац.\n\nВтори абзац,\nна два реда.",
  category: "Training",
  readingMinutes: 3,
  authorId: A1,
  status: "Published",
  publishedAt: "2026-10-20T08:00:00",
  viewCount: 12840,
  createdAt: "2026-10-19T08:00:00",
  modifiedAt: null,
  comments: [],
  ...extra,
});

const anna = { id: A1, firstName: "Анна", lastName: "Колева" };
const draft = { status: "Draft" as const, publishedAt: null };

beforeEach(() => {
  resetAuthorsCache();
  sessionStorage.clear();
});

const open = (url = "/articles/7") => renderScreen(<ArticlePage />, { url, path: "/articles/:id" });

describe("ArticlePage", () => {
  it("shows the article: category, title, author, date, minutes, views and paragraphs split on blank lines", async () => {
    const fetchMock = mockApi({ status: 200, body: article() }, { status: 200, body: [anna] });
    open();

    expect(await screen.findByRole("heading", { level: 1, name: "Как да започнеш със силови тренировки" })).toBeInTheDocument();
    expect(screen.getByText(tr("cat.Training"))).toBeInTheDocument();
    expect(await screen.findByText("Анна Колева")).toBeInTheDocument();
    expect(screen.getByText("20.10.2026")).toBeInTheDocument();
    expect(screen.getByText(tr("content.minutes", { n: 3 }))).toBeInTheDocument();
    // bg-BG groups with a no-break space, which Testing Library normalises to a plain one.
    expect(screen.getByText(tr("content.views", { n: "12 840" }))).toBeInTheDocument();
    expect(screen.getByText("Първи абзац.").tagName).toBe("P");
    expect(screen.getByText(/Втори абзац,/).tagName).toBe("P");
    expect(screen.queryByText(tr("article.private.t"))).not.toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/articles/7");
  });

  it("an edited article shows no edit marker or date, only the publication date", async () => {
    mockApi({ status: 200, body: article({ modifiedAt: "2026-10-21T09:30:00" }) }, { status: 200, body: [anna] });
    open();
    expect(await screen.findByText("20.10.2026")).toBeInTheDocument();
    expect(screen.queryByText(/редактиран/)).not.toBeInTheDocument();
    expect(screen.queryByText("21.10.2026")).not.toBeInTheDocument();
  });

  it("an expired session still shows a published article, without the session dialog", async () => {
    signIn();
    const fetchMock = mockApi({ status: 401 }, { status: 200, body: article() }, { status: 200, body: [anna] });
    open();
    expect(await screen.findByRole("heading", { level: 1, name: "Как да започнеш със силови тренировки" })).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty("Authorization");
    expect(fetchMock.mock.calls[1][1]?.headers).not.toHaveProperty("Authorization");
    expect(sessionStorage.getItem("b4u.session")).not.toBeNull();
  });

  it("404 → not found, with a way back to the list", async () => {
    mockApi({ status: 404, body: { status: 404, title: "Not Found", detail: "Article not found" } });
    open();
    expect(await screen.findByText(tr("article.missing.t"))).toBeInTheDocument();
    expect(screen.queryByText("Article not found")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: tr("article.missing.cta") }));
    expect(await screen.findByTestId("location")).toHaveTextContent("/articles");
  });

  it("a non-numeric id is not found without calling the API", async () => {
    const fetchMock = mockApi({ status: 200, body: article() });
    open("/articles/abc");
    expect(await screen.findByText(tr("article.missing.t"))).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("the author's draft: warning banner and 'Непубликувана' instead of a date", async () => {
    signIn();
    const fetchMock = mockApi({ status: 200, body: article(draft) }, { status: 200, body: [anna] });
    open();
    expect(await screen.findByText(tr("article.private.t"))).toBeInTheDocument();
    expect(screen.getByText(tr("article.private"))).toBeInTheDocument();
    expect(screen.getByText(tr("article.notPublished"))).toBeInTheDocument();
    // The very first request after a page load already carries the token (else the author would get a 404 on reload).
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty("Authorization");
  });

  it("an admin viewing someone else's draft gets the admin copy", async () => {
    signIn({ ...testUser, id: "22222222-2222-2222-2222-222222222222", roles: [{ id: "r-admin", name: "Administrator" }] });
    mockApi({ status: 200, body: article(draft) }, { status: 200, body: [anna] });
    open();
    expect(await screen.findByText(tr("article.private.admin"))).toBeInTheDocument();
  });

  it("server error → retry loads the article", async () => {
    mockApi({ status: 500 }, { status: 200, body: article() }, { status: 200, body: [anna] });
    open();
    await userEvent.click(await screen.findByRole("button", { name: tr("common.retry") }));
    expect(await screen.findByRole("heading", { level: 1, name: "Как да започнеш със силови тренировки" })).toBeInTheDocument();
  });
});
