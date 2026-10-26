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
