// Author avatar + name (design: content shared.jsx → Avatar, AuthorName). Resolve ids with hooks/useAuthors.
import { Trash2, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthorLabel, type Author } from "@/hooks/useAuthors";
import { cn } from "@/lib/utils";

/** Name, or a 96×12 skeleton while loading; "—" (muted) when the name could not be loaded. */
export function AuthorName({ author, className }: { author: Author; className?: string }) {
  const label = useAuthorLabel();
  if (author.state === "loading") return <Skeleton className="inline-block h-3 w-24 align-middle" />;
  return <span className={cn(author.state !== "known" && "font-medium text-muted-foreground", className)}>{label(author)}</span>;
}

/** Initials (the API has no photos). 32px muted; `large` = 40px graphite with lime letters (article byline). Unknown author or `deleted` comment = dashed outline. */
export function AuthorAvatar({ author, large, deleted }: { author: Author; large?: boolean; deleted?: boolean }) {
  if (deleted || author.state === "unknown") {
    const Icon = deleted ? Trash2 : User;
    return (
      <span aria-hidden="true" className={cn("inline-flex flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-border-strong text-placeholder", large ? "size-10" : "size-8")}>
        <Icon className={deleted ? "size-[13px]" : "size-3.5"} />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex flex-none items-center justify-center rounded-full font-display leading-none font-semibold",
        large ? "size-10 bg-secondary text-[13px] text-primary" : "size-8 bg-muted text-xs text-body",
      )}
    >
      {author.state === "known" ? `${author.firstName[0] ?? ""}${author.lastName[0] ?? ""}` : ""}
    </span>
  );
}
