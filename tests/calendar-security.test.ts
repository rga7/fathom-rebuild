// Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedHost, isPrivateIp, normalizeCalendarUrl, RateLimiter } from "../lib/server/calendarUrl.ts";
import { CalendarFetchError, fetchCalendarText, type Lookup, type RawResponse, type Transport } from "../lib/server/calendarFetch.ts";

const SECRET = "SECRETTOKEN123abc";
const GOOD = `https://calendar.google.com/calendar/ical/me%40example.com/private-${SECRET}/basic.ics`;

test("host allowlist accepts only the listed hosts and *.icloud.com", () => {
  for (const h of ["calendar.google.com", "CALENDAR.GOOGLE.COM", "outlook.office365.com", "outlook.live.com", "p01-caldav.icloud.com", "a.b.icloud.com", "calendar.google.com."]) {
    assert.equal(isAllowedHost(h), true, h);
  }
  for (const h of [
    "google.com", "evil.com", "calendar.google.com.evil.com", "evilcalendar.google.com", "xcalendar.google.com", "icloud.com", "evil-icloud.com",
    "xicloud.com", "icloud.com.evil.com", "outlook.office365.com.evil.test", "office365.com", "outlook.live.com.evil.com", "127.0.0.1", "[::1]", ".icloud.com",
    "-.icloud.com", "", "localhost", "metadata.google.internal",
  ]) {
    assert.equal(isAllowedHost(h), false, h);
  }
});

test("normalizeCalendarUrl: https only, webcal becomes https, no credentials, default port", () => {
  const ok = normalizeCalendarUrl(`webcal://p01-caldav.icloud.com/published/2/${SECRET}`);
  assert.ok(ok.ok && ok.url.protocol === "https:" && ok.url.hostname === "p01-caldav.icloud.com");
  assert.ok(normalizeCalendarUrl(GOOD).ok);
  assert.ok(normalizeCalendarUrl(`  ${GOOD}#frag `).ok);

  const invalid = [
    "http://calendar.google.com/x.ics", "ftp://calendar.google.com/x", "file:///etc/passwd", "javascript:alert(1)", "not a url", "", "   ", 42, null, undefined, {},
    "https://user:pw@calendar.google.com/x.ics", "https://calendar.google.com@evil.com/x.ics", "https://" + "a".repeat(3000),
  ];
  for (const u of invalid) {
    const r = normalizeCalendarUrl(u);
    assert.ok(!r.ok && r.code === "invalid_link", String(u).slice(0, 40));
  }
  const blocked = [
    "https://evil.com/calendar.google.com", "https://calendar.google.com.evil.com/x", "https://calendar.googIe.com/x", "https://127.0.0.1/x", "https://[::1]/x",
    "https://169.254.169.254/latest/meta-data", "https://localhost/x", "https://calendar.google.com:8443/x", "https://evil.com\\@calendar.google.com/x",
    "https://2130706433/x", "https://0x7f.1/x",
  ];
  for (const u of blocked) {
    const r = normalizeCalendarUrl(u);
    assert.ok(!r.ok, u);
  }
});

test("isPrivateIp: private, loopback, link-local, mapped and malformed addresses are refused", () => {
  const priv = [
    "0.0.0.0", "10.0.0.1", "10.255.255.255", "100.64.0.1", "127.0.0.1", "127.255.0.9", "169.254.169.254", "172.16.0.1", "172.31.255.255", "192.168.1.1", "192.0.0.1",
    "198.18.0.1", "224.0.0.1", "240.0.0.1", "255.255.255.255", "::", "::1", "fe80::1", "febf::1", "fc00::1", "fd12:3456:789a::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:7f00:1",
    "::ffff:10.0.0.1", "::ffff:a9fe:a9fe", "64:ff9b::7f00:1", "2002:7f00:1::1", "2001:db8::1", "0:0:0:0:0:0:0:1", "::127.0.0.1", "fe80::1%eth0", "garbage", "", "1.2.3", "999.1.1.1",
  ];
  for (const ip of priv) assert.equal(isPrivateIp(ip), true, ip);
  const pub = ["8.8.8.8", "1.1.1.1", "142.250.80.46", "172.15.0.1", "172.32.0.1", "100.63.0.1", "100.128.0.1", "198.20.0.1", "2607:f8b0:4004:c07::71", "2a00:1450:4001::1", "::ffff:8.8.8.8", "64:ff9b::808:808"];
  for (const ip of pub) assert.equal(isPrivateIp(ip), false, ip);
});

test("RateLimiter: per-key sliding window", () => {
  const r = new RateLimiter(3, 1000);
  assert.ok(r.allow("a", 0) && r.allow("a", 1) && r.allow("a", 2));
  assert.equal(r.allow("a", 3), false);
  assert.ok(r.allow("b", 3), "other keys are independent");
  assert.ok(r.allow("a", 1001), "the oldest hit has expired");
  const small = new RateLimiter(1, 1000, 3);
  for (let i = 0; i < 20; i++) small.allow(`k${i}`, i);
  assert.ok(small.allow("fresh", 25), "stays bounded under many keys");
});

// ---- fetchCalendarText with a mock transport -------------------------------------------------

const PUBLIC: Lookup = async () => [{ address: "142.250.80.46" }];
const body = (...parts: string[]) =>
  (async function* () {
    for (const p of parts) yield new TextEncoder().encode(p);
  })();
const reply = (status: number, headers: Record<string, string> = {}, parts: string[] = ["BEGIN:VCALENDAR\nEND:VCALENDAR"]): RawResponse => ({
  status,
  headers: { "content-type": "text/calendar; charset=utf-8", ...headers },
  body: body(...parts),
  destroy: () => {},
});
const seq = (...rs: RawResponse[]): { t: Transport; calls: URL[] } => {
  const calls: URL[] = [];
  return { calls, t: async (u) => (calls.push(u), rs[Math.min(calls.length - 1, rs.length - 1)]) };
};

