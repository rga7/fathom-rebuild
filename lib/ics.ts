// .ics file import (browser side). Same parser as the private-link sync, with a wider window
// because an imported file is stored once and viewed later.
import type { CalEvent } from "./calendar.ts";
import { IcsError, MAX_EVENTS, parseIcal } from "./icalParse.ts";

export { IcsError, MAX_EVENTS };

export interface IcsResult {
  events: CalEvent[];
  /** All-day or cancelled events left out. */
  skipped: number;
  /** Events dropped because the file has more than MAX_EVENTS. */
  truncated: number;
}

export function parseIcs(text: string, now = Date.now()): IcsResult {
  const r = parseIcal(text, { now, horizonDays: 30 });
  if (r.total === 0) throw new IcsError("No events found in that file.");
  if (r.events.length === 0) throw new IcsError(`No usable events in the next 30 days (${r.skipped} skipped: all-day or cancelled).`);
  return { events: r.events, skipped: r.skipped, truncated: r.truncated };
}
