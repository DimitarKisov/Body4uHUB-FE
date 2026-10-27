// <time dateTime title="dd.MM.yyyy, HH:mm">: dd.MM.yyyy, or with `relative` "преди 3 ч" for 7 days (comments, posts, topics).
import { formatDate, formatDateTime, formatRelative, parseUtc } from "@/lib/format";

export function RelativeTime({ iso, relative }: { iso: string; relative?: boolean }) {
  return (
    <time dateTime={parseUtc(iso).toISOString()} title={formatDateTime(iso)}>
      {relative ? formatRelative(iso) : formatDate(iso)}
    </time>
  );
}
