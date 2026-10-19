"use client";
import Link from "next/link";
import { countdown } from "@/lib/calendar";
import { useCalEvents, useCalSettings, useNow } from "@/lib/calendarStore";
import { IconClock } from "../icons";
import { eventAnchor } from "./Upcoming";

/** "Next: <title> in 12m", refreshed every 30 seconds. Hidden when off, not connected or nothing starts within 24 hours. */
export function NextChip() {
  const { events } = useCalEvents();
  const [settings] = useCalSettings();
  const now = useNow(30_000);
  if (!settings.showHeader || now === null) return null;
  const next = events.filter((e) => e.end > now && e.start <= now + 86_400_000).sort((a, b) => a.start - b.start)[0];
  if (!next) return null;
  const when = countdown(next.start, next.end, now);
  return (
    <Link
      href={`/#${eventAnchor(next.id)}`}
      data-testid="next-chip"
      onClick={() => window.dispatchEvent(new CustomEvent("cal-focus", { detail: next.id }))}
      title={`${next.title}: open in Upcoming`}
      className="flex max-w-[260px] items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1 text-[12px] text-muted hover:border-faint hover:text-fg"
    >
      <IconClock size={12} className="shrink-0 text-accent" />
      <span className="truncate">
        {when === "Now" ? "Now" : "Next"}: {next.title}
        {when === "Now" ? "" : ` ${when}`}
      </span>
    </Link>
  );
}
