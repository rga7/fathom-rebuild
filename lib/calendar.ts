// Calendar model for the simulated calendar feature. Nothing here talks to a
// calendar service: events come from a generated demo calendar or a parsed .ics file.
import { PEOPLE } from "../data/people.ts";

/** Most events kept from any one calendar source. */
export const MAX_EVENTS = 200;

export type Platform = "zoom" | "meet" | "teams";
export type CaptureKind = "standup" | "one_on_one" | "sales" | "customer" | "planning";

export interface Attendee {
  name: string;
  email: string;
}

/** Plain JSON, so it can live in localStorage. Times are epoch milliseconds. */
export interface CalEvent {
  id: string;
  title: string;
  start: number;
  end: number;
  attendees: Attendee[];
  organizerEmail?: string;
  platform: Platform | null;
  /** Set on demo events; imported events are classified from their title and attendees. */
  kind?: CaptureKind;
}

export type CalSource =
  | { kind: "demo" }
  | { kind: "ics"; name: string; events: CalEvent[]; truncated: number }
  /** Synced from a private calendar link. The link itself is kept separately (key "cal-feed-url"), never in here. */
  | { kind: "feed"; host: string; events: CalEvent[]; syncedAt: number; truncated: number };

export type CaptureScope = "all" | "external" | "organized" | "none";

export interface CalSettings {
  scope: CaptureScope;
  showHeader: boolean;
  emailNotice: boolean;
  chatNotice: boolean;
  /** "I'm responsible for collecting attendee consent". Auto-capture stays off until this is true. */
  consent: boolean;
  /** Used to decide who is external and which events you organize. */
  myEmail: string;
}

export const DEFAULT_SETTINGS: CalSettings = {
  scope: "none",
  showHeader: true,
  emailNotice: false,
  chatNotice: true,
  consent: false,
  myEmail: "jordan@lumen.example",
};

export const SCOPE_LABEL: Record<CaptureScope, string> = {
  all: "All meetings",
  external: "Only meetings with external attendees",
  organized: "Only meetings I organize",
  none: "None",
};

export const PLATFORM_LABEL: Record<Platform, string> = { zoom: "Zoom", meet: "Meet", teams: "Teams" };

export type Overrides = Record<string, "capture" | "skip">;

export const domainOf = (email: string) => email.split("@")[1]?.toLowerCase() ?? "";

export const isExternal = (a: Attendee, s: CalSettings) => domainOf(a.email) !== domainOf(s.myEmail);
export const hasExternal = (e: CalEvent, s: CalSettings) => e.attendees.some((a) => isExternal(a, s));
export const isOrganizer = (e: CalEvent, s: CalSettings) => !!e.organizerEmail && e.organizerEmail.toLowerCase() === s.myEmail.toLowerCase();

export type CaptureDecision = { capture: boolean; reason: "consent" | "override" | "scope" };

/** Whether an event will be captured: a per-event override beats the global scope, and nothing is captured without consent. */
export function captureDecision(e: CalEvent, s: CalSettings, overrides: Overrides): CaptureDecision {
  if (!s.consent) return { capture: false, reason: "consent" };
  const o = overrides[e.id];
  if (o) return { capture: o === "capture", reason: "override" };
  const on = s.scope === "all" || (s.scope === "external" && hasExternal(e, s)) || (s.scope === "organized" && isOrganizer(e, s));
  return { capture: on, reason: "scope" };
}

/** Which scripted capture an event gets. */
export function classify(e: CalEvent): CaptureKind {
  if (e.kind) return e.kind;
  const t = e.title.toLowerCase();
  if (/stand-?up|daily|scrum/.test(t)) return "standup";
  if (/1[:\-: ]?1|one[- ]on[- ]one/.test(t)) return "one_on_one";
  if (/discovery|demo|sales|prospect|pitch/.test(t)) return "sales";
  if (/check-?in|customer|client|support/.test(t)) return "customer";
  if (/planning|roadmap|kick-?off|offsite|review/.test(t)) return "planning";
  if (e.attendees.length <= 2) return "one_on_one";
  return e.attendees.length >= 6 ? "planning" : "standup";
}

