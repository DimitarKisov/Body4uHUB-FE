// Author names for Content screens (design: content shared.jsx → useAuthors).
// A screen passes every authorId it shows; ids not cached yet go out in ONE GET /api/users/public?ids=… (chunks of 50, the API limit).
// The result is cached for the browser session (module scope; names are public, so signing out keeps them).
// An id the API leaves out = a deleted user → "Изтрит потребител". A failed request leaves the ids unresolved, to retry on the next screen.
import { useEffect, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { getPublicUsers, PUBLIC_USERS_MAX_IDS, type PublicUser } from "@/api/users";

export type Author =
  | { state: "loading" }
  | { state: "known"; firstName: string; lastName: string; name: string }
  | { state: "gone" }
  /** The names request failed. */
  | { state: "unknown" };

const cache = new Map<string, PublicUser | null>();
const pending = new Set<string>();
const failed = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;

const norm = (id: string) => id.toLowerCase();
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Tests only. */
export function resetAuthorsCache() {
  cache.clear();
  pending.clear();
  failed.clear();
}

async function fetchNames(ids: string[]) {
  ids.forEach((id) => {
    pending.add(id);
    failed.delete(id);
  });
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += PUBLIC_USERS_MAX_IDS) chunks.push(ids.slice(i, i + PUBLIC_USERS_MAX_IDS));
  try {
    const lists = await Promise.all(chunks.map(getPublicUsers));
    ids.forEach((id) => cache.set(id, null));
    lists.flat().forEach((u) => cache.set(norm(u.id), u));
  } catch {
    ids.forEach((id) => failed.add(id));
  } finally {
    ids.forEach((id) => pending.delete(id));
    emit();
  }
}

/** Returns a resolver id → Author. Pass all ids of the screen at once; order and duplicates don't matter. */
export function useAuthors(ids: (string | null | undefined)[]): (id: string) => Author {
  const key = [...new Set(ids.filter((x): x is string => !!x).map(norm))].sort().join(",");
  // Re-renders the screen whenever the cache changes.
  useSyncExternalStore(subscribe, () => version);

  useEffect(() => {
    const missing = key ? key.split(",").filter((id) => !cache.has(id) && !pending.has(id)) : [];
    if (missing.length) void fetchNames(missing);
  }, [key]);

  return (raw: string): Author => {
    const id = norm(raw);
    if (cache.has(id)) {
      const u = cache.get(id);
      return u ? { state: "known", firstName: u.firstName, lastName: u.lastName, name: `${u.firstName} ${u.lastName}` } : { state: "gone" };
    }
    return failed.has(id) ? { state: "unknown" } : { state: "loading" };
  };
}

/** Plain-text name for copy like "в отговор на {name}" ("" while loading). */
export function useAuthorLabel() {
  const { t } = useTranslation();
  return (a: Author) => (a.state === "known" ? a.name : a.state === "gone" ? t("content.deletedUser") : a.state === "unknown" ? "—" : "");
}
