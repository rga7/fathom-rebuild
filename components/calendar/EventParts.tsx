"use client";
import { initials } from "@/data/people";
import { PLATFORM_LABEL, isExternal, type CalEvent, type CalSettings, type Platform } from "@/lib/calendar";

const PLATFORM_STYLE: Record<Platform, string> = {
  zoom: "bg-blue-500/15 text-blue-300",
  meet: "bg-emerald-500/15 text-emerald-300",
  teams: "bg-violet-500/15 text-violet-300",
};

export function PlatformBadge({ platform }: { platform: Platform | null }) {
  if (!platform) return <span className="rounded bg-raised px-1.5 py-0.5 text-[11px] text-faint">No link</span>;
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${PLATFORM_STYLE[platform]}`}>{PLATFORM_LABEL[platform]}</span>;
}

/** Initials for each attendee. External attendees get an amber ring. */
export function Attendees({ event, settings, max = 5 }: { event: CalEvent; settings: CalSettings; max?: number }) {
  const external = event.attendees.filter((a) => isExternal(a, settings)).length;
  return (
    <span className="flex items-center gap-2">
      <span className="flex -space-x-1">
        {event.attendees.slice(0, max).map((a) => (
          <span
            key={a.email}
            title={`${a.name} <${a.email}>${isExternal(a, settings) ? " (external)" : ""}`}
            className={`flex h-6 w-6 items-center justify-center rounded-full bg-raised text-[8px] font-semibold text-fg ring-2 ${
              isExternal(a, settings) ? "ring-amber-400/70" : "ring-panel"
            }`}
          >
            {initials(a.name)}
          </span>
        ))}
      </span>
      <span className="text-[12px] text-faint">
        {event.attendees.length} {event.attendees.length === 1 ? "attendee" : "attendees"}
        {external > 0 && <span className="text-amber-300"> · {external} external</span>}
      </span>
    </span>
  );
}
