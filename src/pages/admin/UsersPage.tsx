// Screen 8 · Потребители (admin) — GET /api/users?page=&pageSize= (design: ui_kits/identity/AdminScreens.jsx → UsersScreen).
// Page + size live in the URL; changing the size resets to page 1. 401 global sign-out · 403 "Нямаш достъп" · other → error + retry.
// Below sm the table is a tappable list (design 2026-10-18 mobile pass): name, then email · date · confirmed; phone hidden.
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, CircleAlert, RefreshCw, Shield, Users } from "lucide-react";
import { ApiError } from "@/api/client";
import { getUsers, usersQueryKey, type UserListItem } from "@/api/users";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate, formatPhone } from "@/lib/format";
import { readPaging } from "@/lib/pagination";

export function UsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { page, size } = readPaging(params);
  const setPaging = (p: number, s: number) => setParams({ page: String(p), size: String(s) });

  const { data, error, isFetching, refetch } = useQuery({ queryKey: usersQueryKey(page, size), queryFn: () => getUsers(page, size) });
  const forbidden = error instanceof ApiError && error.problem.status === 403;
  // Retrying after an error shows the skeleton table again.
  const showTable = !error || (!forbidden && isFetching);

  // A page past the end (old link, users deleted) → jump to the last page.
  useEffect(() => {
    if (data && data.totalCount > 0 && page > data.totalPages) setParams({ page: String(data.totalPages), size: String(size) }, { replace: true });
  }, [data, page, size, setParams]);

  const columns: DataTableColumn<UserListItem>[] = [
    { key: "name", header: t("users.col.name"), strong: true, render: (u) => `${u.firstName} ${u.lastName}` },
    { key: "email", header: t("users.col.email"), render: (u) => u.email },
    {
      key: "phone",
      header: t("users.col.phone"),
      hideOnMobile: true,
      render: (u) => (u.phoneNumber ? formatPhone(u.phoneNumber) : <span className="text-placeholder">—</span>),
    },
    { key: "registered", header: t("users.col.registered"), render: (u) => <time dateTime={u.createdAt}>{formatDate(u.createdAt)}</time> },
    {
      key: "confirmed",
      header: t("users.col.confirmed"),
      render: (u) =>
        u.isEmailConfirmed ? (
          <Badge tone="success">
            <Check className="size-[13px]" strokeWidth={2.4} />
            {t("common.yes")}
          </Badge>
        ) : (
          <Badge tone="warning">
            <span className="size-1.5 rounded-full bg-current" />
            {t("common.no")}
          </Badge>
        ),
    },
    { key: "roles", header: t("users.col.roles"), placeholder: true, render: () => t("common.soon") },
  ];

  return (
    <>
      <PageHeader eyebrow={t("nav.admin")} title={t("users.title")} description={data?.totalCount ? t("users.lead", { n: data.totalCount }) : " "} />

      {forbidden && (
        <Card padded={false}>
          <EmptyState icon={<Shield />} tone="warning" title={t("err.403.t")}>
            {t("err.403")}
          </EmptyState>
        </Card>
      )}

      {error && !forbidden && !isFetching && (
        <Card padded={false}>
          <EmptyState
            icon={<CircleAlert />}
            tone="error"
            title={t("err.500.t")}
            actions={
              <Button variant="secondary" onClick={() => refetch()}>
                <RefreshCw />
                {t("common.retry")}
              </Button>
            }
          >
            {t("err.500")}
          </EmptyState>
        </Card>
      )}

      {showTable && (
        <DataTable
          caption={t("users.title")}
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(u) => u.id}
          onRowClick={(u) => navigate(`/admin/users/${u.id}`)}
          loading={!data}
          skeletonRows={Math.min(size, 10)}
          empty={
            <EmptyState icon={<Users />} title={t("users.empty.t")}>
              {t("users.empty")}
            </EmptyState>
          }
          footer={
            data && data.totalCount > 0 && (
              <Pagination page={page} pageSize={size} total={data.totalCount} onPageChange={(p) => setPaging(p, size)} onPageSizeChange={(s) => setPaging(1, s)} />
            )
          }
        />
      )}
    </>
  );
}
