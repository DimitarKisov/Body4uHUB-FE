// Screen 9 · Детайли за потребител (admin) — GET /api/users/{id} (design: ui_kits/identity/AdminScreens.jsx → UserDetailsScreen).
// 401 global sign-out · 403 "Нямаш достъп" · 404 / 500 / network → error state (+ retry unless 404).
// Role assignment (MultiSelect + GET /api/roles) and the trainer card come in the next steps.
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { CircleAlert, RefreshCw, Shield } from "lucide-react";
import { ApiError } from "@/api/client";
import { getUser, userQueryKey } from "@/api/users";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DescriptionList } from "@/components/ui/description-list";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailStatus, RoleBadge } from "@/components/user/badges";
import { formatDate, formatPhone } from "@/lib/format";

export function UserDetailsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const { data: user, error, isFetching, refetch } = useQuery({ queryKey: userQueryKey(id), queryFn: () => getUser(id) });
  const back = { label: t("users.title"), onClick: () => navigate("/admin/users") };

  if (!user) {
    const status = error instanceof ApiError ? error.problem.status : null;
    if (!error || isFetching) {
      return (
        <>
          <PageHeader back={back} title={<Skeleton className="h-7 w-[260px] max-w-full" />} />
          <Card role="status" aria-label={t("common.loading")}>
            <div className="flex flex-col gap-3.5">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3.5 w-[70%]" />
              <Skeleton className="h-3.5 w-2/5" />
            </div>
          </Card>
        </>
      );
    }
    const forbidden = status === 403;
    return (
      <>
        <PageHeader back={back} title={t(forbidden ? "err.403.t" : "err.500.t")} />
        <Card padded={false}>
          {forbidden ? (
            <EmptyState icon={<Shield />} tone="warning" title={t("err.403.t")}>
              {t("err.403")}
            </EmptyState>
          ) : (
            <EmptyState
              icon={<CircleAlert />}
              tone="error"
              title={t("err.500.t")}
              actions={
                // Retrying a missing user won't help; the back link is the way out.
                status !== 404 && (
                  <Button variant="secondary" onClick={() => refetch()}>
                    <RefreshCw />
                    {t("common.retry")}
                  </Button>
                )
              }
            >
              {t("err.500")}
            </EmptyState>
          )}
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader back={back} eyebrow={t("nav.admin")} title={`${user.firstName} ${user.lastName}`} description={<span className="[overflow-wrap:anywhere]">{user.email}</span>} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-start gap-4">
        <Card title={t("user.details")}>
          <DescriptionList
            items={[
              {
                label: t("f.email"),
                value: (
                  <>
                    {user.email}
                    <EmailStatus confirmed={user.isEmailConfirmed} />
                  </>
                ),
              },
              { label: t("f.firstName"), value: user.firstName },
              { label: t("f.lastName"), value: user.lastName },
              {
                label: t("f.phone"),
                value: user.phoneNumber ? formatPhone(user.phoneNumber) : <span className="text-muted-foreground">{t("common.notSet")}</span>,
              },
              { label: t("profile.registered"), value: <time dateTime={user.createdAt}>{formatDate(user.createdAt)}</time> },
              { label: "ID", value: <code className="font-mono text-[13px] text-body">{user.id}</code> },
            ]}
          />
        </Card>

        <Card title={t("user.roles")} description={t("user.roles.lead")}>
          <div className="flex flex-wrap gap-1.5">
            {user.roles.map((r) => (
              <RoleBadge key={r.id} role={r.name} />
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
