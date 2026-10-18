// Initials avatar: graphite circle, lime initials, Unbounded (design: AppShell top bar).
import type { UserDto } from "@/api/types";
import { cn } from "@/lib/utils";

export function UserAvatar({ user, className }: { user: Pick<UserDto, "firstName" | "lastName">; className?: string }) {
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`;
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex size-9 flex-none items-center justify-center rounded-full bg-secondary font-display text-[13px] leading-none font-semibold text-primary", className)}
    >
      {initials}
    </span>
  );
}
