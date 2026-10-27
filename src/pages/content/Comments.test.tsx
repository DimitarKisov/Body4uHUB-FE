import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { ArticleDto, CommentDto } from "@/api/content";
import { Toaster } from "@/components/feedback/Toaster";
import { resetAuthorsCache } from "@/hooks/useAuthors";
import { ArticlePage } from "@/pages/content/ArticlePage";
import { mockApi, renderScreen, sentBody, signIn, testUser, tr } from "@/test/utils";

const AUTHOR = "aaaaaaaa-0000-0000-0000-000000000001";
const BORIS = "aaaaaaaa-0000-0000-0000-000000000002";
const VERA = "aaaaaaaa-0000-0000-0000-000000000003";

const names = [
  { id: AUTHOR, firstName: "Мария", lastName: "Иванова" },
  { id: BORIS, firstName: "Борис", lastName: "Тодоров" },
  { id: VERA, firstName: "Вера", lastName: "Колева" },
  { id: testUser.id, firstName: testUser.firstName, lastName: testUser.lastName },
];

const comment = (id: string, authorId: string, extra: Partial<CommentDto> = {}): CommentDto => ({
  id,
  content: `Текст ${id}`,
  authorId,
  parentCommentId: null,
  isDeleted: false,
  createdAt: "2026-10-20T08:00:00",
  modifiedAt: null,
  ...extra,
});

const article = (comments: CommentDto[], extra: Partial<ArticleDto> = {}): ArticleDto => ({
  id: 7,
  title: "Статия с коментари",
  content: "Текст на статията.",
  category: "Training",
  readingMinutes: 1,
  authorId: AUTHOR,
  status: "Published",
  publishedAt: "2026-10-19T08:00:00",
  viewCount: 1,
  createdAt: "2026-10-18T08:00:00",
  modifiedAt: null,
  isBookmarked: false,
  comments,
  ...extra,
});

beforeEach(() => resetAuthorsCache());

const open = () => renderScreen(<><Toaster /><ArticlePage /></>, { url: "/articles/7", path: "/articles/:id" });
const section = () => screen.getByRole("region", { name: new RegExp(tr("comments.title")) });

