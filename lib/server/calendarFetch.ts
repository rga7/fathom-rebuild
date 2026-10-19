// Fetches a private iCal link on the server. The URL is a secret: it is never logged, stored or put
// in an error, and failures surface only as the codes below.
import dns from "node:dns";
import https from "node:https";
import type { LookupAddress } from "node:dns";
import { isPrivateIp, normalizeCalendarUrl } from "./calendarUrl.ts";

export type FetchCode = "invalid_link" | "blocked_host" | "private_address" | "not_found" | "timeout" | "too_large" | "bad_content" | "upstream_error";

/** The message is the code only, so an accidental log or response can't leak the link. */
export class CalendarFetchError extends Error {
  code: FetchCode;
  constructor(code: FetchCode) {
    super(code);
    this.code = code;
  }
}

export const LIMITS = { timeoutMs: 10_000, maxBytes: 2_000_000, maxRedirects: 3 };

export type Lookup = (host: string) => Promise<{ address: string }[]>;

export interface RawResponse {
  status: number;
  headers: Record<string, string | undefined>;
  body: AsyncIterable<Uint8Array>;
  destroy: () => void;
}
export type Transport = (url: URL, signal: AbortSignal) => Promise<RawResponse>;

const defaultLookup: Lookup = (host) => dns.promises.lookup(host, { all: true, verbatim: true });

/** Resolves a host and refuses it if any address is private, loopback or link-local. */
export async function assertPublicHost(host: string, lookup: Lookup = defaultLookup): Promise<void> {
  let addrs: { address: string }[];
  try {
    addrs = await lookup(host);
  } catch {
    throw new CalendarFetchError("upstream_error");
  }
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new CalendarFetchError("private_address");
}

/** Real transport. Its socket lookup re-checks the address at connect time, so DNS can't change between check and use. */
export function httpsTransport(lookup: Lookup = defaultLookup): Transport {
  return (url, signal) =>
    new Promise((resolve, reject) => {
      const req = https.request(
        {
          protocol: "https:",
          host: url.hostname,
          port: 443,
          path: url.pathname + url.search,
          method: "GET",
          headers: { accept: "text/calendar, text/plain;q=0.9", "user-agent": "fathom-rebuild-calendar-sync" },
          agent: false,
          signal,
          lookup: ((host: string, options: { all?: boolean }, cb: (...args: unknown[]) => void) => {
            lookup(host).then(
              (addrs) => {
                if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) return cb(new CalendarFetchError("private_address"));
                const list = addrs.map((a) => ({ address: a.address, family: a.address.includes(":") ? 6 : 4 })) as LookupAddress[];
                if (options?.all) cb(null, list);
                else cb(null, list[0].address, list[0].family);
              },
              () => cb(new CalendarFetchError("upstream_error")),
            );
          }) as never,
        },
        (res) =>
          resolve({
            status: res.statusCode ?? 0,
            headers: Object.fromEntries(Object.entries(res.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])),
            body: res,
            destroy: () => res.destroy(),
          }),
      );
      req.on("error", (e) => reject(e));
      req.end();
    });
}

const REDIRECTS = new Set([301, 302, 303, 307, 308]);

export interface FetchOptions {
  transport?: Transport;
  lookup?: Lookup;
  timeoutMs?: number;
  maxBytes?: number;
}

export async function fetchCalendarText(raw: unknown, opts: FetchOptions = {}): Promise<string> {
  const { timeoutMs = LIMITS.timeoutMs, maxBytes = LIMITS.maxBytes } = opts;
  const lookup = opts.lookup ?? defaultLookup;
  const transport = opts.transport ?? httpsTransport(lookup);

  const first = normalizeCalendarUrl(raw);
  if (!first.ok) throw new CalendarFetchError(first.code);
  let url = first.url;

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    for (let hop = 0; ; hop++) {
      await assertPublicHost(url.hostname, lookup);
      let res: RawResponse;
      try {
        res = await transport(url, ctl.signal);
      } catch (e) {
        if (ctl.signal.aborted) throw new CalendarFetchError("timeout");
        if (e instanceof CalendarFetchError) throw e;
        throw new CalendarFetchError("upstream_error");
      }

      if (REDIRECTS.has(res.status)) {
        res.destroy();
        const loc = res.headers.location;
        if (!loc || hop >= LIMITS.maxRedirects) throw new CalendarFetchError("upstream_error");
        let next: URL;
        try {
          next = new URL(loc, url);
        } catch {
          throw new CalendarFetchError("upstream_error");
        }
        const checked = normalizeCalendarUrl(next.href);
        // Never follow a redirect to a different host.
        if (!checked.ok || checked.url.hostname !== url.hostname) throw new CalendarFetchError("blocked_host");
        url = checked.url;
        continue;
      }
      if (res.status === 401 || res.status === 403 || res.status === 404 || res.status === 410) {
        res.destroy();
        throw new CalendarFetchError("not_found");
      }
      if (res.status !== 200) {
        res.destroy();
        throw new CalendarFetchError("upstream_error");
      }

      const type = (res.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
      if (type !== "text/calendar" && type !== "text/plain") {
        res.destroy();
        throw new CalendarFetchError("bad_content");
      }
      const declared = Number(res.headers["content-length"]);
      if (Number.isFinite(declared) && declared > maxBytes) {
        res.destroy();
        throw new CalendarFetchError("too_large");
      }

      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        for await (const chunk of res.body) {
          size += chunk.byteLength;
          if (size > maxBytes) {
            res.destroy();
            throw new CalendarFetchError("too_large");
          }
          chunks.push(chunk);
        }
      } catch (e) {
        if (e instanceof CalendarFetchError) throw e;
        throw new CalendarFetchError(ctl.signal.aborted ? "timeout" : "upstream_error");
      }
      return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
    }
  } finally {
    clearTimeout(timer);
  }
}
