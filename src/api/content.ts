// Content API — ArticleController (backend/Body4uHUB.Content.Api/Controllers). Proxied by Vite to https://localhost:7002.
// Mirrors Body4uHUB.Content.Application DTOs. JSON is camelCase; DateTime → ISO string without "Z" (UTC, see lib/format parseUtc).
import { api } from "@/api/client";
import type { PagedResult } from "@/api/users";

/** ArticleCategory enumeration names (Body4uHUB.Content.Domain). */
export const CATEGORIES = ["Training", "Nutrition", "Recovery", "Other"] as const;
export type ArticleCategory = (typeof CATEGORIES)[number];
export type ArticleStatus = "Draft" | "Published" | "Archived";

export interface ArticleSummaryDto {
  id: number;
  title: string;
  category: ArticleCategory;
  readingMinutes: number;
  authorId: string;
  status: ArticleStatus;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
  modifiedAt: string | null;
}

/** Public. 200 published articles, newest publication first · 400 bad page/size (page ≥ 1, 1 ≤ pageSize ≤ 100). */
export const getArticles = (page: number, pageSize: number) => api<PagedResult<ArticleSummaryDto>>(`/api/articles?page=${page}&pageSize=${pageSize}`);
export const articlesQueryKey = (page: number, pageSize: number) => ["articles", "list", page, pageSize] as const;

export interface CommentDto {
  id: string;
  /** null for a deleted comment kept because it still has replies. */
  content: string | null;
  authorId: string;
  parentCommentId: string | null;
  isDeleted: boolean;
  createdAt: string;
  modifiedAt: string | null;
}

/** GetArticleByIdResponse. */
export interface ArticleDto extends ArticleSummaryDto {
  content: string;
  /** Oldest first. Deleted comments without replies are already left out. */
  comments: CommentDto[];
}

/**
 * Public; sends the token when signed in, so the author or an admin also gets drafts and archived articles
 * (an expired session falls back to the anonymous view, see client `auth: "optional"`).
 * 200 · 404 missing, deleted or someone else's unpublished article. Counts a view for a published article (once per IP).
 */
export const getArticle = (id: number) => api<ArticleDto>(`/api/articles/${id}`, { auth: "optional" });
export const articleQueryKey = (id: number) => ["articles", "detail", id] as const;

/** Author/Admin (Trainer or Administrator role). 204 · 401 · 403 not the author · 404 missing · 422 already published or deleted. */
export const publishArticle = (id: number) => api(`/api/articles/${id}/publish`, { method: "POST" });

/** Author/Admin. 204 · 401 · 403 not the author · 404 missing · 422 not published or deleted. */
export const archiveArticle = (id: number) => api(`/api/articles/${id}/archive`, { method: "POST" });

/** Author/Admin. Soft delete. 204 · 401 · 403 not the author · 404 missing · 422 already deleted. */
export const deleteArticle = (id: number) => api(`/api/articles/${id}`, { method: "DELETE" });
