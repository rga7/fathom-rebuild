// URL and address rules for the private calendar link. The link is a secret, so nothing here
// puts a URL (or any part of it besides the allow-listed host) into a message or return value
// that could be logged or echoed.
import net from "node:net";

export const ALLOWED_HOSTS = ["calendar.google.com", "outlook.office365.com", "outlook.live.com"] as const;

export function isAllowedHost(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  if ((ALLOWED_HOSTS as readonly string[]).includes(h)) return true;
  // *.icloud.com: at least one label in front, made only of letters, digits and hyphens.
  return /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+icloud\.com$/.test(h);
}

export type UrlResult = { ok: true; url: URL } | { ok: false; code: "invalid_link" | "blocked_host" };

/** https only (webcal:// is read as https://), allow-listed host, default port, no embedded credentials. */
export function normalizeCalendarUrl(raw: unknown): UrlResult {
  if (typeof raw !== "string") return { ok: false, code: "invalid_link" };
  let s = raw.trim();
  if (!s || s.length > 2048) return { ok: false, code: "invalid_link" };
  s = s.replace(/^webcals?:\/\//i, "https://");
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return { ok: false, code: "invalid_link" };
  }
  if (url.protocol !== "https:" || url.username || url.password) return { ok: false, code: "invalid_link" };
  if (url.port && url.port !== "443") return { ok: false, code: "blocked_host" };
  if (!isAllowedHost(url.hostname)) return { ok: false, code: "blocked_host" };
  url.hash = "";
  return { ok: true, url };
}

// ---- address checks --------------------------------------------------------

function v4Private(a: number, b: number, c: number): boolean {
  return (
    a === 0 || // "this" network
    a === 10 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    a === 127 || // loopback
    (a === 169 && b === 254) || // link-local, includes cloud metadata 169.254.169.254
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) || // IETF protocol assignments
    (a === 192 && b === 0 && c === 2) || // documentation
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    (a === 198 && b === 51 && c === 100) || // documentation
    (a === 203 && b === 0 && c === 113) || // documentation
    a >= 224 // multicast, reserved, broadcast
  );
}

/** Expands "::" and an embedded dotted tail into eight 16-bit groups. Null if not an IPv6 address. */
function parseV6(ip: string): number[] | null {
  if (!net.isIPv6(ip) || ip.includes("%")) return null;
  let s = ip.toLowerCase();
  const dotted = s.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (dotted) {
    const [a, b, c, d] = dotted.slice(1).map(Number);
    s = s.slice(0, dotted.index) + ((a << 8) | b).toString(16) + ":" + ((c << 8) | d).toString(16);
  }
  const [head, tail] = s.split("::");
  const h = head ? head.split(":") : [];
  const t = tail !== undefined && tail ? tail.split(":") : [];
  const fill = s.includes("::") ? 8 - h.length - t.length : 0;
  const groups = [...h, ...Array(Math.max(0, fill)).fill("0"), ...t].map((g) => parseInt(g, 16));
  return groups.length === 8 && groups.every((g) => Number.isInteger(g) && g >= 0 && g <= 0xffff) ? groups : null;
}

/** True for loopback, private, link-local, multicast, reserved and unparseable addresses. Anything unsure counts as private. */
export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b, c] = ip.split(".").map(Number);
    return v4Private(a, b, c);
  }
  const g = parseV6(ip);
  if (!g) return true;
  const embeddedV4 = (hi: number, lo: number) => v4Private(hi >> 8, hi & 255, lo >> 8);
  if (g.every((x) => x === 0)) return true; // ::
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return true; // ::1
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return embeddedV4(g[6], g[7]); // ::ffff:a.b.c.d
  if (g.slice(0, 6).every((x) => x === 0)) return embeddedV4(g[6], g[7]); // deprecated IPv4-compatible ::a.b.c.d
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return embeddedV4(g[6], g[7]); // NAT64
  if (g[0] === 0x2002) return embeddedV4(g[1], g[2]); // 6to4 embeds an IPv4 address
  if ((g[0] & 0xffc0) === 0xfe80) return true; // link-local fe80::/10
  if ((g[0] & 0xffc0) === 0xfec0) return true; // deprecated site-local
  if ((g[0] & 0xfe00) === 0xfc00) return true; // unique local fc00::/7
  if ((g[0] & 0xff00) === 0xff00) return true; // multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // documentation
  if (g[0] === 0x0100 && g.slice(1, 4).every((x) => x === 0)) return true; // discard-only
  return false;
}

// ---- rate limit -------------------------------------------------------------

/** Sliding-window limiter, in memory: per server instance, which is enough to blunt casual abuse. */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private max: number;
  private windowMs: number;
  private maxKeys: number;

  constructor(max: number, windowMs: number, maxKeys = 5000) {
    this.max = max;
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
  }

  allow(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > this.maxKeys) {
      for (const [k, v] of this.hits) if (v.every((t) => now - t >= this.windowMs)) this.hits.delete(k);
      // Still too big (many distinct active keys): drop the oldest entries.
      for (const k of this.hits.keys()) {
        if (this.hits.size <= this.maxKeys) break;
        this.hits.delete(k);
      }
    }
    return true;
  }
}
