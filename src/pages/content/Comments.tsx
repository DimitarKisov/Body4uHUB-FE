// C2 comments (design: ui_kits/content/Comments.jsx → CommentsSection). The list comes with GET /api/articles/:id.
// Two levels: top-level comments, each with all its descendants flattened into one indented list (2px rule); a reply to a
// reply shows "↳ в отговор на {name}". Count leaves out deleted placeholders.
// POST /api/articles/:id/comments → the comment is added to the cached article + toast:
// - composer at the bottom for a new top-level comment;
// - "Отговори" (signed in, published) opens a composer at the end of that thread, "Отговаряш на {name}" + Отказ;
//   parentCommentId = the comment clicked, not the top-level one. 404 → the parent is gone.
// Own comment (or any, for an admin):
// - "Редактирай" (published only) → inline composer with the text; PUT → cached text replaced + toast; errors → banner;
// - "Изтрий" (published; on a draft / archived article only an admin) → ConfirmDialog; DELETE → placeholder if it has
//   replies, otherwise gone (as the next GET would return it) + toast; errors → toast, 404 / 422 reload the article.
// One composer (reply or edit) open at a time.
// Anonymous → login prompt; unpublished (draft / archived) → existing comments stay visible, no composer or reply,
// "Коментарите са достъпни…". No "(редактиран)" marker (user decision, as for articles).
import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Lock, Reply, Trash2 } from "lucide-react";
import { ApiError } from "@/api/client";
import { addComment, articleQueryKey, deleteComment, editComment, type ArticleDto, type CommentDto } from "@/api/content";
import { useAuth } from "@/auth/AuthContext";
import { AuthorAvatar, AuthorName } from "@/components/content/authors";
import { Composer } from "@/components/content/Composer";
import { LoginPrompt } from "@/components/content/feedback";
import { RelativeTime } from "@/components/content/RelativeTime";
import { Banner } from "@/components/feedback/Banner";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { notify } from "@/components/feedback/notify";
import { Button } from "@/components/ui/button";
import { useAuthors, type Author } from "@/hooks/useAuthors";
import { buildThreads, COMMENT_LEN, markDeleted } from "@/lib/content";
import { commentBanner, type ProblemDetails } from "@/lib/problem";

const rowClass = "grid grid-cols-[32px_minmax(0,1fr)] gap-3 py-3";
const contextClass = "inline-flex items-center gap-1 text-[13px] text-muted-foreground [&_svg]:size-3";
const actionClass = "h-8 px-2.5 text-muted-foreground hover:text-foreground [&_svg]:size-4";

/** A new top-level comment: 404 means the article itself is gone, not a parent comment. */
const topLevelBanner = (p: ProblemDetails) =>
  p.status === 404 ? { tone: "error" as const, titleKey: "article.missing.t", textKey: "article.missing" } : commentBanner(p);

/** Editing or deleting: 404 means the comment (or its article) is gone, not a parent. */
const ownBanner = (p: ProblemDetails) =>
  p.status === 404 ? { tone: "error" as const, titleKey: "err.404.t", textKey: "comments.err.gone" } : commentBanner(p);

/** Backend-style UTC timestamp (no "Z"), for a comment added locally until the next load. */
const utcNow = () => new Date().toISOString().replace("Z", "");

interface ItemProps {
  c: CommentDto;
  author: Author;
  replyTo?: string;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Inline edit composer, shown instead of the text and the actions. */
  editor?: ReactNode;
}

