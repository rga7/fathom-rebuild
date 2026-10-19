// iCalendar -> CalEvent[], using ical.js (pinned) so recurring events (RRULE, EXDATE, moved or
// cancelled occurrences) expand and TZID time zones are honoured. Used by the server route for
// private-link syncs and in the browser for .ics file imports. All-day events are skipped.
import ICAL from "ical.js";
import type { CalEvent, Platform } from "./calendar.ts";

export const MAX_EVENTS = 200;
const MAX_BYTES = 2_000_000;
const MAX_OCCURRENCES_PER_EVENT = 6000;
const BUDGET_MS = 4000;

export class IcsError extends Error {}

export interface ParseOptions {
  now?: number;
  /** Only events starting before now + horizonDays are returned (recurrences are expanded up to here). */
  horizonDays?: number;
  /** Zone for floating times and unknown TZIDs. Defaults to this runtime's zone. */
  fallbackTz?: string;
}

export interface ParseResult {
  events: CalEvent[];
  /** VEVENTs in the file, before any filtering. */
  total: number;
  /** Not used: all-day or cancelled. */
  skipped: number;
  /** Events past the cap that were left out. */
  truncated: number;
}

const validTz = (tz?: string): string | undefined => {
  if (!tz) return undefined;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return undefined;
  }
};

function tzOffsetMs(epoch: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" }).formatToParts(epoch);
  const v = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second")) - Math.floor(epoch / 1000) * 1000;
}

/** Wall-clock fields in an IANA zone -> epoch ms. */
export function zonedToEpoch(y: number, mo: number, d: number, h: number, mi: number, s: number, tz: string): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  const first = guess - tzOffsetMs(guess, tz);
  return guess - tzOffsetMs(first, tz);
}

function platformOf(text: string): Platform | null {
  if (/zoom\.us|zoomgov\.com/i.test(text)) return "zoom";
  if (/meet\.google\.com/i.test(text)) return "meet";
  if (/teams\.microsoft\.com|teams\.live\.com/i.test(text)) return "teams";
  return null;
}

