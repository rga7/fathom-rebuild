"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { captureDecision, countdown, upcoming, type CalEvent } from "@/lib/calendar";
import { useCalEvents, useCalSettings, useNow, useOverrides } from "@/lib/calendarStore";
import { IconClock } from "../icons";
import { Attendees, PlatformBadge } from "./EventParts";
import { CaptureAction } from "./CaptureAction";

export const eventAnchor = (id: string) => `event-${encodeURIComponent(id)}`;

const dayLabel = (ms: number, now: number) => {
  const d = new Date(ms).setHours(0, 0, 0, 0);
  const today = new Date(now).setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86_400_000);
  const base = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" }).format(ms);
  return diff === 0 ? `Today · ${base}` : diff === 1 ? `Tomorrow · ${base}` : base;
};
const timeRange = (e: CalEvent) => {
  const f = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  return `${f.format(e.start)} – ${f.format(e.end)}`;
};

function EventRow({ event, now, focused }: { event: CalEvent; now: number; focused: boolean }) {
  const [settings] = useCalSettings();
  const [overrides, setOverrides] = useOverrides();
  const decision = captureDecision(event, settings, overrides);
  const soon = event.start - now < 86_400_000;
  const set = (v: "capture" | "skip") => setOverrides((o) => ({ ...o, [event.id]: v }));
  const seg = (on: boolean) => `px-2.5 py-1 text-[12px] font-medium ${on ? "bg-accent text-white" : "text-muted hover:text-fg"} disabled:cursor-not-allowed disabled:opacity-40`;
  return (
    <li id={eventAnchor(event.id)} data-event={event.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 p-3 ${focused ? "bg-accent/10 ring-1 ring-inset ring-accent/60" : ""}`}>
      <div className="w-[130px] shrink-0 text-[12px] tabular-nums text-muted">{timeRange(event)}</div>
      <div className="min-w-[200px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[14px] font-semibold text-fg">{event.title}</h3>
          <PlatformBadge platform={event.platform} />
          {soon && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent" data-testid="countdown">
              {countdown(event.start, event.end, now)}
            </span>
          )}
        </div>
        <div className="mt-1">
          <Attendees event={event} settings={settings} />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div role="group" aria-label={`Capture ${event.title}`} className="flex overflow-hidden rounded-md border border-line-2">
          <button
            type="button"
            aria-pressed={decision.capture}
            disabled={!settings.consent}
            title={settings.consent ? "Capture this meeting (simulated)" : "Accept the consent notice in Settings first"}
            onClick={() => set("capture")}
            className={seg(decision.capture)}
          >
            Auto
          </button>
          <button type="button" aria-pressed={!decision.capture} onClick={() => set("skip")} title="Skip this meeting" className={seg(!decision.capture)}>
            Skip
          </button>
        </div>
        <span className="text-[11px] text-faint">
          {decision.capture ? "Will be captured" : "Not captured"}
          {decision.reason === "consent" && " · consent needed"}
          {decision.reason === "override" && (
            <>
              {" · "}
              <button
                className="text-accent hover:underline"
                onClick={() =>
                  setOverrides((o) => {
                    const { [event.id]: _, ...rest } = o;
                    return rest;
                  })
                }
              >
                use setting
              </button>
            </>
          )}
        </span>
      </div>
      <CaptureAction event={event} captured={decision.capture} />
    </li>
  );
}

export function Upcoming() {
  const { source, events } = useCalEvents();
  const [settings] = useCalSettings();
  const now = useNow(30_000);
  const [focus, setFocus] = useState<string | null>(null);

  // Header chip links to /#event-<id>: highlight that row and scroll to it.
  useEffect(() => {
    const read = () => {
      const m = location.hash.match(/^#event-(.+)$/);
      if (!m) return setFocus(null);
      let id = m[1];
      try {
        id = decodeURIComponent(id);
      } catch {}
      setFocus(id);
      requestAnimationFrame(() => document.getElementById(eventAnchor(id))?.scrollIntoView({ block: "center", behavior: "smooth" }));
    };
    // Next's <Link> changes the hash with pushState, which fires no hashchange, so the chip also sends this event.
    const onFocus = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setFocus(id);
      requestAnimationFrame(() => document.getElementById(eventAnchor(id))?.scrollIntoView({ block: "center", behavior: "smooth" }));
    };
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("cal-focus", onFocus);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("cal-focus", onFocus);
    };
  }, [now === null]);

  const groups = useMemo(() => {
    if (now === null) return [];
    const g: { label: string; items: CalEvent[] }[] = [];
    for (const e of upcoming(events, now)) {
      const label = dayLabel(e.start, now);
      const last = g[g.length - 1];
      if (last?.label === label) last.items.push(e);
      else g.push({ label, items: [e] });
    }
    return g;
  }, [events, now]);

  if (now === null) return null;
  return (
    <section id="upcoming" aria-label="Upcoming meetings" className="mb-6">
      <div className="mb-1.5 flex items-center gap-2">
        <h2 className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
          <IconClock size={13} /> Upcoming · next 7 days
        </h2>
        <span className="text-[11px] text-faint">{source
            ? source.kind === "demo"
              ? "demo calendar (simulated)"
              : source.kind === "feed"
                ? `from your calendar link · synced ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(source.syncedAt)}`
                : `from ${source.name}`
            : ""}</span>
        <Link href="/settings" className="ml-auto text-[12px] text-accent hover:underline">
          Settings
        </Link>
      </div>
      {!source ? (
        <div className="rounded-xl border border-dashed border-line p-4 text-muted" data-testid="upcoming-empty">
          No calendar connected. Connect the demo calendar or import an .ics file in{" "}
          <Link href="/settings" className="text-accent hover:underline">
            Settings
          </Link>{" "}
          to see upcoming meetings. Nothing connects to a real calendar service.
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-4 text-muted">No meetings in the next 7 days.</div>
      ) : (
        <>
          {!settings.consent && (
            <p className="mb-2 rounded-md bg-amber-400/10 px-2.5 py-1.5 text-[12px] text-amber-200">
              Capture is off until you accept the consent notice in{" "}
              <Link href="/settings" className="underline">
                Settings
              </Link>
              . Nothing is recorded in any case.
            </p>
          )}
          {groups.map((g) => (
            <div key={g.label} className="mb-3">
              <h3 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-faint">{g.label}</h3>
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
                {g.items.map((e) => (
                  <EventRow key={e.id} event={e} now={now} focused={focus === e.id} />
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
