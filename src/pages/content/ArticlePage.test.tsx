import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { ArticleDto } from "@/api/content";
import { Toaster } from "@/components/feedback/Toaster";
import { resetAuthorsCache } from "@/hooks/useAuthors";
import { ArticlePage } from "@/pages/content/ArticlePage";
import { authResponse, mockApi, renderScreen, signIn, testUser, tr } from "@/test/utils";

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
  isBookmarked: false,
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

  it("a 401 refreshes the session silently and repeats the call with the new token", async () => {
    signIn();
    const fresh = authResponse();
    const fetchMock = mockApi({ status: 401 }, { status: 200, body: fresh }, { status: 200, body: article(draft) }, { status: 200, body: [anna] });
    open();
    expect(await screen.findByText(tr("article.private.t"))).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
    expect(fetchMock.mock.calls[2][1]?.headers).toMatchObject({ Authorization: `Bearer ${fresh.accessToken}` });
  });

  it("a session that can no longer be refreshed still shows a published article, anonymously", async () => {
    signIn();
    const fetchMock = mockApi({ status: 401 }, { status: 401 }, { status: 200, body: article() }, { status: 200, body: [anna] });
    open();
    expect(await screen.findByRole("heading", { level: 1, name: "Как да започнеш със силови тренировки" })).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty("Authorization");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
    expect(fetchMock.mock.calls[2][1]?.headers).not.toHaveProperty("Authorization");
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

  describe("author / admin toolbar", () => {
    const trainer = { ...testUser, roles: [{ id: "r-trainer", name: "Trainer" }] };
    const admin = { ...testUser, id: "22222222-2222-2222-2222-222222222222", roles: [{ id: "r-admin", name: "Administrator" }] };
    const toolbar = () => screen.queryByRole("toolbar", { name: tr("article.toolbar") });

    it("the author with the Trainer role publishes a draft; the article reloads", async () => {
      signIn(trainer);
      const fetchMock = mockApi(
        { status: 200, body: article(draft) },
        { status: 200, body: [anna] },
        { status: 204 },
        { status: 200, body: article() },
      );
      open();
      expect(await screen.findByText(tr("status.Draft"))).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: tr("article.archive") })).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: tr("article.publish") }));
      expect(await screen.findByRole("button", { name: tr("article.archive") })).toBeInTheDocument();
      expect(screen.queryByText(tr("article.private.t"))).not.toBeInTheDocument();
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
      expect(post?.[0]).toBe("/api/articles/7/publish");
    });

    it("an admin archives someone else's published article", async () => {
      signIn(admin);
      const fetchMock = mockApi({ status: 200, body: article() }, { status: 200, body: [anna] }, { status: 204 }, { status: 200, body: article({ status: "Archived" }) });
      open();
      await userEvent.click(await screen.findByRole("button", { name: tr("article.archive") }));
      expect(await screen.findByText(tr("status.Archived"))).toBeInTheDocument();
      expect(fetchMock.mock.calls.find(([, init]) => init?.method === "POST")?.[0]).toBe("/api/articles/7/archive");
    });

    it("no toolbar for readers, nor for an author who is no longer a trainer", async () => {
      signIn(); // the author, role User only
      mockApi({ status: 200, body: article() }, { status: 200, body: [anna] });
      open();
      await screen.findByRole("heading", { level: 1 });
      expect(toolbar()).not.toBeInTheDocument();
    });

    it("delete asks first, then goes to the list", async () => {
      signIn(trainer);
      const fetchMock = mockApi({ status: 200, body: article() }, { status: 200, body: [anna] }, { status: 204 });
      open();
      await userEvent.click(await screen.findByRole("button", { name: tr("article.delete") }));
      const dialog = screen.getByRole("alertdialog", { name: tr("article.delete.t") });
      expect(dialog).toHaveTextContent("„Как да започнеш със силови тренировки“");
      await userEvent.click(within(dialog).getByRole("button", { name: tr("article.delete") }));
      expect(await screen.findByTestId("location")).toHaveTextContent(/^\/articles$/);
      const del = fetchMock.mock.calls.find(([, init]) => init?.method === "DELETE");
      expect(del?.[0]).toBe("/api/articles/7");
    });

    it("403 → warning banner in Bulgarian, the raw detail is not shown", async () => {
      signIn(trainer);
      mockApi({ status: 200, body: article(draft) }, { status: 200, body: [anna] }, { status: 403, body: { status: 403, detail: "You can only modify your own articles" } });
      open();
      await userEvent.click(await screen.findByRole("button", { name: tr("article.publish") }));
      expect(await screen.findByText(tr("editor.err.403"))).toBeInTheDocument();
      expect(screen.queryByText(/only modify/)).not.toBeInTheDocument();
    });
  });

  describe("bookmark", () => {
    const button = (name: string) => screen.findByRole("button", { name });
    const withToasts = () => renderScreen(<><Toaster /><ArticlePage /></>, { url: "/articles/7", path: "/articles/:id" });

    it("not for anonymous visitors, nor on an unpublished article", async () => {
      mockApi({ status: 200, body: article() }, { status: 200, body: [anna] });
      const { unmount } = open();
      await screen.findByRole("heading", { level: 1 });
      expect(screen.queryByRole("button", { name: tr("article.bookmark") })).not.toBeInTheDocument();
      unmount();

      signIn();
      mockApi({ status: 200, body: article(draft) }, { status: 200, body: [anna] });
      open();
      await screen.findByText(tr("article.private.t"));
      expect(screen.queryByRole("button", { name: tr("article.bookmark") })).not.toBeInTheDocument();
    });

    it("saves: POST, then \"Запазена\" (pressed) and a success toast", async () => {
      signIn();
      const fetchMock = mockApi({ status: 200, body: article() }, { status: 200, body: [anna] }, { status: 201, body: { id: "b1" } });
      withToasts();
      await userEvent.click(await button(tr("article.bookmark")));
      expect(await button(tr("article.bookmarked"))).toHaveAttribute("aria-pressed", "true");
      expect(await screen.findByText(tr("article.bookmark.ok"))).toBeInTheDocument();
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
      expect(post?.[0]).toBe("/api/bookmarks/articles/7");
    });

    it("starts as \"Запазена\" when already saved; removing shows an info toast without an undo button", async () => {
      signIn();
      const fetchMock = mockApi(
        { status: 200, body: article({ isBookmarked: true }) },
        { status: 200, body: [anna] },
        { status: 204 },
      );
      withToasts();
      await userEvent.click(await button(tr("article.bookmarked")));
      expect(await button(tr("article.bookmark"))).toHaveAttribute("aria-pressed", "false");
      expect(fetchMock.mock.calls.find(([, init]) => init?.method === "DELETE")?.[0]).toBe("/api/bookmarks/articles/7");
      expect(await screen.findByText(tr("article.bookmark.removed"))).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Върни" })).not.toBeInTheDocument();
    });

    it("409 (saved in another tab) → flips to \"Запазена\" with an info toast", async () => {
      signIn();
      mockApi({ status: 200, body: article() }, { status: 200, body: [anna] }, { status: 409, body: { status: 409, detail: "Bookmark already exists" } });
      withToasts();
      await userEvent.click(await button(tr("article.bookmark")));
      expect(await button(tr("article.bookmarked"))).toBeInTheDocument();
      expect(await screen.findByText(tr("article.bookmark.already"))).toBeInTheDocument();
    });
  });
});
