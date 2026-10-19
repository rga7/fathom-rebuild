import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseIcal, IcsError, zonedToEpoch } from "../lib/icalParse.ts";
import { captureDecision, classify, DEFAULT_SETTINGS, isExternal } from "../lib/calendar.ts";

const feed = readFileSync(new URL("./fixtures/feed.ics", import.meta.url), "utf8");
const NOW = Date.UTC(2026, 9, 19, 15, 0, 0); // Mon 2026-10-19 15:00Z
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 16) + "Z";
const byTitle = (r: ReturnType<typeof parseIcal>, title: string) => r.events.filter((e) => e.title === title).map((e) => iso(e.start));

test("weekly RRULE with a TZID: expands to the horizon, honours EXDATE and daylight saving", () => {
  const r = parseIcal(feed, { now: NOW, horizonDays: 7 });
  // Mon/Wed/Fri 09:30 America/New_York (EDT, UTC-4). Wed Oct 21 is an EXDATE; Mon Oct 26 09:30 EDT is inside the window.
  assert.deepEqual(byTitle(r, "Team sync"), ["2026-10-19T13:30Z", "2026-10-23T13:30Z", "2026-10-26T13:30Z"]);
  // Across the Nov 1 DST change: 09:30 is 14:30Z once New York is on EST (UTC-5).
  const later = parseIcal(feed, { now: Date.UTC(2026, 9, 29, 12), horizonDays: 7 });
  assert.deepEqual(byTitle(later, "Team sync"), ["2026-10-30T13:30Z", "2026-11-02T14:30Z", "2026-11-04T14:30Z"]);
});

test("a moved occurrence replaces the original rather than adding to it", () => {
  const r = parseIcal(feed, { now: NOW, horizonDays: 7 });
  assert.deepEqual(byTitle(r, "Pipeline review"), []);
  assert.deepEqual(byTitle(r, "Pipeline review (moved)"), ["2026-10-21T20:00Z"]);
});

test("time zones: IANA TZID without VTIMEZONE, Windows-style TZID with one, UTC, and floating times", () => {
  const r = parseIcal(feed, { now: NOW, horizonDays: 7, fallbackTz: "Europe/Berlin" });
  assert.deepEqual(byTitle(r, "Vendor call"), ["2026-10-21T13:00Z"], "Asia/Kolkata is UTC+5:30");
  assert.deepEqual(byTitle(r, "Windows zone event"), ["2026-10-23T18:00Z"], "Eastern Standard Time rules from the file's VTIMEZONE (EDT in October)");
  assert.deepEqual(byTitle(r, "Design crit"), ["2026-10-22T17:00Z"]);
  assert.deepEqual(byTitle(r, "Floating time event"), ["2026-10-22T08:00Z"], "floating 10:00 in the fallback zone (Berlin, CEST)");
  const ny = parseIcal(feed, { now: NOW, horizonDays: 7, fallbackTz: "America/Los_Angeles" });
  assert.deepEqual(byTitle(ny, "Floating time event"), ["2026-10-22T17:00Z"]);
});

test("all-day and cancelled events are skipped; counts are reported", () => {
  const r = parseIcal(feed, { now: NOW, horizonDays: 7 });
  assert.equal(r.events.some((e) => e.title === "Office closed" || e.title === "Cancelled thing"), false);
  assert.equal(r.total, 9);
  assert.ok(r.skipped >= 2);
  assert.equal(r.truncated, 0);
});

test("platform from LOCATION, DESCRIPTION and X-GOOGLE-CONFERENCE; external attendees by email domain", () => {
  const r = parseIcal(feed, { now: NOW, horizonDays: 7 });
  const sync = r.events.find((e) => e.title === "Team sync")!;
  assert.equal(sync.platform, "zoom");
  assert.equal(r.events.find((e) => e.title === "Vendor call")!.platform, "teams");
  assert.equal(r.events.find((e) => e.title === "Design crit")!.platform, "meet");
  assert.equal(r.events.find((e) => e.title === "Floating time event")!.platform, null);
  assert.equal(sync.organizerEmail, "jordan@lumen.example");
  const s = { ...DEFAULT_SETTINGS, myEmail: "jordan@lumen.example" };
  assert.deepEqual(sync.attendees.filter((a) => isExternal(a, s)).map((a) => a.email), ["pat@partner.example"]);
  // the same events feed Auto/Skip decisions and the capture script choice
  assert.equal(captureDecision(sync, { ...s, consent: true, scope: "external" }, {}).capture, true);
  assert.equal(captureDecision(sync, { ...s, consent: false, scope: "all" }, {}).capture, false);
  assert.equal(classify(sync), "standup");
});

test("event ids are stable across parses and unique per occurrence", () => {
  const a = parseIcal(feed, { now: NOW });
  const b = parseIcal(feed, { now: NOW + 60_000 });
  assert.deepEqual(a.events.map((e) => e.id), b.events.map((e) => e.id));
  assert.equal(new Set(a.events.map((e) => e.id)).size, a.events.length);
});

test("invalid input gives clear errors", () => {
  assert.throws(() => parseIcal("hello"), IcsError);
  assert.throws(() => parseIcal("BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:x\n"), (e) => e instanceof IcsError || e instanceof Error);
  assert.equal(parseIcal("BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR\n").total, 0);
  assert.throws(() => parseIcal("BEGIN:VCALENDAR\n" + "x".repeat(2_100_000)), IcsError);
});

test("a pathological RRULE can't hang or flood: capped output and bounded work", () => {
  const ics = "BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:p@x\nSUMMARY:Often\nDTSTART:20200101T000000Z\nDTEND:20200101T000500Z\nRRULE:FREQ=MINUTELY\nEND:VEVENT\nEND:VCALENDAR\n";
  const t = Date.now();
  const r = parseIcal(ics, { now: NOW, horizonDays: 7 });
  assert.ok(Date.now() - t < 8000, "bounded time");
  assert.ok(r.events.length <= 200);
});

test("zonedToEpoch handles offsets and DST gaps", () => {
  assert.equal(iso(zonedToEpoch(2026, 7, 1, 12, 0, 0, "America/New_York")), "2026-07-01T16:00Z");
  assert.equal(iso(zonedToEpoch(2026, 12, 1, 12, 0, 0, "America/New_York")), "2026-12-01T17:00Z");
  assert.equal(iso(zonedToEpoch(2026, 10, 21, 18, 30, 0, "Asia/Kolkata")), "2026-10-21T13:00Z");
});