function CommentItem({ c, author, replyTo, onReply, onEdit, onDelete, editor }: ItemProps) {
  const { t } = useTranslation();
  if (c.isDeleted) {
    return (
      <div className={rowClass}>
        <AuthorAvatar author={author} deleted />
        <p className="mt-1.5 text-sm text-muted-foreground italic">{t("comments.deleted")}</p>
      </div>
    );
  }
  return (
    <div className={rowClass} id={`comment-${c.id}`}>
      <AuthorAvatar author={author} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] leading-[18px] text-muted-foreground">
          <span className="text-sm leading-5 font-semibold text-foreground">
            <AuthorName author={author} />
          </span>
          <RelativeTime iso={c.createdAt} relative />
        </div>
        {replyTo && (
          <div className={`mt-0.5 ${contextClass}`}>
            <Reply />
            {t("comments.replyTo", { name: replyTo })}
          </div>
        )}
        {editor ? (
          <div className="mt-2">{editor}</div>
        ) : (
          <p className="mt-1 text-base leading-6 [overflow-wrap:anywhere] whitespace-pre-line text-foreground">{c.content}</p>
        )}
        {!editor && (onReply || onEdit || onDelete) && (
          <div className="mt-1.5 -ml-2.5 flex flex-wrap gap-0.5">
            {onReply && (
              <Button size="sm" variant="ghost" className={actionClass} onClick={onReply}>
                <Reply />
                {t("comments.reply")}
              </Button>
            )}
            {onEdit && (
              <Button size="sm" variant="ghost" className={actionClass} onClick={onEdit}>
                {t("comments.edit")}
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="ghost" className={actionClass} onClick={onDelete}>
                {t("comments.delete")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Comments({ article: a }: { article: ArticleDto }) {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  // One composer at a time: a reply (the comment being answered + the thread it sits in) or an edit.
  const [replying, setReplying] = useState<{ comment: CommentDto; rootId: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<CommentDto | null>(null);
  const list = a.comments;
  const author = useAuthors(list.map((c) => c.authorId));
  const threads = buildThreads(list);
  const byId = new Map(list.map((c) => [c.id, c]));
  const count = list.filter((c) => !c.isDeleted).length;
  const published = a.status === "Published";
  const canReply = !!user && published;
  const isAdmin = hasRole("Administrator");
  const owns = (c: CommentDto) => !!user && (isAdmin || c.authorId === user.id);
  // Backend: editing only on a published article; deleting on a draft / archived one only for an admin (moderation).
  const canEdit = (c: CommentDto) => published && owns(c);
  const canDelete = (c: CommentDto) => (published || isAdmin) && owns(c);

  const updateComments = (fn: (list: CommentDto[]) => CommentDto[]) =>
    queryClient.setQueryData<ArticleDto>(articleQueryKey(a.id), (old) => old && { ...old, comments: fn(old.comments) });

  const nameOf = (authorId: string) => {
    const p = author(authorId);
    return p.state === "known" ? p.name : "—";
  };

  // "в отговор на …" only when the parent is not the top-level comment the reply is listed under.
  const replyToName = (c: CommentDto, rootId: string) => {
    const parent = c.parentCommentId ? byId.get(c.parentCommentId) : undefined;
    if (!parent || parent.id === rootId) return undefined;
    return parent.isDeleted ? t("comments.deleted").toLowerCase() : nameOf(parent.authorId);
  };

  async function add(content: string, parentCommentId: string | null) {
    const { commentId } = await addComment(a.id, content, parentCommentId);
    const comment: CommentDto = {
      id: commentId,
      content,
      authorId: user!.id,
      parentCommentId,
      isDeleted: false,
      createdAt: utcNow(),
      modifiedAt: null,
    };
    updateComments((old) => [...old, comment]);
    if (parentCommentId) setReplying(null);
    notify.success(t("comments.added"));
  }

  async function edit(id: string, content: string) {
    await editComment(a.id, id, content);
    updateComments((old) => old.map((c) => (c.id === id ? { ...c, content, modifiedAt: utcNow() } : c)));
    setEditing(null);
    notify.success(t("comments.saved"));
  }

  const remove = useMutation({
    mutationFn: (c: CommentDto) => deleteComment(a.id, c.id),
    onSuccess: (_, c) => {
      updateComments((old) => markDeleted(old, c.id));
      if (replying?.comment.id === c.id) setReplying(null);
      notify.success(t("comments.removed"));
    },
    onError: (e) => {
      const problem: ProblemDetails = e instanceof ApiError ? e.problem : { status: 500 };
      const { status } = problem;
      if (status === 401) return;
      const copy = ownBanner(problem);
      notify.error(t(copy.titleKey ?? "err.500.t"), t(copy.textKey));
      // Someone else changed or deleted it meanwhile → show what is there now.
      if (status === 404 || status === 422) void queryClient.invalidateQueries({ queryKey: articleQueryKey(a.id) });
    },
    onSettled: () => setDeleting(null),
  });

  const item = (c: CommentDto, rootId: string, replyTo?: string) => (
    <CommentItem
      key={c.id}
      c={c}
      author={author(c.authorId)}
      replyTo={replyTo}
      onReply={
        canReply
          ? () => {
              setEditing(null);
              setReplying({ comment: c, rootId });
            }
          : undefined
      }
      onEdit={
        canEdit(c)
          ? () => {
              setReplying(null);
              setEditing(c.id);
            }
          : undefined
      }
      onDelete={canDelete(c) ? () => setDeleting(c) : undefined}
      editor={
        editing === c.id ? (
          <Composer
            label={t("comments.edit")}
            submitLabel={t("comments.save")}
            initial={c.content ?? ""}
            min={COMMENT_LEN.min}
            max={COMMENT_LEN.max}
            lengthKey="comments.v.len"
            toBanner={ownBanner}
            autoFocus
            onCancel={() => setEditing(null)}
            onSubmit={(text) => edit(c.id, text)}
          />
        ) : undefined
      }
    />
  );

  return (
    <section aria-labelledby="comments-h" className="mt-10 border-t border-border pt-7">
      <h2 id="comments-h" className="mb-4 flex items-baseline gap-2 text-xl leading-[26px] tracking-[-0.015em]">
        {t("comments.title")}
        <span className="font-sans text-sm leading-none font-medium tracking-normal text-muted-foreground">{count}</span>
      </h2>

      {threads.length === 0 && published && <p className="mb-5 text-sm text-muted-foreground">{t("comments.empty")}</p>}

      <div className="flex flex-col gap-1">
        {threads.map(({ root, replies }) => {
          const replyHere = replying?.rootId === root.id ? replying : null;
          return (
            <div key={root.id}>
              {item(root, root.id)}
              {(replies.length > 0 || replyHere) && (
                <div className="ml-[15px] border-l-2 border-border pl-4 sm:ml-11">
                  {replies.map((r) => item(r, root.id, replyToName(r, root.id)))}
                  {replyHere && (
                    <div className="pt-2 pb-4">
                      <Composer
                        key={replyHere.comment.id}
                        label={t("comments.replying", { name: nameOf(replyHere.comment.authorId) })}
                        context={
                          <div className={contextClass}>
                            <Reply />
                            {t("comments.replying", { name: nameOf(replyHere.comment.authorId) })}
                          </div>
                        }
                        placeholder={t("comments.ph")}
                        submitLabel={t("comments.reply")}
                        min={COMMENT_LEN.min}
                        max={COMMENT_LEN.max}
                        lengthKey="comments.v.len"
                        autoFocus
                        onCancel={() => setReplying(null)}
                        onSubmit={(text) => add(text, replyHere.comment.id)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        {!published ? (
          <Banner tone="neutral" icon={Lock}>
            {t("comments.closed")}
          </Banner>
        ) : !user ? (
          <LoginPrompt>{t("comments.login")}</LoginPrompt>
        ) : (
          <Composer
            label={t("comments.write")}
            placeholder={t("comments.ph")}
            submitLabel={t("comments.submit")}
            min={COMMENT_LEN.min}
            max={COMMENT_LEN.max}
            lengthKey="comments.v.len"
            toBanner={topLevelBanner}
            onSubmit={(text) => add(text, null)}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        destructive
        icon={<Trash2 />}
        title={t("comments.delete.t")}
        description={deleting && list.some((c) => c.parentCommentId === deleting.id) ? t("comments.delete.text") : t("topic.post.delete.text")}
        confirmLabel={t("comments.delete")}
        cancelLabel={t("common.cancel")}
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => remove.mutate(deleting!)}
      />
    </section>
  );
}
