// <time dateTime title="dd.MM.yyyy, HH:mm"> showing dd.MM.yyyy in local time.
import { formatDate, formatDateTime, parseUtc } from "@/lib/format";

export function RelativeTime({ iso }: { iso: string }) {
  return (
    <time dateTime={parseUtc(iso).toISOString()} title={formatDateTime(iso)}>
      {formatDate(iso)}
    </time>
  );
}