async function code(p: Promise<unknown>): Promise<{ code: string; leak: boolean }> {
  try {
    await p;
  } catch (e) {
    assert.ok(e instanceof CalendarFetchError, `unexpected error type: ${String(e)}`);
    const dump = `${e.message} ${e.code} ${JSON.stringify(e)} ${e.stack}`;
    return { code: e.code, leak: dump.includes(SECRET) || dump.includes("calendar.google.com") };
  }
  assert.fail("expected an error");
}

test("fetch: success returns text; accepts text/calendar and text/plain", async () => {
  const a = await fetchCalendarText(GOOD, { lookup: PUBLIC, transport: seq(reply(200)).t });
  assert.match(a, /BEGIN:VCALENDAR/);
  const b = await fetchCalendarText(GOOD, { lookup: PUBLIC, transport: seq(reply(200, { "content-type": "TEXT/PLAIN" })).t });
  assert.match(b, /VCALENDAR/);
});

test("fetch: private or mixed DNS answers are refused before any request", async () => {
  for (const addrs of [["10.0.0.5"], ["127.0.0.1"], ["169.254.169.254"], ["::1"], ["142.250.80.46", "192.168.0.10"], []]) {
    const s = seq(reply(200));
    const r = await code(fetchCalendarText(GOOD, { lookup: async () => addrs.map((address) => ({ address })), transport: s.t }));
    assert.equal(r.code, "private_address");
    assert.equal(r.leak, false);
    assert.equal(s.calls.length, 0, "no request is made");
  }
});

test("fetch: rejects bad links and hosts without touching the network", async () => {
  const s = seq(reply(200));
  for (const [u, c] of [["http://calendar.google.com/x", "invalid_link"], ["https://evil.example/x", "blocked_host"], [null, "invalid_link"]] as const) {
    const r = await code(fetchCalendarText(u, { lookup: PUBLIC, transport: s.t }));
    assert.equal(r.code, c);
  }
  assert.equal(s.calls.length, 0);
});

test("fetch: redirects stay on the same host, are capped, and never leave it", async () => {
  const same = seq(reply(302, { location: `/calendar/ical/other/${SECRET}/basic.ics` }), reply(200));
  assert.match(await fetchCalendarText(GOOD, { lookup: PUBLIC, transport: same.t }), /VCALENDAR/);
  assert.equal(same.calls.length, 2);
  assert.equal(same.calls[1].hostname, "calendar.google.com");

  for (const loc of ["https://evil.example/x.ics", "https://outlook.live.com/x.ics", "http://calendar.google.com/x.ics", "https://127.0.0.1/x"]) {
    const s = seq(reply(301, { location: loc }), reply(200));
    const r = await code(fetchCalendarText(GOOD, { lookup: PUBLIC, transport: s.t }));
    assert.equal(r.code, "blocked_host", loc);
    assert.equal(s.calls.length, 1, "the other host is never requested");
    assert.equal(r.leak, false);
  }
  const loop = seq(reply(302, { location: "/a" }));
  assert.equal((await code(fetchCalendarText(GOOD, { lookup: PUBLIC, transport: loop.t }))).code, "upstream_error");
  assert.ok(loop.calls.length <= 4);
});

test("fetch: content type, size and status handling", async () => {
  const run = (r: RawResponse, o = {}) => code(fetchCalendarText(GOOD, { lookup: PUBLIC, transport: seq(r).t, ...o }));
  assert.equal((await run(reply(200, { "content-type": "text/html" }))).code, "bad_content");
  assert.equal((await run(reply(200, { "content-type": "application/json" }))).code, "bad_content");
  assert.equal((await run(reply(200, { "content-type": "" }))).code, "bad_content");
  assert.equal((await run(reply(200, { "content-length": "999999999" }))).code, "too_large");
  assert.equal((await run(reply(200, {}, ["x".repeat(600), "y".repeat(600)]), { maxBytes: 1000 })).code, "too_large");
  for (const s of [401, 403, 404, 410]) assert.equal((await run(reply(s))).code, "not_found");
  for (const s of [429, 500, 503]) assert.equal((await run(reply(s))).code, "upstream_error");
  const failing: Transport = async () => {
    throw new Error(`connect ECONNREFUSED ${SECRET}`);
  };
  const r = await code(fetchCalendarText(GOOD, { lookup: PUBLIC, transport: failing }));
  assert.equal(r.code, "upstream_error");
  assert.equal(r.leak, false, "transport error text is not passed on");
});

test("fetch: times out", async () => {
  const hang: Transport = (_u, signal) => new Promise((_res, rej) => signal.addEventListener("abort", () => rej(new Error("aborted"))));
  const r = await code(fetchCalendarText(GOOD, { lookup: PUBLIC, transport: hang, timeoutMs: 40 }));
  assert.equal(r.code, "timeout");
  const slow = (async function* () {
    yield new TextEncoder().encode("BEGIN:VCALENDAR\n");
    await new Promise((r) => setTimeout(r, 300));
    yield new TextEncoder().encode("END:VCALENDAR");
  })();
  const t2: Transport = async (_u, signal) => ({
    status: 200,
    headers: { "content-type": "text/calendar" },
    body: (async function* () {
      for await (const c of slow) {
        if (signal.aborted) throw new Error("aborted");
        yield c;
      }
    })(),
    destroy: () => {},
  });
  assert.equal((await code(fetchCalendarText(GOOD, { lookup: PUBLIC, transport: t2, timeoutMs: 100 }))).code, "timeout");
});
