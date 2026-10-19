"use client";
import { useRef, useState } from "react";
import type { Meeting } from "@/data/types";
import { person } from "@/data/people";
import { activeLineIndex, chapterAt, lineStart } from "@/lib/derive";
import { clock } from "@/lib/format";
import type { Highlight } from "@/lib/highlights";
import { HIGHLIGHT_META } from "@/lib/highlights";
import { Avatar } from "../Avatar";
import { IconBack10, IconFwd10, IconPause, IconPlay } from "../icons";
import { usePlayer, usePlayerStore } from "./context";
import { Narrator } from "./Narrator";

function Stage({ meeting }: { meeting: Meeting }) {
  const store = usePlayerStore();
  const idx = usePlayer((s) => activeLineIndex(meeting.lines, s.time));
  const playing = usePlayer((s) => s.playing);
  const chapter = usePlayer((s) => chapterAt(meeting, s.time)?.id);
  const line = meeting.lines[Math.max(0, idx)];
  const p = person(line.speaker);
  const chapterTitle = meeting.chapters.find((c) => c.id === chapter)?.title;
  return (
    <button
      type="button"
      onClick={store.toggle}
      aria-label={playing ? "Pause" : "Play"}
      className="group relative block aspect-video w-full overflow-hidden rounded-lg bg-[radial-gradient(ellipse_at_top,#1e2433,#0d0f14_70%)] text-left"
    >
      <span
        title="Simulated playback: there is no audio or video. A clock drives the transcript."
        className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/70"
      >
        Simulated
      </span>
      {chapterTitle && (
        <span className="absolute right-2 top-2 max-w-[70%] truncate rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-white/80">{chapterTitle}</span>
      )}
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 pb-6">
        <span className={`rounded-full p-1 transition-shadow ${playing ? "shadow-[0_0_0_3px_rgba(79,140,255,.55)]" : ""}`}>
          <Avatar id={line.speaker} size={52} title={false} />
        </span>
        <span className="text-[13px] font-medium text-white">{p.name}</span>
        <span className="flex h-3 items-end gap-[2px]" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-accent"
              style={{
                height: playing ? undefined : 3,
                animation: playing ? `eq 0.${6 + i}s ease-in-out ${i * 0.07}s infinite alternate` : undefined,
              }}
            />
          ))}
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-6">
        <span className="line-clamp-2 text-center text-[12px] leading-4 text-white/90">{line.text}</span>
      </span>
      {!playing && (
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="rounded-full bg-black/60 p-3 text-white">
            <IconPlay size={22} />
          </span>
        </span>
      )}
      <style>{`@keyframes eq { from { height: 3px } to { height: 12px } }`}</style>
    </button>
  );
}