describe("Comments", () => {
  it("lists threads: replies flattened under their top-level comment, \"в отговор на\" for a reply to a reply, deleted placeholder", async () => {
    mockApi(
      {
        status: 200,
        body: article([
          comment("c1", BORIS, { createdAt: "2026-10-20T08:00:00" }),
          comment("c2", VERA, { parentCommentId: "c1", createdAt: "2026-10-20T09:00:00" }),
          comment("c3", BORIS, { parentCommentId: "c2", createdAt: "2026-10-20T10:00:00", modifiedAt: "2026-10-20T11:00:00" }),
          comment("c4", VERA, { isDeleted: true, content: null, createdAt: "2026-10-20T07:00:00" }),
          comment("c5", BORIS, { parentCommentId: "c4", createdAt: "2026-10-20T12:00:00" }),
        ]),
      },
      { status: 200, body: names },
    );
    open();

    expect(await screen.findByText("Текст c1")).toBeInTheDocument();
    // 5 comments, 1 deleted placeholder
    expect(within(section()).getByRole("heading", { level: 2 })).toHaveTextContent(`${tr("comments.title")}4`);
    expect(await screen.findByText(tr("comments.replyTo", { name: "Вера Колева" }))).toBeInTheDocument();
    expect(screen.getByText(tr("comments.deleted"))).toBeInTheDocument();
    expect(screen.queryByText(tr("comments.replyTo", { name: tr("comments.deleted").toLowerCase() }))).not.toBeInTheDocument();
    expect(screen.queryByText(/редактиран/)).not.toBeInTheDocument();
    // Oldest root first: the deleted c4 (07:00) before c1 (08:00).
    const texts = within(section()).getAllByText(/^(Текст c\d|Коментарът е изтрит)$/).map((x) => x.textContent);
    expect(texts).toEqual([tr("comments.deleted"), "Текст c5", "Текст c1", "Текст c2", "Текст c3"]);
  });

  it("anonymous visitors get the login prompt instead of the composer", async () => {
    mockApi({ status: 200, body: article([]) }, { status: 200, body: names });
    open();
    expect(await screen.findByText(tr("comments.login"))).toBeInTheDocument();
    expect(screen.getByText(tr("comments.empty"))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: tr("content.loginPrompt.cta") })).toHaveAttribute("href", "/login?returnTo=%2Farticles%2F7");
    expect(screen.queryByLabelText(tr("comments.write"))).not.toBeInTheDocument();
  });

  it("an unpublished article has no composer and says why", async () => {
    signIn({ ...testUser, id: AUTHOR, roles: [{ id: "r-trainer", name: "Trainer" }] });
    mockApi({ status: 200, body: article([], { status: "Draft", publishedAt: null }) }, { status: 200, body: names });
    open();
    expect(await screen.findByText(tr("comments.closed"))).toBeInTheDocument();
    expect(screen.queryByLabelText(tr("comments.write"))).not.toBeInTheDocument();
  });

  it("an archived article keeps showing its comments, read-only", async () => {
    signIn();
    mockApi({ status: 200, body: article([comment("c1", BORIS)], { status: "Archived" }) }, { status: 200, body: names });
    open();
    expect(await screen.findByText("Текст c1")).toBeInTheDocument();
    expect(screen.getByText(tr("comments.closed"))).toBeInTheDocument();
    expect(screen.queryByLabelText(tr("comments.write"))).not.toBeInTheDocument();
  });

  it("posts a comment: it appears above the composer, the field clears, success toast", async () => {
    signIn();
    const fetchMock = mockApi(
      { status: 200, body: article([comment("c1", BORIS)]) },
      { status: 200, body: names },
      { status: 201, body: { commentId: "new-1" } },
    );
    open();
    const field = await screen.findByLabelText(tr("comments.write"));
    await userEvent.type(field, "  Страхотна статия!  ");
    await userEvent.click(screen.getByRole("button", { name: tr("comments.submit") }));

    expect(await screen.findByText("Страхотна статия!")).toBeInTheDocument();
    expect(field).toHaveValue("");
    expect(await screen.findByText(tr("comments.added"))).toBeInTheDocument();
    const post = fetchMock.mock.calls.findIndex(([, init]) => init?.method === "POST");
    expect(fetchMock.mock.calls[post][0]).toBe("/api/articles/7/comments");
    expect(sentBody(fetchMock, post)).toEqual({ content: "Страхотна статия!", parentCommentId: null });
  });

  it("validates 2–1000 characters before calling the API", async () => {
    signIn();
    const fetchMock = mockApi({ status: 200, body: article([]) }, { status: 200, body: names });
    open();
    await userEvent.type(await screen.findByLabelText(tr("comments.write")), " a ");
    await userEvent.click(screen.getByRole("button", { name: tr("comments.submit") }));
    expect(await screen.findByText(tr("comments.v.len"))).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
  });

  it("429 → banner with the limit, the typed text stays", async () => {
    signIn();
    mockApi({ status: 200, body: article([]) }, { status: 200, body: names }, { status: 429 });
    open();
    const field = await screen.findByLabelText(tr("comments.write"));
    await userEvent.type(field, "Още един коментар");
    await userEvent.click(screen.getByRole("button", { name: tr("comments.submit") }));
    expect(await screen.findByText(tr("comments.err.429"))).toBeInTheDocument();
    expect(field).toHaveValue("Още един коментар");
  });

  it("404 on a top-level comment means the article is gone", async () => {
    signIn();
    mockApi({ status: 200, body: article([]) }, { status: 200, body: names }, { status: 404, body: { status: 404, detail: "Article not found" } });
    open();
    await userEvent.type(await screen.findByLabelText(tr("comments.write")), "Коментар");
    await userEvent.click(screen.getByRole("button", { name: tr("comments.submit") }));
    expect(await screen.findByText(tr("article.missing"))).toBeInTheDocument();
    expect(screen.queryByText("Article not found")).not.toBeInTheDocument();
  });
});
