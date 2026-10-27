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

/** Trimmed length within [min, max]. */
export const lengthOk = (v: string, min: number, max: number) => {
  const n = v.trim().length;
  return n >= min && n <= max;
};

/** Backend ArticleConstants.CommentContentMinLength / MaxLength. */
export const COMMENT_LEN = { min: 2, max: 1000 } as const;
