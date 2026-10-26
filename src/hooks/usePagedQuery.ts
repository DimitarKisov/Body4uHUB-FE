// A paged list with ?page=&size= in the URL (lib/pagination readPaging) — C1, C3, C5, C6.
// Changing the page scrolls to the top; changing the size resets to page 1; a page past the end (old link, items removed) → the last page.
import { useCallback, useEffect } from "react";
import { useQuery, type QueryKey } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import type { PagedResult } from "@/api/users";
import { readPaging } from "@/lib/pagination";

export function usePagedQuery<T>(queryKey: (page: number, size: number) => QueryKey, fetch: (page: number, size: number) => Promise<PagedResult<T>>) {
  const [params, setParams] = useSearchParams();
  const { page, size } = readPaging(params);
  const query = useQuery({ queryKey: queryKey(page, size), queryFn: () => fetch(page, size) });
  const { data } = query;

  const go = useCallback(
    (p: number, s: number, replace = false) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("page", String(p));
          next.set("size", String(s));
          return next;
        },
        { replace },
      ),
    [setParams],
  );

  useEffect(() => {
    if (data && data.totalCount > 0 && page > data.totalPages) go(data.totalPages, size, true);
  }, [data, page, size, go]);

  return {
    ...query,
    page,
    size,
    setPage: (p: number) => {
      go(p, size);
      window.scrollTo(0, 0);
    },
    setSize: (s: number) => go(1, s),
    /** The Pagination bar is hidden when everything fits on one page. */
    showPager: !!data && data.totalCount > size,
  };
}
