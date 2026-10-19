// Minimal .ics reader: VEVENT blocks with SUMMARY, DTSTART, DTEND/DURATION, ATTENDEE,
// ORGANIZER, LOCATION, URL and DESCRIPTION. Recurrence rules are not expanded.
import type { CalEvent, Platform } from "./calendar.ts";

export const MAX_EVENTS = 200;
const MAX_BYTES = 2_000_000;

export class IcsError extends Error {}

interface Prop {
  name: string;
  params: Record<string, string>;
  value: string;
}

function parseLine(line: string): Prop | null {
  let inQuote = false;
  let colon = -1;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuote = !inQuote;
    else if (c === ":" && !inQuote) {
      colon = i;
      break;
    }
  }
  if (colon < 1) return null;
  const [name, ...rest] = line.slice(0, colon).split(";");
  const params: Record<string, string> = {};
  for (const p of rest) {
    const eq = p.indexOf("=");
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, "");
  }
  return { name: name.toUpperCase(), params, value: line.slice(colon + 1) };
}

const unescape = (v: string) => v.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1").trim();

/** Epoch ms, or null for all-day values and anything malformed. */
function parseDate(p: Prop): number | null {
  const m = p.value.trim().match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1, 7).map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 60) return null;
  // A trailing Z is UTC. Anything else (floating or TZID=...) is read as this browser's local time.
  const t = m[7] ? Date.UTC(y, mo - 1, d, h, mi, s) : new Date(y, mo - 1, d, h, mi, s).getTime();
  return Number.isFinite(t) ? t : null;
}

function parseDuration(v: string): number | null {
  const m = v.trim().match(/^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return null;
  const [w, d, h, mi, s] = m.slice(1).map((x) => Number(x ?? 0));
  const ms = (((w * 7 + d) * 24 + h) * 60 + mi) * 60_000 + s * 1000;
  return ms > 0 ? ms : null;
}

function platformOf(text: string): Platform | null {
  if (/zoom\.us|zoomgov\.com/i.test(text)) return "zoom";
  if (/meet\.google\.com/i.test(text)) return "meet";
  if (/teams\.microsoft\.com|teams\.live\.com/i.test(text)) return "teams";
  return null;
}

function person(p: Prop): { name: string; email: string } | null {
  const email = p.value.replace(/^mailto:/i, "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) return null;
  return { name: (p.params.CN || email.split("@")[0]).slice(0, 80), email };
}

export interface IcsResult {
  events: CalEvent[];
  /** VEVENTs left out: all-day, cancelled, or missing a usable start. */
  skipped: number;
  /** Events dropped because the file has more than MAX_EVENTS. */
  truncated: number;
}

export function parseIcs(text: string, now = Date.now()): IcsResult {
  if (text.length > MAX_BYTES) throw new IcsError("That file is too large (over 2 MB) to be a calendar export.");
  if (!/BEGIN:VCALENDAR/i.test(text)) throw new IcsError("That doesn't look like an .ics calendar file (no BEGIN:VCALENDAR).");
  const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);

  const events: CalEvent[] = [];
  let skipped = 0;
  let sawEvent = false;
  let cur: Prop[] | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^BEGIN:VEVENT$/i.test(line)) {
      cur = [];
      sawEvent = true;
      continue;
    }
    if (/^END:VEVENT$/i.test(line)) {
      const e = cur && toEvent(cur, events.length);
      if (e) events.push(e);
      else skipped++;
      cur = null;
      continue;
    }
    if (cur) {
      const p = parseLine(line);
      if (p) cur.push(p);
    }
  }
  if (!sawEvent) throw new IcsError("No events found in that file.");
  if (!events.length) throw new IcsError(`No usable events found (${skipped} skipped: all-day, cancelled or without a start time).`);

  // Keep what is still relevant, earliest first, and cap the total.
  const relevant = events.filter((e) => e.end >= now - 86_400_000).sort((a, b) => a.start - b.start);
  const kept = relevant.length ? relevant : events.sort((a, b) => a.start - b.start);
  return { events: kept.slice(0, MAX_EVENTS), skipped, truncated: Math.max(0, kept.length - MAX_EVENTS) };
}

function toEvent(props: Prop[], index: number): CalEvent | null {
  const get = (n: string) => props.find((p) => p.name === n);
  if (get("STATUS")?.value.trim().toUpperCase() === "CANCELLED") return null;
  const ds = get("DTSTART");
  const start = ds && parseDate(ds);
  if (!start) return null;
  const de = get("DTEND");
  const dur = get("DURATION");
  const end = (de && parseDate(de)) || (dur && parseDuration(dur.value) !== null ? start + parseDuration(dur.value)! : start + 30 * 60_000);
  if (end <= start) return null;

  const org = props.find((p) => p.name === "ORGANIZER");
  const organizer = org ? person(org) : null;
  const attendees = props.filter((p) => p.name === "ATTENDEE").map(person).filter((a): a is { name: string; email: string } => !!a);
  if (organizer && !attendees.some((a) => a.email === organizer.email)) attendees.unshift(organizer);

  const where = [get("LOCATION")?.value, get("URL")?.value, get("DESCRIPTION")?.value].filter(Boolean).join(" ");
  const uid = get("UID")?.value.trim().slice(0, 80) || String(index);
  return {
    id: `ics:${index}:${uid}`,
    title: unescape(get("SUMMARY")?.value ?? "").slice(0, 200) || "(untitled event)",
    start,
    end,
    attendees: attendees.slice(0, 50),
    organizerEmail: organizer?.email,
    platform: platformOf(where),
  };
}
