"use client";
// Private calendar link sync. The link is a secret: it lives in localStorage and in the body of
// POST /api/calendar/fetch, which fetches it and keeps nothing. It is never shown (only its host is),
// logged, or put in an error message here.
import { useSyncExternalStore } from "react";
import type { CalEvent } from "./calendar";
import { DEMO_HIDDEN_KEY, FEED_URL_KEY } from "./calendarStore";
import { isPersisted, readStored, writeStored } from "./storage";

export type SyncError =
  | "invalid_link" | "blocked_host" | "private_address" | "not_found" | "timeout" | "too_large"
  | "bad_content" | "empty" | "rate_limited" | "upstream_error" | "bad_request" | "network";

export const SYNC_ERROR_TEXT: Record<SyncError, string> = {
  invalid_link: "That doesn't look like a valid calendar link. It should start with https:// or webcal://.",
  blocked_host: "That link isn't from a supported calendar. Supported: Google Calendar, Outlook (outlook.office365.com, outlook.live.com) and iCloud.",
  private_address: "That link points to a private network address, which isn't allowed.",
  not_found: "The calendar service rejected the link (not found, or no longer valid). Check you copied the secret address in iCal format, or reset the link in your calendar.",
  timeout: "The calendar took too long to respond (over 10 seconds). Try again.",
  too_large: "That calendar feed is too large (over 2 MB).",
  bad_content: "The link didn't return calendar data. Make sure it's the iCal (.ics) address.",
  empty: "That calendar has no events.",
  rate_limited: "Too many sync attempts. Wait a minute and try again.",
  upstream_error: "The calendar service had a problem. Try again in a moment.",
  bad_request: "Couldn't send that link to the sync service.",
  network: "Couldn't reach the sync service. Check your connection and try again.",
};

const KNOWN = new Set(Object.keys(SYNC_ERROR_TEXT));

export class SyncFailure extends Error {
  code: SyncError;
  constructor(code: SyncError) {
    super(code);
    this.code = code;
  }
}

/** Asks the server to fetch and parse the link. Failures carry a code only. */
export async function fetchFeed(url: string): Promise<{ events: CalEvent[]; truncated: number }> {
  let res: Response;
  try {
    res = await fetch("/api/calendar/fetch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({ url, tz: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    });
  } catch {
    throw new SyncFailure("network");
  }
  let data: { events?: CalEvent[]; truncated?: number; error?: string } = {};
  try {
    data = await res.json();
  } catch {}
  if (!res.ok || !Array.isArray(data.events)) throw new SyncFailure(data.error && KNOWN.has(data.error) ? (data.error as SyncError) : "upstream_error");
  return { events: data.events, truncated: data.truncated ?? 0 };
}

export const hostOf = (url: string): string => {
  try {
    return new URL(url.trim().replace(/^webcals?:\/\//i, "https://")).hostname;
  } catch {
    return "";
  }
};

// ---- shared sync state (in memory) --------------------------------------------------------

interface SyncState {
  syncing: boolean;
  error: SyncError | null;
}
let state: SyncState = { syncing: false, error: null };
const listeners = new Set<() => void>();
const set = (next: Partial<SyncState>) => {
  state = { ...state, ...next };
  listeners.forEach((fn) => fn());
};
export function useSyncState(): SyncState {
  return useSyncExternalStore(
    (fn) => (listeners.add(fn), () => void listeners.delete(fn)),
    () => state,
    () => state,
  );
}

let inflight: Promise<void> | null = null;
let lastGood = 0;

/**
 * Syncs the stored link. On failure the last good events stay in place and the error is shown.
 * Automatic callers skip it if a sync just succeeded (e.g. right after connecting); "Sync now" forces one.
 */
export function syncNow(opts: { force?: boolean } = {}): Promise<void> {
  if (inflight) return inflight;
  if (!opts.force && Date.now() - lastGood < 5000) return Promise.resolve();
  const url = readStored<string | null>(FEED_URL_KEY, null);
  if (!url) return Promise.resolve();
  set({ syncing: true });
  inflight = (async () => {
    try {
      const { events, truncated } = await fetchFeed(url);
      // The link may have been removed (Disconnect) while the request was in flight.
      if (readStored<string | null>(FEED_URL_KEY, null) !== url) return;
      writeStored("cal-source", { kind: "feed", host: hostOf(url), events, syncedAt: Date.now(), truncated });
      lastGood = Date.now();
      set({ error: null });
    } catch (e) {
      set({ error: e instanceof SyncFailure ? e.code : "upstream_error" });
    } finally {
      set({ syncing: false });
      inflight = null;
    }
  })();
  return inflight;
}

/** Connects a link: it must sync once before it is stored. Resolves with a note if storage is unavailable. */
export async function connectFeed(url: string): Promise<{ persisted: boolean }> {
  const trimmed = url.trim();
  const { events, truncated } = await fetchFeed(trimmed);
  writeStored(FEED_URL_KEY, trimmed);
  writeStored("cal-source", { kind: "feed", host: hostOf(trimmed), events, syncedAt: Date.now(), truncated });
  writeStored("cal-overrides", null);
  lastGood = Date.now();
  set({ error: null });
  return { persisted: isPersisted(FEED_URL_KEY) };
}

/** Removes whatever is connected (link, imported file or demo) and remembers not to bring the demo back. */
export function disconnectFeed() {
  writeStored(DEMO_HIDDEN_KEY, true);
  writeStored(FEED_URL_KEY, null);
  writeStored("cal-source", null);
  writeStored("cal-overrides", null);
  set({ error: null });
}