const person = (value: unknown, cn?: unknown) => {
  const email = String(value ?? "").replace(/^mailto:/i, "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) return null;
  return { name: String(cn || email.split("@")[0]).slice(0, 80), email };
};

const MS_PER_DAY = 86_400_000;

export function parseIcal(text: string, opts: ParseOptions = {}): ParseResult {
  const now = opts.now ?? Date.now();
  const horizon = now + (opts.horizonDays ?? 7) * MS_PER_DAY;
  const windowStart = now - 6 * 3_600_000;
  const fallbackTz = validTz(opts.fallbackTz) ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const started = Date.now();

  if (text.length > MAX_BYTES) throw new IcsError("That file is too large (over 2 MB) to be a calendar export.");
  if (!/BEGIN:VCALENDAR/i.test(text)) throw new IcsError("That doesn't look like an .ics calendar file (no BEGIN:VCALENDAR).");

  let root: ICAL.Component;
  try {
    const jcal = ICAL.parse(text);
    // Several VCALENDARs in one file parse to an array of components; use them all.
    const comps = (Array.isArray(jcal[0]) ? (jcal as unknown[]) : [jcal]).map((j) => new ICAL.Component(j as never));
    root = comps[0];
    for (const extra of comps.slice(1)) for (const sub of extra.getAllSubcomponents()) root.addSubcomponent(sub);
  } catch {
    throw new IcsError("Couldn't read that calendar: it isn't valid iCalendar data.");
  }

  // VTIMEZONE blocks tell ical.js how TZIDs map to offsets, including daylight saving.
  ICAL.TimezoneService.reset();
  for (const vtz of root.getAllSubcomponents("vtimezone")) {
    try {
      ICAL.TimezoneService.register(new ICAL.Timezone(vtz));
    } catch {}
  }

  const vevents = root.getAllSubcomponents("vevent");
  const total = vevents.length;
  const all = vevents.map((v) => new ICAL.Event(v));
  const masters = new Map<string, ICAL.Event>();
  for (const e of all) if (!e.isRecurrenceException()) masters.set(e.uid, e);
  const standalone: { e: ICAL.Event; tzid?: string }[] = [];
  for (const e of all) {
    if (e.isRecurrenceException()) {
      masters.get(e.uid)?.relateException(e);
      standalone.push({ e });
    }
  }

  const epochOf = (t: ICAL.Time, tzid?: string): number => {
    const zone = t.zone;
    const known = zone && zone !== ICAL.Timezone.localTimezone && zone.tzid && zone.tzid !== "floating";
    if (known) return t.toUnixTime() * 1000;
    const tz = validTz(tzid) ?? fallbackTz;
    return zonedToEpoch(t.year, t.month, t.day, t.hour, t.minute, t.second, tz);
  };
  const tzidOf = (e: ICAL.Event) => {
    const v = e.component.getFirstProperty("dtstart")?.getParameter("tzid");
    return typeof v === "string" ? v : undefined;
  };

  const out = new Map<string, CalEvent>();
  let skipped = 0;
  const add = (item: ICAL.Event, start: number, end: number) => {
    if (end <= start) return;
    if (end <= windowStart || start >= horizon) return;
    const organizer = item.organizer ? person(item.organizer, item.component.getFirstProperty("organizer")?.getParameter("cn")) : null;
    const attendees = item.attendees.map((p) => person(p.getFirstValue(), p.getParameter("cn"))).filter((a): a is { name: string; email: string } => !!a);
    if (organizer && !attendees.some((a) => a.email === organizer.email)) attendees.unshift(organizer);
    const prop = (n: string) => String(item.component.getFirstPropertyValue(n) ?? "");
    const where = [item.location, item.description, prop("url"), prop("x-google-conference"), prop("x-microsoft-skypeteamsmeetingurl"), prop("x-microsoft-onlinemeetingexternallink")].filter(Boolean).join(" ");
    const id = `ics:${String(item.uid).slice(0, 60)}:${start}`;
    out.set(id, {
      id,
      title: String(item.summary ?? "").replace(/\s+/g, " ").trim().slice(0, 200) || "(untitled event)",
      start,
      end,
      attendees: attendees.slice(0, 50),
      organizerEmail: organizer?.email,
      platform: platformOf(where),
    });
  };
  const usable = (e: ICAL.Event) => {
    if (e.startDate.isDate) return false; // all-day
    if (String(e.component.getFirstPropertyValue("status") ?? "").toUpperCase() === "CANCELLED") return false;
    return true;
  };

  for (const e of masters.values()) {
    if (!e.startDate) continue;
    if (!usable(e)) {
      skipped++;
      continue;
    }
    const tzid = tzidOf(e);
    if (!e.isRecurring()) {
      add(e, epochOf(e.startDate, tzid), epochOf(e.endDate, tzid));
      continue;
    }
    // Expand the series up to the horizon. Moved occurrences are emitted separately (below), so skip them here.
    const it = e.iterator();
    for (let n = 0, next = it.next(); next && n < MAX_OCCURRENCES_PER_EVENT; n++, next = it.next()) {
      if (Date.now() - started > BUDGET_MS) break;
      const d = e.getOccurrenceDetails(next);
      const start = epochOf(d.startDate, tzid);
      if (start >= horizon) break;
      if (d.item !== e) continue;
      add(e, start, epochOf(d.endDate, tzid));
    }
  }
  for (const { e } of standalone) {
    if (!e.startDate || !usable(e)) {
      skipped++;
      continue;
    }
    const tzid = tzidOf(e);
    add(e, epochOf(e.startDate, tzid), epochOf(e.endDate, tzid));
  }

  const events = [...out.values()].sort((a, b) => a.start - b.start);
  return { events: events.slice(0, MAX_EVENTS), total, skipped, truncated: Math.max(0, events.length - MAX_EVENTS) };
}