export function countdown(start: number, end: number, now: number): string {
  if (now >= start && now < end) return "Now";
  const mins = Math.ceil((start - now) / 60000);
  if (mins <= 1) return "in 1m";
  if (mins < 60) return `in ${mins}m`;
  const h = Math.floor(mins / 60);
  return `in ${h}h${mins % 60 ? ` ${mins % 60}m` : ""}`;
}

// ---- demo calendar -------------------------------------------------------

const MIN = 60_000;
const DAY = 86_400_000;

const att = (id: string, domain: string): Attendee => ({ name: PEOPLE[id].name, email: `${id}@${domain}` });
const lumen = (id: string) => att(id, "lumen.example");

function at(base: number, dayOffset: number, hour: number, minute: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

const dayStamp = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/**
 * Events for the 7 days after `base`, built from the current date: a weekday standup, a sales
 * discovery call starting about 25 minutes from now, then a 1:1, a customer check-in and the
 * 8-person planning meeting on the next three days.
 */
export function demoEvents(base: number): CalEvent[] {
  const out: CalEvent[] = [];
  for (let d = 0; d < 7; d++) {
    const start = at(base, d, 9, 30);
    const dow = new Date(start).getDay();
    if (dow === 0 || dow === 6 || start + 15 * MIN <= base) continue;
    out.push({
      id: `demo:standup:${dayStamp(start)}`,
      title: "Atlas eng standup",
      start,
      end: start + 15 * MIN,
      attendees: ["maya", "priya", "ben", "dev", "jordan"].map(lumen),
      organizerEmail: "maya@lumen.example",
      platform: "meet",
      kind: "standup",
    });
  }
  const sales = Math.ceil((base + 25 * MIN) / (5 * MIN)) * 5 * MIN;
  out.push({
    id: "demo:sales",
    title: "Discovery call: Kessler Field Services",
    start: sales,
    end: sales + 45 * MIN,
    attendees: [lumen("jordan"), lumen("marcus"), att("victor", "kessler.example"), att("claire", "kessler.example")],
    organizerEmail: "jordan@lumen.example",
    platform: "zoom",
    kind: "sales",
  });
  const oneOnOne = at(base, 1, 14, 0);
  out.push({
    id: "demo:one-on-one",
    title: "Jordan / Maya 1:1",
    start: oneOnOne,
    end: oneOnOne + 30 * MIN,
    attendees: [lumen("jordan"), lumen("maya")],
    organizerEmail: "jordan@lumen.example",
    platform: "meet",
    kind: "one_on_one",
  });
  const customer = at(base, 2, 11, 0);
  out.push({
    id: "demo:customer",
    title: "Orchard Health check-in",
    start: customer,
    end: customer + 30 * MIN,
    attendees: [lumen("aisha"), lumen("jordan"), att("greg", "orchard.example"), att("hana", "orchard.example")],
    organizerEmail: "aisha@lumen.example",
    platform: "teams",
    kind: "customer",
  });
  const planning = at(base, 3, 10, 0);
  out.push({
    id: "demo:planning",
    title: "Q2 planning: Atlas",
    start: planning,
    end: planning + 60 * MIN,
    attendees: ["jordan", "maya", "dev", "sofia", "marcus", "aisha", "tom", "lena"].map(lumen),
    organizerEmail: "jordan@lumen.example",
    platform: "zoom",
    kind: "planning",
  });
  return out.sort((a, b) => a.start - b.start);
}

/** Events that start within the next 7 days (or are happening now), earliest first. */
export function upcoming(events: CalEvent[], now: number): CalEvent[] {
  return events.filter((e) => e.end > now && e.start < now + 7 * DAY).sort((a, b) => a.start - b.start);
}
