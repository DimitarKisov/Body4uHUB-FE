import { describe, expect, it } from "vitest";
import type { CommentDto } from "@/api/content";
import { markDeleted } from "@/lib/content";

const c = (id: string, parentCommentId: string | null = null, isDeleted = false): CommentDto => ({
  id,
  content: isDeleted ? null : id,
  authorId: "a",
  parentCommentId,
  isDeleted,
  createdAt: "2026-10-20T08:00:00",
  modifiedAt: null,
});

describe("markDeleted", () => {
  it("drops a deleted comment without replies", () => {
    expect(markDeleted([c("a"), c("b")], "a").map((x) => x.id)).toEqual(["b"]);
  });

  it("keeps a placeholder (content null) while it has replies", () => {
    const [a] = markDeleted([c("a"), c("b", "a")], "a");
    expect(a).toMatchObject({ id: "a", isDeleted: true, content: null });
  });

  it("deleting the last reply of a placeholder drops both, as the backend does", () => {
    expect(markDeleted([c("a", null, true), c("b", "a"), c("x")], "b").map((x) => x.id)).toEqual(["x"]);
  });
});
