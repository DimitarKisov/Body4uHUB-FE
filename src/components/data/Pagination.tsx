// Page-size select + range label + page buttons (design: components/data/DataTable.jsx → Pagination).
// Below sm the "На страница" label is hidden and the bar is tighter (design 2026-10-18 mobile pass).
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZES } from "@/lib/pagination";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const btn =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-sm px-2 text-sm leading-none font-medium text-foreground tabular " +
  "hover:not-disabled:bg-muted disabled:cursor-not-allowed disabled:opacity-40 aria-[current=page]:bg-secondary aria-[current=page]:text-secondary-foreground";

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const { t } = useTranslation();
  const sizeId = useId();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);

  // 1 … p-1 p p+1 … last
  const nums: (number | "…")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums.push(p);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const go = (p: number) => onPageChange(Math.min(pages, Math.max(1, p)));

  return (
    <nav
      aria-label={t("table.pages")}
      className="tabular flex flex-wrap items-center justify-between gap-2.5 border-t border-border p-3 text-sm text-muted-foreground sm:gap-4 sm:px-4"
    >
      <div className="flex items-center gap-2">
        <label htmlFor={sizeId} className="hidden sm:inline">
          {t("table.perPage")}
        </label>
        <div className="relative flex items-center">
          <select
            id={sizeId}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 cursor-pointer appearance-none rounded-sm border border-input bg-card pr-[30px] pl-2.5 text-sm leading-none font-medium text-foreground"
            aria-label={t("table.perPage")}
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground" />
        </div>
        <span>{t("table.range", { from, to, total })}</span>
      </div>
      <div className="flex items-center gap-0.5">
        <button type="button" className={btn} onClick={() => go(page - 1)} disabled={page <= 1} aria-label={t("table.prev")}>
          <ChevronLeft className="size-[18px]" />
        </button>
        {nums.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1.5">
              …
            </span>
          ) : (
            <button key={p} type="button" className={btn} aria-current={p === page ? "page" : undefined} onClick={() => go(p)}>
              {p}
            </button>
          ),
        )}
        <button type="button" className={btn} onClick={() => go(page + 1)} disabled={page >= pages} aria-label={t("table.next")}>
          <ChevronRight className="size-[18px]" />
        </button>
      </div>
    </nav>
  );
}
