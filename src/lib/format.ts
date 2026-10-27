// Display formatters (design: ui_kits/identity/api.js → B4U_FMT).

/** Backend DateTimes are UTC but serialized without "Z" → treat a zone-less ISO string as UTC. */
export function parseUtc(iso: string): Date {
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
}

/** dd.mm.yyyy in local time. */
export function formatDate(iso: string): string {
  return parseUtc(iso)
    .toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric" })
    .replace(/\s*г\.?$/, "");
}

/** 0888123456 → 0888 123 456; other shapes (e.g. +359…) are shown as stored. */
export function formatPhone(phone: string): string {
  return phone.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
}

const pad = (n: number) => String(n).padStart(2, "0");

/** dd.mm.yyyy, HH:mm in local time — the `title` of every <time>. */
export function formatDateTime(iso: string): string {
  const d = parseUtc(iso);
  return `${formatDate(iso)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


/** "току-що", "преди 5 мин", "преди 3 ч", "вчера", "преди 4 дни" for 7 days, then dd.mm.yyyy (design: content shared.jsx FMT.rel). */
export function formatRelative(iso: string, now = Date.now()): string {
  const s = (now - parseUtc(iso).getTime()) / 1000;
  if (s < 60) return "току-що";
  if (s < 3600) return `преди ${Math.floor(s / 60)} мин`;
  if (s < 86400) return `преди ${Math.floor(s / 3600)} ч`;
  if (s < 172800) return "вчера";
  if (s < 604800) return `преди ${Math.floor(s / 86400)} дни`;
  return formatDate(iso);
}

/** 12840 → 12 840 (bg-BG groups from 5 digits). */
export function formatNumber(n: number): string {
  return n.toLocaleString("bg-BG");
}
