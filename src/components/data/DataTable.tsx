// Admin data table (design: components/data/DataTable.jsx). Skeleton rows, empty slot, footer (Pagination).
// Mobile-first: below sm (640px) the rows render as a stacked, tappable list — strong column = title,
// the other columns = meta line (minus hideOnMobile), chevron when rows are clickable.
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Primary column: graphite, 500; title of the mobile row. */
  strong?: boolean;
  /** Omit from the mobile list. */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  skeletonRows?: number;
  /** Rendered when rows is empty and not loading (EmptyState). */
  empty?: ReactNode;
  /** Usually <Pagination />. */
  footer?: ReactNode;
  caption?: string;
}

function MobileList<T>({ columns, rows, rowKey, onRowClick, loading, skeletonRows }: DataTableProps<T> & { skeletonRows: number }) {
  const main = columns.find((c) => c.strong) ?? columns[0];
  const meta = columns.filter((c) => c !== main && !c.hideOnMobile);
  const item = "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3.5 text-left";

  if (loading) {
    return (
      <ul aria-hidden="true" className="divide-y divide-border sm:hidden">
        {Array.from({ length: skeletonRows }, (_, i) => (
          <li key={i} className={item}>
            <Skeleton className="h-3.5 w-[55%]" />
            <Skeleton className="col-start-1 mt-1 h-[11px] w-4/5" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="divide-y divide-border sm:hidden">
      {rows.map((row) => {
        const content = (
          <>
            <span className="min-w-0 truncate text-base leading-[22px] font-medium text-foreground">{main.render(row)}</span>
            <span className="tabular col-start-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-[18px] text-muted-foreground">
              {meta.map((c) => (
                <span key={c.key} className="min-w-0 [overflow-wrap:anywhere]">
                  <span className="sr-only">{c.header}: </span>
                  {c.render(row)}
                </span>
              ))}
            </span>
            {onRowClick && <ChevronRight className="col-start-2 row-span-2 row-start-1 size-[18px] text-placeholder" />}
          </>
        );
        return (
          <li key={rowKey(row)}>
            {onRowClick ? (
              <button
                type="button"
                className={cn(item, "cursor-pointer focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] focus-visible:ring-0 focus-visible:ring-offset-0 active:bg-background")}
                onClick={() => onRowClick(row)}
              >
                {content}
              </button>
            ) : (
              <div className={item}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const th = "border-b border-border bg-card px-4 py-3 text-left text-xs leading-4 font-semibold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase";
const td = "border-b border-border px-4 py-3.5 align-middle text-body group-last:border-b-0";

export function DataTable<T>(props: DataTableProps<T>) {
  const { columns, rows, rowKey, onRowClick, loading = false, skeletonRows = 5, empty, footer, caption } = props;
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <MobileList {...props} skeletonRows={skeletonRows} />
      <div className="hidden overflow-x-auto sm:block">
        <table className="tabular w-full border-collapse text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={th}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }, (_, i) => (
                  <tr key={i} className="group">
                    {columns.map((c, j) => (
                      <td key={c.key} className={td}>
                        <Skeleton className={cn("h-3", j === 0 ? "w-[70%]" : "w-[55%]")} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className={cn("group", onRowClick && "cursor-pointer hover:[&>td]:bg-background")}
                    onClick={onRowClick && (() => onRowClick(row))}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={onRowClick && ((e) => e.key === "Enter" && onRowClick(row))}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={cn(td, c.strong && "font-medium text-foreground")}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 && empty}
      {footer}
    </div>
  );
}
