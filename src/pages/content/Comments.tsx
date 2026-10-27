// C2 comments (design: ui_kits/content/Comments.jsx → CommentsSection). The list comes with GET /api/articles/:id.
// Two levels: top-level comments, each with all its descendants flattened into one indented list (2px rule); a reply to a
// reply shows "↳ в отговор на {name}". Count leaves out deleted placeholders. Composer at the bottom:
// POST /api/articles/:id/comments → the comment is added to the cached article + toast. Anonymous → login prompt;
// unpublished (draft / archived) → existing comments stay visible, but instead of the composer "Коментарите са достъпни…". No "(редактиран)" marker (user decision,
// as for articles). Not here yet: reply, edit, delete (next steps).
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Lock, Reply } from "lucide-react";
import { addComment, articleQueryKey, type ArticleDto, type CommentDto } from "@/api/content";
import { useAuth } from "@/auth/AuthContext";
import { AuthorAvatar, AuthorName } from "@/components/content/authors";
import { Composer } from "@/components/content/Composer";
import { LoginPrompt } from "@/components/content/feedback";
import { RelativeTime } from "@/components/content/RelativeTime";
import { Banner } from "@/components/feedback/Banner";
import { notify } from "@/components/feedback/notify";
import { useAuthors, type Author } from "@/hooks/useAuthors";
import { buildThreads, COMMENT_LEN } from "@/lib/content";
import { commentBanner, type ProblemDetails } from "@/lib/problem";

const rowClass = "grid grid-cols-[32px_minmax(0,1fr)] gap-3 py-3";

/** A new top-level comment: 404 means the article itself is gone, not a parent comment. */
const topLevelBanner = (p: ProblemDetails) =>
  p.status === 404 ? { tone: "error" as const, titleKey: "article.missing.t", textKey: "article.missing" } : commentBanner(p);

/** Backend-style UTC timestamp (no "Z"), for a comment added locally until the next load. */
const utcNow = () => new Date().toISOString().replace("Z", "");

function CommentItem({ c, author, replyTo }: { c: CommentDto; author: Author; replyTo?: string }) {
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
          <div className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-muted-foreground">
            <Reply className="size-3" />
            {t("comments.replyTo", { name: replyTo })}
          </div>
        )}
        <p className="mt-1 text-base leading-6 [overflow-wrap:anywhere] whitespace-pre-line text-foreground">{c.content}</p>
      </div>
    </div>
  );
}

export function Comments({ article: a }: { article: ArticleDto }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const list = a.comments;
  const author = useAuthors(list.map((c) => c.authorId));
  const threads = buildThreads(list);
  const byId = new Map(list.map((c) => [c.id, c]));
  const count = list.filter((c) => !c.isDeleted).length;
  const published = a.status === "Published";

  // "в отговор на …" only when the parent is not the top-level comment the reply is listed under.
  const replyToName = (c: CommentDto, rootId: string) => {
    const parent = c.parentCommentId ? byId.get(c.parentCommentId) : undefined;
    if (!parent || parent.id === rootId) return undefined;
    if (parent.isDeleted) return t("comments.deleted").toLowerCase();
    const p = author(parent.authorId);
    return p.state === "known" ? p.name : "—";
  };

  async function add(content: string) {
    const { commentId } = await addComment(a.id, content);
    const comment: CommentDto = {
      id: commentId,
      content,
      authorId: user!.id,
      parentCommentId: null,
      isDeleted: false,
      createdAt: utcNow(),
      modifiedAt: null,
    };
    queryClient.setQueryData<ArticleDto>(articleQueryKey(a.id), (old) => old && { ...old, comments: [...old.comments, comment] });
    notify.success(t("comments.added"));
  }

  return (
    <section aria-labelledby="comments-h" className="mt-10 border-t border-border pt-7">
      <h2 id="comments-h" className="mb-4 flex items-baseline gap-2 text-xl leading-[26px] tracking-[-0.015em]">
        {t("comments.title")}
        <span className="font-sans text-sm leading-none font-medium tracking-normal text-muted-foreground">{count}</span>
      </h2>

      {threads.length === 0 && published && <p className="mb-5 text-sm text-muted-foreground">{t("comments.empty")}</p>}

      <div className="flex flex-col gap-1">
        {threads.map(({ root, replies }) => (
          <div key={root.id}>
            <CommentItem c={root} author={author(root.authorId)} />
            {replies.length > 0 && (
              <div className="ml-[15px] border-l-2 border-border pl-4 sm:ml-11">
                {replies.map((r) => (
                  <CommentItem key={r.id} c={r} author={author(r.authorId)} replyTo={replyToName(r, root.id)} />
                ))}
              </div>
            )}
          </div>
        ))}
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
            onSubmit={add}
          />
        )}
      </div>
    </section>
  );
}
