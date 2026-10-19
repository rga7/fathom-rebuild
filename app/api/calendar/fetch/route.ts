// POST /api/calendar/fetch  { url, tz? }  ->  { events, truncated }  |  { error }
//
// The url is a private calendar link and therefore a secret. This handler never logs it, never
// stores it, never puts it in an error and never echoes it back: failures are short fixed codes.
import { parseIcal, IcsError } from "@/lib/icalParse";
import { CalendarFetchError, fetchCalendarText, type FetchCode } from "@/lib/server/calendarFetch";
import { RateLimiter } from "@/lib/server/calendarUrl";

export const dynamic = "force-dynamic";

type ErrorCode = FetchCode | "rate_limited" | "empty" | "bad_request";

const STATUS: Record<ErrorCode, number> = {
  invalid_link: 400,
  bad_request: 400,
  blocked_host: 400,
  private_address: 400,
  not_found: 404,
  rate_limited: 429,
  too_large: 413,
  bad_content: 422,
  empty: 422,
  timeout: 504,
  upstream_error: 502,
};

const limiter = new RateLimiter(10, 60_000);

const headers = { "Cache-Control": "no-store" };
const fail = (code: ErrorCode, extra: Record<string, string> = {}) => Response.json({ error: code }, { status: STATUS[code], headers: { ...headers, ...extra } });

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  if (!limiter.allow(clientIp(req))) return fail("rate_limited", { "Retry-After": "60" });

  let url: unknown;
  let tz: unknown;
  try {
    const text = await req.text();
    if (text.length > 4096) return fail("bad_request");
    ({ url, tz } = JSON.parse(text));
  } catch {
    return fail("bad_request");
  }

  try {
    const ics = await fetchCalendarText(url);
    const result = parseIcal(ics, { horizonDays: 7, fallbackTz: typeof tz === "string" ? tz : undefined });
    if (result.total === 0) return fail("empty");
    return Response.json({ events: result.events, truncated: result.truncated }, { headers });
  } catch (e) {
    if (e instanceof CalendarFetchError) return fail(e.code);
    if (e instanceof IcsError) return fail("bad_content");
    return fail("upstream_error");
  }
}
