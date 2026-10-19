"use client";
import type { HighlightType } from "@/data/types";
import { HIGHLIGHT_TYPES } from "@/data/types";
import { span } from "@/lib/format";
import { HIGHLIGHT_META } from "@/lib/highlights";
import { IconHighlight, IconX } from "../icons";
import { usePlayer } from "../player/context";

export interface Live {
  start: number;
  type: HighlightType;
  note: string;
}

export function HighlightButton({ live, onClick }: { live: Live | null; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={live ? "End highlight (H)" : "Start a timed highlight (H, or 1–7 for a type)"}
      aria-label={live ? "End highlight" : "Start highlight"}
      className={`mr-1 flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] ${live ? "bg-red-500/15 text-red-300" : "text-muted hover:bg-white/5 hover:text-fg"}`}
    >
      <IconHighlight size={15} />
      <kbd className="rounded border border-current/30 px-1 text-[10px] leading-4 opacity-70">H</kbd>
    </button>
  );
}

export function LivePanel({ live, setLive, onEnd, onCancel }: { live: Live; setLive: (l: Live) => void; onEnd: () => void; onCancel: () => void }) {
  const elapsed = usePlayer((s) => Math.max(0, Math.floor(s.time - live.start)));
  const meta = HIGHLIGHT_META[live.type];
  return (
    <div className="rounded-xl border p-2.5" style={{ borderColor: meta.color + "66", background: meta.color + "0d" }} data-testid="live-highlight">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        <span className="text-[12px] font-medium" style={{ color: meta.color }}>
          Highlighting · {meta.label}
        </span>
        <span className="tabular-nums text-[12px] text-muted">{span(elapsed)}</span>
        <span className="flex-1" />
        <button onClick={onEnd} className="rounded-md bg-white px-2 py-0.5 text-[12px] font-medium text-black hover:bg-white/90">
          End <kbd className="text-[10px] opacity-60">H</kbd>
        </button>
        <button onClick={onCancel} aria-label="Cancel highlight" title="Cancel (Esc)" className="rounded p-1 text-muted hover:text-fg">
          <IconX size={14} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {HIGHLIGHT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setLive({ ...live, type: t })}
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${t === live.type ? "text-fg" : "border-line text-muted hover:text-fg"}`}
            style={t === live.type ? { borderColor: HIGHLIGHT_META[t].color, background: HIGHLIGHT_META[t].color + "22" } : undefined}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: HIGHLIGHT_META[t].color }} />
            {HIGHLIGHT_META[t].label}
            <span className="text-faint">{HIGHLIGHT_META[t].key}</span>
          </button>
        ))}
      </div>
      <input
        value={live.note}
        onChange={(e) => setLive({ ...live, note: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.preventDefault(), onEnd());
          if (e.key === "Escape") (e.preventDefault(), e.currentTarget.blur());
        }}
        placeholder="Add a note (optional), Enter to save"
        aria-label="Highlight note"
        className="mt-2 w-full rounded-md border border-line bg-panel-2 px-2 py-1 text-[12px] outline-none placeholder:text-faint focus:border-accent"
      />
    </div>
  );
}
