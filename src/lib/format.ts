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

