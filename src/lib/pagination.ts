// Paging shared by admin lists. Backend (GetAllUsersQueryValidator): page ≥ 1, 1 ≤ pageSize ≤ 100.
export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Page and size from the URL (?page=&size=); anything invalid falls back to page 1 / default size. */
export function readPaging(params: URLSearchParams): { page: number; size: number } {
  const page = Number(params.get("page"));
  const size = Number(params.get("size"));
  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    size: (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE,
  };
}
