// C2 · Статия — GET /api/articles/:id (design: ui_kits/content/ArticleScreens.jsx → ArticleScreen).
// Public page inside PublicLayout. Column max 720px: back → hero cover → eyebrow → H1 → byline → body (paragraphs split on blank lines).
// Drafts/archived come back only for the author or an admin → warning banner. 404 (or a non-numeric id) → C2c "Статията не е намерена".
// Author (with the Trainer role) or admin → ArticleToolbar above the hero. Not here yet: Редактирай (C4), bookmark, comments.
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Clock, Eye, EyeOff, FileText } from "lucide-react";
import { ApiError } from "@/api/client";
import { articleQueryKey, getArticle } from "@/api/content";
import { useAuth } from "@/auth/AuthContext";
import { AuthorAvatar, AuthorName } from "@/components/content/authors";
import { CategoryCover } from "@/components/content/CategoryCover";
import { LoadError } from "@/components/content/feedback";
import { RelativeTime } from "@/components/content/RelativeTime";
import { eyebrowClass, metaClass } from "@/components/content/styles";
import { Banner } from "@/components/feedback/Banner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthors } from "@/hooks/useAuthors";
import { formatNumber } from "@/lib/format";
import { publicWrap } from "@/lib/layout";
import { ArticleToolbar } from "@/pages/content/ArticleToolbar";
import { cn } from "@/lib/utils";

const heroClass = "mb-6 h-[120px] md:mb-8 md:h-[200px]";

/** Positive int, as the backend route `{id:int}` expects; anything else is "not found" without a request. */
function parseId(raw: string | undefined): number | null {
  return raw && /^\d{1,9}$/.test(raw) && Number(raw) > 0 ? Number(raw) : null;
}

export function ArticlePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const id = parseId(useParams().id);
  const { data: a, error, isFetching, refetch } = useQuery({
    queryKey: articleQueryKey(id ?? 0),
    queryFn: () => getArticle(id!),
    enabled: id !== null,
  });
  const author = useAuthors(a ? [a.authorId] : []);
  const back = { label: t("article.back"), onClick: () => navigate("/articles") };
  const missing = id === null || (error instanceof ApiError && error.problem.status === 404);

  return (
    <div className={cn(publicWrap, "pt-6 pb-16 min-[900px]:pt-10")}>
      <div className="mx-auto max-w-[720px]">
        <PageHeader back={back} title="" />

        {missing ? (
          <Card padded={false}>
            <EmptyState
              icon={<FileText />}
              title={t("article.missing.t")}
              actions={
                <Button variant="secondary" onClick={back.onClick}>
                  {t("article.missing.cta")}
                </Button>
              }
            >
              {t("article.missing")}
            </EmptyState>
          </Card>
        ) : error && !isFetching ? (
          <LoadError onRetry={() => refetch()} />
        ) : !a ? (
          <div role="status" aria-label={t("common.loading")}>
            <Skeleton className={cn(heroClass, "w-full rounded-lg")} />
            <Skeleton className="h-3 w-[90px]" />
            <Skeleton className="mt-3.5 h-[30px] w-[85%]" />
            <Skeleton className="mt-2.5 h-[30px] w-[55%]" />
            <div className="mt-9 flex flex-col gap-3">
              {["w-full", "w-[96%]", "w-[98%]", "w-[70%]"].map((w) => (
                <Skeleton key={w} className={cn("h-3.5", w)} />
              ))}
            </div>
          </div>
        ) : (
          <article>
            {((user?.id === a.authorId && hasRole("Trainer")) || hasRole("Administrator")) && <ArticleToolbar article={a} />}
            {a.status !== "Published" && (
              <Banner tone="warning" icon={EyeOff} title={t("article.private.t")} className="mb-4">
                {user?.id === a.authorId ? t("article.private") : hasRole("Administrator") ? t("article.private.admin") : null}
              </Banner>
            )}
            <CategoryCover category={a.category} iconSize={44} className={cn(heroClass, "rounded-lg")} />
            <div className={eyebrowClass}>{t(`cat.${a.category}`)}</div>
            <h1 className="mt-2 mb-4 text-[26px] leading-8 text-pretty md:text-[32px] md:leading-[38px]">{a.title}</h1>
            <div className="flex flex-wrap items-center gap-3 border-y border-border py-4">
              <AuthorAvatar author={author(a.authorId)} large />
              <div className="min-w-0 flex-[1_1_180px]">
                <div className="text-sm leading-5 font-semibold text-foreground">
                  <AuthorName author={author(a.authorId)} />
                </div>
                <div className={cn(metaClass, "mt-0.5")}>
                  <span>{a.publishedAt ? <RelativeTime iso={a.publishedAt} /> : t("article.notPublished")}</span>
                  <span>
                    <Clock />
                    {t("content.minutes", { n: a.readingMinutes })}
                  </span>
                  <span>
                    <Eye />
                    {t("content.views", { n: formatNumber(a.viewCount) })}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-7 flex flex-col gap-[18px] text-[17px] leading-7 text-foreground">
              {a.content
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((p, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {p}
                  </p>
                ))}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
