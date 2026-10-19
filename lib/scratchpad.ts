// Turns "@Name do the thing by Friday" lines in the scratchpad into action items.
import type { Meeting, PersonId } from "../data/types.ts";
import { PEOPLE } from "../data/people.ts";
import { dayKey } from "./format.ts";

export interface MentionItem {
  id: string;
  text: string;
  owner: PersonId | null;
  /** The name as typed, for unknown mentions. */
  mention: string;
  due: string | null;
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

function weekday(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const DUE_RE = new RegExp(
  `\\s*\\b(?:by|due|before)\\s+(today|tomorrow|eod|next week|(?:${WEEKDAYS.join("|")})|(?:${MONTHS.join("|")})[a-z]*\\.?\\s+\\d{1,2}|\\d{4}-\\d{2}-\\d{2})\\b`,
  "i",
);

/** Resolve a due phrase relative to the meeting day. */
export function parseDue(phrase: string, meetingDay: string): string | null {
  const p = phrase.toLowerCase().trim();
  if (p === "today" || p === "eod") return meetingDay;
  if (p === "tomorrow") return addDays(meetingDay, 1);
  if (p === "next week") return addDays(meetingDay, 7);
  const wd = WEEKDAYS.indexOf(p);
  if (wd >= 0) {
    const diff = (wd - weekday(meetingDay) + 7) % 7 || 7;
    return addDays(meetingDay, diff);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
  const md = p.match(/^([a-z]+)\.?\s+(\d{1,2})$/);
  if (md) {
    const mi = MONTHS.indexOf(md[1].slice(0, 3));
    if (mi < 0) return null;
    const year = Number(meetingDay.slice(0, 4));
    let ymd = `${year}-${String(mi + 1).padStart(2, "0")}-${md[2].padStart(2, "0")}`;
    if (ymd < meetingDay) ymd = `${year + 1}${ymd.slice(4)}`;
    return ymd;
  }
  return null;
}

function resolvePerson(name: string, m: Meeting): PersonId | null {
  const n = name.toLowerCase();
  const byFirst = (ids: string[]) => ids.find((id) => PEOPLE[id]?.name.split(" ")[0].toLowerCase() === n);
  return byFirst(m.participants) ?? byFirst(Object.keys(PEOPLE)) ?? null;
}

export function parseMentions(text: string, m: Meeting): MentionItem[] {
  const day = dayKey(m.startedAt);
  const items: MentionItem[] = [];
  text.split("\n").forEach((raw, i) => {
    const at = raw.match(/@([A-Za-z]+)/);
    if (!at) return;
    let body = raw.replace(at[0], "").replace(/^\s*[-*•]\s*/, "");
    let due: string | null = null;
    const d = body.match(DUE_RE);
    if (d) {
      due = parseDue(d[1], day);
      body = body.replace(d[0], "");
    }
    body = body.replace(/^[\s,:;-]+/, "").replace(/[\s.,;]+$/, "").trim();
    if (!body) return;
    items.push({
      id: `sp-${i}`,
      text: body[0].toUpperCase() + body.slice(1),
      owner: resolvePerson(at[1], m),
      mention: at[1],
      due,
    });
  });
  return items;
}
