// All dates render in one fixed timezone so server and client output match.
export const TZ = "America/Los_Angeles";

const pad = (n: number) => String(n).padStart(2, "0");

/** 754 -> "12:34", 3700 -> "1:01:40" */
export function clock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/** Duration badge: "59 min", "4 min", "45s" */
export function minutes(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  return `${Math.round(sec / 60)} min`;
}

/** Highlight length: "12s", "1m 04s" */
export function span(sec: number): string {
  const s = Math.max(1, Math.round(sec));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${pad(s % 60)}s`;
}

export function dayHeading(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" }).format(new Date(iso));
}

export function timeOfDay(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

/** YYYY-MM-DD in the app timezone. */
export function dayKey(iso: string): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  return p;
}

/** "2026-10-21" -> "Wed, Oct 21" */
export function dueLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}
