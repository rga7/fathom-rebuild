// Values derived from the transcript at runtime, never hard-coded in seed data.
import type { Line, Meeting, PersonId } from "../data/types.ts";

export function durationSec(m: Pick<Meeting, "lines">): number {
  return m.lines.length ? m.lines[m.lines.length - 1].end : 0;
}

export interface TalkTime {
  speaker: PersonId;
  seconds: number;
  share: number;
}

export function talkTime(m: Pick<Meeting, "lines">): TalkTime[] {
  const totals = new Map<PersonId, number>();
  for (const l of m.lines) totals.set(l.speaker, (totals.get(l.speaker) ?? 0) + (l.end - l.start));
  const all = [...totals.values()].reduce((a, b) => a + b, 0) || 1;
  return [...totals.entries()]
    .map(([speaker, seconds]) => ({ speaker, seconds, share: seconds / all }))
    .sort((a, b) => b.seconds - a.seconds);
}

export function lineById(m: Pick<Meeting, "lines">, id: string): Line | undefined {
  return m.lines.find((l) => l.id === id);
}

export function lineStart(m: Pick<Meeting, "lines">, id: string): number {
  return lineById(m, id)?.start ?? 0;
}

/** Index of the line playing at time t (last line whose start <= t). Binary search. */
export function activeLineIndex(lines: Line[], t: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].start <= t) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

export function chapterAt(m: Meeting, t: number): Meeting["chapters"][number] | undefined {
  let found: Meeting["chapters"][number] | undefined;
  for (const c of m.chapters) if (lineStart(m, c.startLineId) <= t) found = c;
  return found;
}