export function Scrubber({ meeting, highlights = [] }: { meeting: Meeting; highlights?: Highlight[] }) {
  const store = usePlayerStore();
  const d = store.duration || 1;
  const pct = usePlayer((s) => Math.round((s.time / d) * 2000) / 20);
  const sec = usePlayer((s) => Math.floor(s.time));
  const clip = usePlayer((s) => s.clip);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [hover, setHover] = useState<{ x: number; t: number } | null>(null);

  const tAt = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * d;
  };
  const chapterStarts = meeting.chapters.map((c) => ({ ...c, t: lineStart(meeting, c.startLineId) }));
  const hoverChapter = hover ? chapterAt(meeting, hover.t)?.title : undefined;

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(d)}
      aria-valuenow={sec}
      aria-valuetext={clock(sec)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") (e.preventDefault(), e.stopPropagation(), store.skip(-5));
        if (e.key === "ArrowRight") (e.preventDefault(), e.stopPropagation(), store.skip(5));
      }}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        store.seek(tAt(e.clientX));
      }}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        setHover({ x: e.clientX - r.left, t: tAt(e.clientX) });
        if (dragging.current) store.seek(tAt(e.clientX));
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => setHover(null)}
      className="relative h-6 cursor-pointer touch-none select-none"
    >
      {/* highlight ranges sit above the rail */}
      {highlights.map((h) => (
        <span
          key={h.id}
          title={`${HIGHLIGHT_META[h.type].label}: ${h.title}`}
          className="absolute top-0 h-[5px] rounded-sm"
          style={{
            left: `${(h.start / d) * 100}%`,
            width: `max(3px, ${((h.end - h.start) / d) * 100}%)`,
            background: HIGHLIGHT_META[h.type].color,
          }}
        />
      ))}
      <span className="absolute inset-x-0 top-[10px] h-[5px] overflow-hidden rounded-full bg-white/12">
        {clip && (
          <span className="absolute inset-y-0 bg-accent/35" style={{ left: `${(clip.start / d) * 100}%`, width: `${((clip.end - clip.start) / d) * 100}%` }} />
        )}
        <span className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${pct}%` }} />
        {chapterStarts.slice(1).map((c) => (
          <span key={c.id} className="absolute inset-y-0 w-[3px] -translate-x-1/2 bg-panel" style={{ left: `${(c.t / d) * 100}%` }} />
        ))}
      </span>
      <span className="absolute top-[7px] h-[11px] w-[11px] -translate-x-1/2 rounded-full bg-white shadow" style={{ left: `${pct}%` }} />
      {hover && (
        <span
          className="pointer-events-none absolute bottom-full mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-black px-1.5 py-0.5 text-[11px] text-white"
          style={{ left: Math.min(Math.max(hover.x, 40), (ref.current?.clientWidth ?? 0) - 40) }}
        >
          {clock(hover.t)}
          {hoverChapter ? ` · ${hoverChapter}` : ""}
        </span>
      )}
    </div>
  );
}

function TimeLabel() {
  const store = usePlayerStore();
  const t = usePlayer((s) => Math.floor(s.time));
  return (
    <span className="tabular-nums text-[12px] text-muted">
      {clock(t)} <span className="text-faint">/ {clock(store.duration)}</span>
    </span>
  );
}

export function Controls({ meeting, children }: { meeting?: Meeting; children?: React.ReactNode }) {
  const store = usePlayerStore();
  const playing = usePlayer((s) => s.playing);
  const rate = usePlayer((s) => s.rate);
  const btn = "rounded-md p-1.5 text-muted hover:bg-white/5 hover:text-fg";
  return (
    <div className="flex items-center gap-1">
      <button className={btn} onClick={() => store.skip(-10)} aria-label="Back 10 seconds" title="Back 10s (←)">
        <IconBack10 size={18} />
      </button>
      <button
        className="rounded-full bg-white p-2 text-black hover:bg-white/90"
        onClick={store.toggle}
        aria-label={playing ? "Pause" : "Play"}
        title="Play/pause (space)"
      >
        {playing ? <IconPause size={14} /> : <IconPlay size={14} />}
      </button>
      <button className={btn} onClick={() => store.skip(10)} aria-label="Forward 10 seconds" title="Forward 10s (→)">
        <IconFwd10 size={18} />
      </button>
      <span className="ml-1.5">
        <TimeLabel />
      </span>
      <span className="flex-1" />
      {children}
      {meeting && <Narrator meeting={meeting} />}
      <button
        onClick={store.cycleRate}
        className="min-w-[46px] rounded-md border border-line px-1.5 py-0.5 text-[12px] font-medium tabular-nums text-muted hover:border-faint hover:text-fg"
        aria-label={`Playback speed ${rate}x`}
        title="Playback speed"
      >
        {rate}x
      </button>
    </div>
  );
}

export function Player({ meeting, highlights, toolbar }: { meeting: Meeting; highlights?: Highlight[]; toolbar?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-2.5">
      <Stage meeting={meeting} />
      <div className="mt-2 px-0.5">
        <Scrubber meeting={meeting} highlights={highlights} />
        <Controls meeting={meeting}>{toolbar}</Controls>
      </div>
    </div>
  );
}
