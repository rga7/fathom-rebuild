"use client";
import { useContext } from "react";
import { clock } from "@/lib/format";
import { NO_RECORDING_TIP } from "@/lib/capture";
import { IconPlay } from "../icons";
import { MeetingContext } from "./context";

/** "Topic @ 12:41" chip. Clicking seeks the player (or navigates, via onClick). */
export function CiteChip({
  t,
  label,
  onClick,
  compact = false,
  navigates = false,
}: {
  t: number;
  label?: string;
  onClick: () => void;
  compact?: boolean;
  /** Opens another meeting instead of seeking, so it works even without a player. */
  navigates?: boolean;
}) {
  const ctx = useContext(MeetingContext);
  // Transcript-only call: show the time, but there is no recording to seek.
  if (ctx && !ctx.playback && !navigates) {
    return (
      <span title={NO_RECORDING_TIP} className="mx-0.5 inline-flex max-w-full items-center gap-1 rounded-md bg-white/5 px-1.5 py-[1px] align-baseline text-[12px] font-medium text-muted">
        {label && !compact && <span className="truncate">{label}</span>}
        <span className="tabular-nums">{label && !compact ? "@ " : ""}{clock(t)}</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Play from ${clock(t)}`}
      className="mx-0.5 inline-flex max-w-full items-center gap-1 rounded-md bg-accent/12 px-1.5 py-[1px] align-baseline text-[12px] font-medium text-accent hover:bg-accent/25"
    >
      <IconPlay size={9} />
      {label && !compact && <span className="truncate">{label}</span>}
      <span className="tabular-nums">{label && !compact ? "@ " : ""}{clock(t)}</span>
    </button>
  );
}
