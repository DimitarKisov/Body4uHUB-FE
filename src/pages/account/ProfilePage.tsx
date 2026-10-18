// Screen 5 · Моят профил — GET /api/users/me (design: ui_kits/identity/AccountScreens.jsx → ProfileScreen).
// 401 is handled globally and 404 (account deleted) here: both sign out → /login. Any other failure → error EmptyState with retry.
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CircleAlert, Pencil, RefreshCw } from "lucide-react";
import { ApiError } from "@/api/client";
import { getMe, meQueryKey } from "@/api/users";
import { useAuth } from "@/auth/AuthContext";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DescriptionList } from "@/components/ui/description-list";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailStatus, RoleBadge } from "@/components/user/badges";
import { formatDate, formatPhone } from "@/lib/format";

function ProfileSkeleton() {
  const { t } = useTranslation();
  return (
    <div role="status" aria-label={t("common.loading")} className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="flex flex-1 flex-col gap-2.5">
            <Skeleton className="h-[18px] w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      </Card>
      <Card>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-2 py-3.5">
            <Skeleton className="h-2.5 w-[90px]" />
            <Skeleton className="h-3.5 w-[45%]" />
          </div>
        ))}
      </Card>
    </div>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const { setUser, signOut } = useAuth();
  const { data: user, error, isPending, isError, isFetching, refetch } = useQuery({ queryKey: meQueryKey, queryFn: getMe });
  // Retry after an error shows the skeleton again; a background refetch with data on screen does not.
  const loading = isPending || (!user && isError && isFetching);

  // Keep the session copy (top bar avatar, role nav) in sync with the server.
  useEffect(() => {
    if (user) setUser(user);
  }, [user, setUser]);

  // 404 = the account no longer exists although the token is still valid → treat like 401 (guards redirect to /login).
  useEffect(() => {
    if (error instanceof ApiError && error.problem.status === 404) signOut();
  }, [error, signOut]);

  return (
    <>
      <PageHeader
        eyebrow={t("nav.account")}
        title={t("profile.title")}
        actions={
          user && (
            <Button asChild variant="secondary">
              <Link to="/profile/edit">
                <Pencil />
                {t("profile.edit")}
              </Link>
            </Button>
          )
        }
      />

      {loading && <ProfileSkeleton />}

      {!user && isError && !isFetching && (
        <Card padded={false}>
          <EmptyState
            icon={<CircleAlert />}
            tone="error"
            title={t("profile.loadErr.t")}
            actions={
              <Button variant="secondary" onClick={() => refetch()}>
                <RefreshCw />
                {t("common.retry")}
              </Button>
            }
          >
            {t("profile.loadErr")}
          </EmptyState>
        </Card>
      )}

      {user && (
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex flex-wrap items-center gap-4">
              <UserAvatar user={user} className="size-16 text-xl" />
              <div className="min-w-0 flex-1">
                <h2 className="text-[22px] leading-7">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="mt-1 text-sm [overflow-wrap:anywhere] text-body">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.roles.map((r) => (
                  <RoleBadge key={r.id} role={r.name} />
                ))}
              </div>
            </div>
          </Card>

          <Card title={t("profile.data")}>
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
                { label: t("profile.roles"), value: user.roles.map((r) => <RoleBadge key={r.id} role={r.name} />) },
              ]}
            />
          </Card>
        </div>
      )}
    </>
  );
}
