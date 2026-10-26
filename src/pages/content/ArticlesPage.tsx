// C1 · Статии — GET /api/articles?page=&pageSize= (design: ui_kits/content/ArticleScreens.jsx → ArticlesScreen).
// Public page inside PublicLayout (header + footer), for visitors and signed-in users alike.
// Mobile: one Card of rows (72px cover); ≥768px: a grid of cards (16:9 cover). No excerpt, filter or search (not in the API).
// Skeleton · empty · error + retry. Author names: one batched /api/users/public call.
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Clock, FileText } from "lucide-react";
import { articlesQueryKey, getArticles, type ArticleSummaryDto } from "@/api/content";
import { AuthorName } from "@/components/content/authors";
import { CategoryCover } from "@/components/content/CategoryCover";
import { LoadError } from "@/components/content/feedback";
import { RelativeTime } from "@/components/content/RelativeTime";
import { eyebrowClass, metaClass } from "@/components/content/styles";
import { Pagination } from "@/components/data/Pagination";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthors, type Author } from "@/hooks/useAuthors";
import { usePagedQuery } from "@/hooks/usePagedQuery";
import { publicWrap } from "@/lib/layout";
import { cn } from "@/lib/utils";

// Rows inside one card on phones; from md each item is its own card in a grid.
const listClass =
  "overflow-hidden rounded-lg border border-border bg-card divide-y divide-border " +
  "md:grid md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:gap-4 md:divide-y-0 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent";
const itemClass =
  "grid grid-cols-[72px_minmax(0,1fr)] items-start gap-3.5 px-4 py-3.5 text-foreground active:bg-background " +
  "focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] focus-visible:ring-0 focus-visible:ring-offset-0 " +
  "md:grid-cols-1 md:rounded-lg md:border md:border-border md:bg-card md:px-3 md:pt-3 md:pb-[18px] md:transition-[border-color,box-shadow] md:duration-[120ms] md:hover:border-border-strong md:hover:shadow-sm";
const coverClass = "size-[72px] md:aspect-video md:size-auto md:w-full";


function ArticleCard({ article: a, author }: { article: ArticleSummaryDto; author: Author }) {
  const { t } = useTranslation();
  return (
    <Link to={`/articles/${a.id}`} className={itemClass}>
      <CategoryCover category={a.category} className={coverClass} />
      <span className="flex min-w-0 flex-col gap-1.5 md:gap-2 md:px-1.5">
        <span className={eyebrowClass}>{t(`cat.${a.category}`)}</span>
        <span className="text-base leading-[22px] font-semibold text-pretty md:font-display md:tracking-[-0.01em]">{a.title}</span>
        <span className={metaClass}>
          <span>
            <AuthorName author={author} />
          </span>
          {a.publishedAt && (
            <span>
              <RelativeTime iso={a.publishedAt} />
            </span>
          )}
          <span>
            <Clock />
            {t("content.minutes", { n: a.readingMinutes })}
          </span>
        </span>
      </span>
    </Link>
  );
}

function ArticleCardSkeleton() {
  return (
    <div aria-hidden="true" className={cn(itemClass, "pointer-events-none")}>
      <Skeleton className={cn(coverClass, "rounded-md md:h-auto")} />
      <span className="flex flex-col gap-2 md:px-1.5">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-3 w-[60%]" />
      </span>
    </div>
  );
}

export function ArticlesPage() {
  const { t } = useTranslation();
  const list = usePagedQuery(articlesQueryKey, getArticles);
  const { data, error, isFetching, refetch } = list;
  const author = useAuthors(data?.items.map((a) => a.authorId) ?? []);
  const loading = !data && (!error || isFetching);

  return (
    <div className={cn(publicWrap, "pt-6 pb-16 min-[900px]:pt-10")}>
      <PageHeader title={t("articles.title")} description={t("articles.lead")} />

      {error && !isFetching && <LoadError title={t("articles.loadErr.t")} onRetry={() => refetch()} />}

      {loading && (
        <div role="status" aria-label={t("common.loading")} className={listClass}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      )}

      {data && !error && data.items.length === 0 && (
        <Card padded={false}>
          <EmptyState icon={<FileText />} title={t("articles.empty.t")}>
            {t("articles.empty")}
          </EmptyState>
        </Card>
      )}

      {data && !error && data.items.length > 0 && (
        <>
          <div className={listClass}>
            {data.items.map((a) => (
              <ArticleCard key={a.id} article={a} author={author(a.authorId)} />
            ))}
          </div>
          {list.showPager && (
            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card [&>nav]:border-t-0">
              <Pagination page={list.page} pageSize={list.size} total={data.totalCount} onPageChange={list.setPage} onPageSizeChange={list.setSize} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
