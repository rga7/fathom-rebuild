"use client";
import { NO_RECORDING_TIP } from "@/lib/capture";
import { useMemo, useState } from "react";
import type { HighlightType } from "@/data/types";
import { HIGHLIGHT_TYPES } from "@/data/types";
import { person } from "@/data/people";
import { clock, span } from "@/lib/format";
import { HIGHLIGHT_META, highlightShareId, type Highlight } from "@/lib/highlights";
import { useCopy } from "../Toaster";
import { IconLink, IconPencil, IconPlay, IconTrash } from "../icons";
import { usePlayerStore } from "../player/context";
import { shareUrl } from "./ShareControls";
import { useMeeting } from "./context";

export function TypeBadge({ type }: { type: HighlightType }) {
  const m = HIGHLIGHT_META[type];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[11px] font-medium" style={{ color: m.color, background: m.color + "1f" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

function Row({ h }: { h: Highlight }) {
  const { meeting, highlightApi, playback } = useMeeting();
  const store = usePlayerStore();
  const copy = useCopy();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(h.title);
  const quoted = meeting.lines.filter((l) => l.end > h.start + 0.05 && l.start < h.end - 0.05);
  const quote = quoted.map((l) => l.text).join(" ");
  const speakers = [...new Set(quoted.map((l) => l.speaker))];
  const play = () => {
    store.setClip({ start: h.start, end: h.end });
    store.seek(h.start, { play: true });
  };
  return (
    <li className="group py-3" data-highlight={h.id}>
      <div className="flex items-start gap-3">
        <button
          onClick={play}
          disabled={!playback}
          title={playback ? undefined : NO_RECORDING_TIP}
          aria-label={`Play highlight ${h.title}`}
          className="mt-0.5 rounded-full bg-white/10 p-1.5 text-fg hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/10"
        >
          <IconPlay size={11} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={h.type} />
            {editing ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => (highlightApi?.rename(h.id, draft), setEditing(false))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (highlightApi?.rename(h.id, draft), setEditing(false));
                  if (e.key === "Escape") (setDraft(h.title), setEditing(false));
                }}
                aria-label="Highlight title"
                className="min-w-[200px] flex-1 rounded border border-accent bg-panel-2 px-1.5 py-0.5 text-[13px] outline-none"
              />
            ) : (
              <span className="font-medium text-fg">{h.title}</span>
            )}
            <span className="text-[12px] tabular-nums text-faint">
              {clock(h.start)} · {span(h.end - h.start)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[12.5px] italic leading-5 text-muted">
            “{quote}”{speakers.length > 0 && <span className="not-italic text-faint"> · {speakers.map((s) => person(s).name.split(" ")[0]).join(", ")}</span>}
          </p>
          {h.note && h.note !== h.title && <p className="mt-1 text-[12px] text-zinc-400">Note: {h.note}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-60 group-hover:opacity-100">
          {playback && !meeting.origin && (
          <button
            onClick={() => copy(shareUrl(`/share/h/${highlightShareId(meeting, h)}`), "Highlight link copied. Opens signed out at this moment.")}
            aria-label="Copy highlight link"
            title="Copy link"
            className="rounded p-1.5 text-muted hover:bg-white/5 hover:text-fg"
          >
            <IconLink size={14} />
          </button>
          )}
          {highlightApi && (
            <>
              <button onClick={() => (setDraft(h.title), setEditing(true))} aria-label="Rename highlight" title="Rename" className="rounded p-1.5 text-muted hover:bg-white/5 hover:text-fg">
                <IconPencil size={14} />
              </button>
              <button onClick={() => highlightApi.remove(h.id)} aria-label="Delete highlight" title="Delete" className="rounded p-1.5 text-muted hover:bg-white/5 hover:text-red-300">
                <IconTrash size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

export function HighlightsTab() {
  const { meeting, highlights, highlightApi } = useMeeting();
  const [filter, setFilter] = useState<HighlightType | "all">("all");
  const counts = useMemo(() => {
    const c = Object.fromEntries(HIGHLIGHT_TYPES.map((t) => [t, 0])) as Record<HighlightType, number>;
    highlights.forEach((h) => c[h.type]++);
    return c;
  }, [highlights]);
  const shown = filter === "all" ? highlights : highlights.filter((h) => h.type === filter);
  const seededDeleted = meeting.highlights.some((s) => !highlights.find((h) => h.id === s.id));
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-[15px] font-semibold">Highlights</h3>
        <span className="text-[12px] text-faint">{highlights.length} total</span>
      </div>
      <p className="mb-3 text-[12px] text-faint">
        Create one with the <span className="text-muted">+</span> beside any transcript line, or press <kbd className="rounded border border-line px-1">H</kbd> while playing
        (<kbd className="rounded border border-line px-1">1</kbd>–<kbd className="rounded border border-line px-1">7</kbd> pick a type). Yours are saved in this browser; each
        link works signed out.
      </p>
      <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter highlights by type">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full border px-2.5 py-0.5 text-[12px] ${filter === "all" ? "border-accent bg-accent/15 text-fg" : "border-line text-muted hover:text-fg"}`}
        >
          All {highlights.length}
        </button>
        {HIGHLIGHT_TYPES.map((t) => (
          <button
            key={t}
            disabled={!counts[t]}
            onClick={() => setFilter(t)}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] disabled:opacity-35 ${filter === t ? "text-fg" : "border-line text-muted hover:text-fg"}`}
            style={filter === t ? { borderColor: HIGHLIGHT_META[t].color, background: HIGHLIGHT_META[t].color + "22" } : undefined}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: HIGHLIGHT_META[t].color }} />
            {HIGHLIGHT_META[t].label} {counts[t]}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-line">
        {shown.map((h) => (
          <Row key={h.id} h={h} />
        ))}
      </ul>
      {highlightApi && seededDeleted && (
        <button onClick={highlightApi.restoreSeeded} className="mt-3 text-[12px] text-accent hover:underline">
          Restore deleted sample highlights
        </button>
      )}
    </div>
  );
}
