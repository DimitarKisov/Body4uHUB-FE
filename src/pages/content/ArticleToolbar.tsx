// C2 author / admin toolbar (design: ArticleScreens.jsx → ArticleScreen, `.ct-toolbar`): StatusBadge · Публикувай (draft/archived)
// or Архивирай (published) · trash → ConfirmDialog. POST /publish · POST /archive · DELETE /api/articles/:id.
// Success → toast + reload (the list too). 401 → session dialog (api client). 403 / 422 / 500 → banner under the toolbar;
// 404 → the page reloads into "not found". After deleting → /articles/mine for the author, /articles for an admin.
// "Редактирай" → /articles/:id/edit (a placeholder until the editor, C4).
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Archive, Globe, Pencil, Trash2 } from "lucide-react";
import { ApiError, NETWORK_ERROR } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { archiveArticle, articleQueryKey, deleteArticle, publishArticle, type ArticleDto } from "@/api/content";
import { ArticleStatusBadge } from "@/components/content/ArticleStatusBadge";
import { Banner } from "@/components/feedback/Banner";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { notify } from "@/components/feedback/notify";
import { Button } from "@/components/ui/button";

type Action = "publish" | "archive" | "delete";

const RUN: Record<Action, (id: number) => Promise<void>> = { publish: publishArticle, archive: archiveArticle, delete: deleteArticle };
const OK: Record<Action, string> = { publish: "article.published.ok", archive: "article.archived.ok", delete: "article.deleted.ok" };

/** Banner copy keys per status (design: problemBanner(p, "editor")); null = no banner. */
function bannerFor(status: number): { tone: "warning" | "error"; title: string; text: string } | null {
  if (status === 401 || status === 404) return null;
  if (status === 403) return { tone: "warning", title: "err.403.t", text: "editor.err.403" };
  if (status === 422) return { tone: "error", title: "err.422.t", text: "editor.err.422" };
  return { tone: "error", title: "err.500.t", text: status === NETWORK_ERROR ? "err.network" : "err.500" };
}

export function ArticleToolbar({ article: a }: { article: ArticleDto }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const published = a.status === "Published";

  const action = useMutation({
    mutationFn: (kind: Action) => RUN[kind](a.id),
    onSuccess: (_, kind) => {
      notify.success(t(OK[kind]));
      if (kind === "delete") {
        setConfirm(false);
        queryClient.removeQueries({ queryKey: articleQueryKey(a.id) });
        void queryClient.invalidateQueries({ queryKey: ["articles"] });
        navigate(user?.id === a.authorId ? "/articles/mine" : "/articles", { replace: true });
      } else {
        void queryClient.invalidateQueries({ queryKey: ["articles"] });
      }
    },
    onError: (e) => {
      setConfirm(false);
      const status = e instanceof ApiError ? e.problem.status : 500;
      // 404 / 422: someone else changed or deleted it meanwhile → show what is there now.
      if (status === 404 || status === 422) void queryClient.invalidateQueries({ queryKey: articleQueryKey(a.id) });
    },
  });
  const busy = action.isPending ? action.variables : null;
  const banner = action.error ? bannerFor(action.error instanceof ApiError ? action.error.problem.status : 500) : null;

  return (
    <>
      <div
        role="toolbar"
        aria-label={t("article.toolbar")}
        className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3"
      >
        <ArticleStatusBadge status={a.status} />
        <span className="flex-1" />
        <Button asChild size="sm" variant="secondary">
          <Link to={`/articles/${a.id}/edit`}>
            <Pencil />
            {t("article.edit")}
          </Link>
        </Button>
        {published ? (
          <Button size="sm" variant="secondary" loading={busy === "archive"} disabled={!!busy} title={t("article.archive.hint")} onClick={() => action.mutate("archive")}>
            <Archive />
            {t("article.archive")}
          </Button>
        ) : (
          <Button size="sm" loading={busy === "publish"} disabled={!!busy} onClick={() => action.mutate("publish")}>
            <Globe />
            {t("article.publish")}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="w-9 px-0 text-error-foreground"
          aria-label={t("article.delete")}
          title={t("article.delete")}
          disabled={!!busy}
          onClick={() => {
            action.reset();
            setConfirm(true);
          }}
        >
          <Trash2 />
        </Button>
      </div>

      {banner && (
        <Banner tone={banner.tone} title={t(banner.title)} className="mb-4">
          {t(banner.text)}
        </Banner>
      )}

      <ConfirmDialog
        open={confirm}
        destructive
        icon={<Trash2 />}
        title={t("article.delete.t")}
        description={t("article.delete.text", { title: a.title })}
        confirmLabel={t("article.delete")}
        cancelLabel={t("common.cancel")}
        loading={busy === "delete"}
        onCancel={() => setConfirm(false)}
        onConfirm={() => action.mutate("delete")}
      />
    </>
  );
}
