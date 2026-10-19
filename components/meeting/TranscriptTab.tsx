"use client";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Line, PersonId } from "@/data/types";
import { person } from "@/data/people";
import { activeLineIndex } from "@/lib/derive";
import { clock } from "@/lib/format";
import { useCopy } from "../Toaster";
import { Avatar } from "../Avatar";
import { IconChevronDown, IconChevronUp, IconCopy, IconSearch, IconX } from "../icons";
import { usePlayer } from "../player/context";
import { useMeeting } from "./context";

interface Match {
  lineId: string;
  start: number;
  end: number;
}

function findMatches(lines: { id: string; text: string }[], query: string): Match[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: Match[] = [];
  for (const l of lines) {
    const t = l.text.toLowerCase();
    let i = t.indexOf(q);
    while (i !== -1) {
      out.push({ lineId: l.id, start: i, end: i + q.length });
      i = t.indexOf(q, i + q.length);
    }
  }
  return out;
}

const TranscriptLine = memo(function TranscriptLine({
  line,
  text,
  active,
  matches,
  currentMatch,
  onSeek,
}: {
  line: Line;
  text: string;
  active: boolean;
  /** Matches inside this line, with their global index. */
  matches: { m: Match; i: number }[];
  currentMatch: number;
  onSeek: (t: number) => void;
}) {
  let body: React.ReactNode = text;
  if (matches.length) {
    const parts: React.ReactNode[] = [];
    let last = 0;
    for (const { m, i } of matches) {
      if (m.start > last) parts.push(text.slice(last, m.start));
      parts.push(
        <mark key={i} data-match={i} data-current={i === currentMatch ? "true" : undefined}>
          {text.slice(m.start, m.end)}
        </mark>,
      );
      last = m.end;
    }
    parts.push(text.slice(last));
    body = parts;
  }
  return (
    <div
      data-line={line.id}
      className={`group/line relative -mx-2 flex cursor-pointer gap-2 rounded-md px-2 py-[3px] ${
        active ? "bg-accent/15 text-fg" : "text-zinc-300 hover:bg-white/[0.04]"
      }`}
      onClick={() => onSeek(line.start)}
    >
      <span className={`w-10 shrink-0 pt-[1px] text-right text-[11px] tabular-nums ${active ? "text-accent" : "text-transparent group-hover/line:text-faint"}`}>
        {clock(line.start)}
      </span>
      <p className="min-w-0 flex-1 text-[13.5px] leading-6">{body}</p>
      {active && <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-accent" />}
    </div>
  );
});

export function TranscriptTab() {
  const { meeting, seekTo, searchRef } = useMeeting();
  const copy = useCopy();
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState(0);
  const [follow, setFollow] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  const lines = meeting.lines;
  const display = useMemo(() => lines.map((l) => ({ id: l.id, text: l.text })), [lines]);
  const textById = useMemo(() => new Map(display.map((d) => [d.id, d.text])), [display]);

  const matches = useMemo(() => findMatches(display, query), [display, query]);
  const byLine = useMemo(() => {
    const map = new Map<string, { m: Match; i: number }[]>();
    matches.forEach((m, i) => {
      const arr = map.get(m.lineId) ?? [];
      arr.push({ m, i });
      map.set(m.lineId, arr);
    });
    return map;
  }, [matches]);

  // New query: start on the first match, so a single hit reads "1 of 1".
  useEffect(() => setCurrent(0), [query]);

  // Keep the current match in view.
  useEffect(() => {
    if (!matches.length) return;
    const el = rootRef.current?.querySelector(`mark[data-match="${current}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [current, matches]);

  const activeIdx = usePlayer((s) => activeLineIndex(lines, s.time));
  const activeId = activeIdx >= 0 ? lines[activeIdx].id : null;
  const playing = usePlayer((s) => s.playing);

  // Follow playback unless the viewer has scrolled away or is searching.
  useEffect(() => {
    if (!activeId || !follow || !playing || query) return;
    const el = rootRef.current?.querySelector(`[data-line="${activeId}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeId, follow, playing, query]);

  // Opening the tab (or arriving via ?t=) brings the current line into view once.
  useEffect(() => {
    if (activeIdx <= 0) return;
    rootRef.current?.querySelector(`[data-line="${lines[activeIdx].id}"]`)?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const scroller = document.getElementById("tab-scroll");
    if (!scroller) return;
    const stop = () => setFollow(false);
    scroller.addEventListener("wheel", stop, { passive: true });
    scroller.addEventListener("touchmove", stop, { passive: true });
    return () => {
      scroller.removeEventListener("wheel", stop);
      scroller.removeEventListener("touchmove", stop);
    };
  }, []);

  const onSeek = useCallback(
    (t: number) => {
      setFollow(true);
      seekTo(t);
    },
    [seekTo],
  );

  const step = (d: number) => matches.length && setCurrent((c) => (c + d + matches.length) % matches.length);

  const turns = useMemo(() => {
    const out: { speaker: PersonId; lines: Line[] }[] = [];
    for (const l of lines) {
      const last = out[out.length - 1];
      if (last && last.speaker === l.speaker) last.lines.push(l);
      else out.push({ speaker: l.speaker, lines: [l] });
    }
    return out;
  }, [lines]);

  const copyAll = () =>
    copy(
      turns.map((t) => `${person(t.speaker).name} (${clock(t.lines[0].start)})\n${t.lines.map((l) => textById.get(l.id)).join(" ")}`).join("\n\n"),
      "Transcript copied",
    );

  return (
    <div ref={rootRef}>
      <div className="sticky -top-4 z-10 -mx-4 -mt-4 mb-3 flex flex-wrap items-center gap-2 border-b border-line bg-panel/95 px-4 py-2 backdrop-blur">
        <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md border border-line bg-panel-2 px-2.5 py-1.5 focus-within:border-accent">
          <IconSearch className="shrink-0 text-faint" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.preventDefault(), step(e.shiftKey ? -1 : 1));
              if (e.key === "Escape") (setQuery(""), e.currentTarget.blur());
            }}
            placeholder="Search transcript"
            aria-label="Search transcript"
            className="w-full bg-transparent outline-none placeholder:text-faint"
          />
          {query && (
            <>
              <span className="shrink-0 text-[12px] tabular-nums text-muted" aria-live="polite" data-testid="search-counter">
                {matches.length ? current + 1 : 0} of {matches.length}
              </span>
              <button onClick={() => step(-1)} disabled={!matches.length} aria-label="Previous match" className="text-muted hover:text-fg disabled:opacity-30">
                <IconChevronUp size={15} />
              </button>
              <button onClick={() => step(1)} disabled={!matches.length} aria-label="Next match" className="text-muted hover:text-fg disabled:opacity-30">
                <IconChevronDown size={15} />
              </button>
              <button onClick={() => setQuery("")} aria-label="Clear search" className="text-faint hover:text-fg">
                <IconX size={14} />
              </button>
            </>
          )}
        </label>
        <button onClick={copyAll} title="Copy transcript" aria-label="Copy transcript" className="rounded-md border border-line p-1.5 text-muted hover:text-fg">
          <IconCopy />
        </button>
      </div>

      <div className="space-y-4">
        {turns.map((turn) => (
          <section key={turn.lines[0].id}>
            <div className="mb-0.5 flex items-center gap-2">
              <Avatar id={turn.speaker} size={20} />
              <span className="text-[13px] font-medium text-muted">{person(turn.speaker).name}</span>
              <button onClick={() => onSeek(turn.lines[0].start)} className="text-[12px] tabular-nums text-faint hover:text-accent">
                {clock(turn.lines[0].start)}
              </button>
            </div>
            <div className="pl-5">
              {turn.lines.map((l) => (
                <TranscriptLine
                  key={l.id}
                  line={l}
                  text={textById.get(l.id) ?? l.text}
                  active={l.id === activeId}
                  matches={byLine.get(l.id) ?? []}
                  currentMatch={byLine.has(l.id) ? current : -1}
                  onSeek={onSeek}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {!follow && playing && !query && (
        <button
          onClick={() => {
            setFollow(true);
            const el = rootRef.current?.querySelector(`[data-line="${activeId}"]`);
            el?.scrollIntoView({ block: "center", behavior: "smooth" });
          }}
          className="sticky bottom-2 left-1/2 mx-auto mt-2 flex -translate-x-0 items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-[12px] font-medium text-white shadow-lg"
        >
          Resume auto-scroll
        </button>
      )}
    </div>
  );
}
