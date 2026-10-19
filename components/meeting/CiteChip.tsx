"use client";
import { clock } from "@/lib/format";
import { IconPlay } from "../icons";

/** "Topic @ 12:41" chip. Clicking seeks the player (or navigates, via onClick). */
export function CiteChip({ t, label, onClick, compact = false }: { t: number; label?: string; onClick: () => void; compact?: boolean }) {
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
