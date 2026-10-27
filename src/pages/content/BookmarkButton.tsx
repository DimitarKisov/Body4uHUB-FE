// C2 "Запази" ↔ "Запазена" toggle in the byline (signed in, published articles only). Starts from ArticleDto.isBookmarked.
// POST / DELETE /api/bookmarks/articles/:id. Removing → info toast (no undo: the user saves again with the same button). 409 → already saved (flip, info toast);
// 404 on POST → the article is gone (error toast, reload); 404 on DELETE → was not saved anyway; 401 → session dialog (api client).
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { ApiError, NETWORK_ERROR } from "@/api/client";
import { addBookmark, articleQueryKey, removeBookmark, type ArticleDto } from "@/api/content";
import { notify } from "@/components/feedback/notify";
import { Button } from "@/components/ui/button";

const statusOf = (e: unknown) => (e instanceof ApiError ? e.problem.status : 500);

export function BookmarkButton({ article: a }: { article: ArticleDto }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const saved = a.isBookmarked;

  const setSaved = (value: boolean) => {
    queryClient.setQueryData<ArticleDto>(articleQueryKey(a.id), (old) => old && { ...old, isBookmarked: value });
    void queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
  };
  const failed = (e: unknown) => {
    const status = statusOf(e);
    if (status === 401) return; // session dialog
    if (status === 404) {
      notify.error(t("article.missing.t"), t("article.missing"));
      void queryClient.invalidateQueries({ queryKey: articleQueryKey(a.id) });
      return;
    }
    notify.error(t("err.500.t"), t(status === NETWORK_ERROR ? "err.network" : "err.500"));
  };

  const add = useMutation({
    mutationFn: () => addBookmark(a.id),
    onSuccess: () => {
      setSaved(true);
      notify.success(t("article.bookmark.ok"));
    },
    onError: (e) => {
      if (statusOf(e) === 409) {
        setSaved(true);
        notify.info(t("article.bookmark.already"));
      } else failed(e);
    },
  });

  const remove = useMutation({
    mutationFn: () => removeBookmark(a.id),
    onSuccess: () => {
      setSaved(false);
      notify.info(t("article.bookmark.removed"));
    },
    onError: (e) => (statusOf(e) === 404 ? setSaved(false) : failed(e)),
  });

  const busy = add.isPending || remove.isPending;
  return (
    <Button size="sm" variant={saved ? "dark" : "secondary"} aria-pressed={saved} loading={busy} onClick={() => (saved ? remove.mutate() : add.mutate())}>
      {saved ? <BookmarkCheck /> : <Bookmark />}
      {t(saved ? "article.bookmarked" : "article.bookmark")}
    </Button>
  );
}
