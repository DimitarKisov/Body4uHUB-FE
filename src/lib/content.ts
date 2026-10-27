// Content rules shared by the screens (design: ui_kits/content/Comments.jsx).
import type { CommentDto } from "@/api/content";

export interface Thread {
  root: CommentDto;
  /** Every descendant of the root, oldest first, flattened into one level. */
  replies: CommentDto[];
}

/** Two levels: top-level comments + all their descendants flattened. A comment whose parent is missing becomes a root. */
export function buildThreads(list: CommentDto[]): Thread[] {
  const byId = new Map(list.map((c) => [c.id, c]));
  const rootOf = (c: CommentDto) => {
    let x = c;
    const seen = new Set<string>();
    while (x.parentCommentId && byId.has(x.parentCommentId) && !seen.has(x.id)) {
      seen.add(x.id);
      x = byId.get(x.parentCommentId)!;
    }
    return x;
  };
  const sorted = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const roots = sorted.filter((c) => !c.parentCommentId || !byId.has(c.parentCommentId));
  return roots.map((root) => ({ root, replies: sorted.filter((c) => c !== root && rootOf(c) === root) }));
}

/**
 * Marks a comment deleted the way GET /api/articles/:id would return it: content null, and deleted comments
 * left without replies dropped, repeatedly (backend GetArticleByIdQuery.RemoveDeletedLeaves).
 */
export function markDeleted(list: CommentDto[], id: string): CommentDto[] {
  let next = list.map((c) => (c.id === id ? { ...c, isDeleted: true, content: null } : c));
  for (;;) {
    const parents = new Set(next.map((c) => c.parentCommentId));
    const kept = next.filter((c) => !c.isDeleted || parents.has(c.id));
    if (kept.length === next.length) return next;
    next = kept;
  }
}

/** Trimmed length within [min, max]. */
export const lengthOk = (v: string, min: number, max: number) => {
  const n = v.trim().length;
  return n >= min && n <= max;
};

/** Backend ArticleConstants.CommentContentMinLength / MaxLength. */
export const COMMENT_LEN = { min: 2, max: 1000 } as const;
