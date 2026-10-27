// C3 · Моите статии — GET /api/articles/mine?page=&pageSize= (design: ui_kits/content/ArticleScreens.jsx → MyArticlesScreen).
// In AppShell (profile menu), Trainer or Administrator. One Card of rows: 48px cover · title · StatusBadge · "Променена {date}" ·
// views (not for drafts) · pencil → editor. A row opens C2. "Нова статия" in the header (hidden when the list is empty).
// Skeleton · empty (accent, "Напиши първата си статия") · 403 · error + retry. 401 → refresh / session dialog (api client).
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Eye, Pencil, Plus, ShieldAlert } from "lucide-react";
import { ApiError } from "@/api/client";
import { getMyArticles, myArticlesQueryKey, type ArticleSummaryDto } from "@/api/content";
import { ArticleStatusBadge } from "@/components/content/ArticleStatusBadge";
import { CategoryCover } from "@/components/content/CategoryCover";
import { LoadError } from "@/components/content/feedback";
import { metaClass } from "@/components/content/styles";
import { Pagination } from "@/components/data/Pagination";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagedQuery } from "@/hooks/usePagedQuery";
import { formatDate, formatNumber } from "@/lib/format";

const rowClass = "grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3.5 px-4 py-3.5 sm:px-5";
const mainClass =
  "flex min-w-0 flex-col gap-1.5 rounded-sm text-left text-foreground after:absolute after:inset-0 after:content-[''] " +
  "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:after:shadow-[inset_0_0_0_2px_var(--ring)]";

function MineRow({ article: a }: { article: ArticleSummaryDto }) {
  const { t } = useTranslation();
  return (
    <li className={`relative ${rowClass} active:bg-background`}>
      <CategoryCover category={a.category} iconSize={20} className="size-12" />
      <Link to={`/articles/${a.id}`} className={mainClass}>
        <span className="text-base leading-[22px] font-semibold text-pretty">{a.title}</span>
        <span className={metaClass}>
          <ArticleStatusBadge status={a.status} />
          <span>{t("mine.changed", { date: formatDate(a.modifiedAt ?? a.createdAt) })}</span>
          {a.status !== "Draft" && (
            <span title={t("content.views", { n: a.viewCount })}>
              <Eye />
              {formatNumber(a.viewCount)}
              <span className="sr-only">{t("content.views", { n: a.viewCount })}</span>
            </span>
          )}
        </span>
      </Link>
      {/* Above the row's stretched link. */}
      <Button asChild size="sm" variant="ghost" className="relative z-10 w-9 px-0">
        <Link to={`/articles/${a.id}/edit`} aria-label={`${t("article.edit")}: ${a.title}`} title={t("article.edit")}>
          <Pencil />
        </Link>
      </Button>
    </li>
  );
}

function NewArticleButton({ label }: { label: string }) {
  return (
    <Button asChild>
      <Link to="/articles/new">
        <Plus />
        {label}
      </Link>
    </Button>
  );
}

export function MyArticlesPage() {
  const { t } = useTranslation();
  const list = usePagedQuery(myArticlesQueryKey, getMyArticles);
  const { data, error, isFetching, refetch } = list;
  const forbidden = error instanceof ApiError && error.problem.status === 403;
  const loading = !data && (!error || isFetching);
  const items = !error ? data?.items : undefined;

  return (
    <>
      <PageHeader
        eyebrow={t("nav.contentSection")}
        title={t("mine.title")}
        description={t("mine.lead")}
        actions={items && items.length > 0 && <NewArticleButton label={t("mine.new")} />}
      />

      {forbidden && (
        <Card padded={false}>
          <EmptyState icon={<ShieldAlert />} tone="warning" title={t("err.403.t")}>
            {t("err.403")}
          </EmptyState>
        </Card>
      )}
      {error && !forbidden && !isFetching && <LoadError onRetry={() => refetch()} />}

      {loading && (
        <Card padded={false}>
          <ul role="status" aria-label={t("common.loading")} className="divide-y divide-border">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} aria-hidden="true" className={rowClass}>
                <Skeleton className="size-12 rounded-md" />
                <span className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-[70%]" />
                  <Skeleton className="h-3 w-[45%]" />
                </span>
                <span />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {items && items.length === 0 && (
        <Card padded={false}>
          <EmptyState icon={<Pencil />} tone="accent" title={t("mine.empty.t")} actions={<NewArticleButton label={t("mine.empty.cta")} />}>
            {t("mine.empty")}
          </EmptyState>
        </Card>
      )}

      {items && items.length > 0 && (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-border">
            {items.map((a) => (
              <MineRow key={a.id} article={a} />
            ))}
          </ul>
          {list.showPager && (
            <div className="border-t border-border [&>nav]:border-t-0">
              <Pagination page={list.page} pageSize={list.size} total={data!.totalCount} onPageChange={list.setPage} onPageSizeChange={list.setSize} />
            </div>
          )}
        </Card>
      )}
    </>
  );
}
