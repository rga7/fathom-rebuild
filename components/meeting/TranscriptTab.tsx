"use client";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HighlightType, Line, PersonId } from "@/data/types";
import { HIGHLIGHT_TYPES } from "@/data/types";
import { HIGHLIGHT_META } from "@/lib/highlights";
import { useStored } from "@/lib/storage";
import { applyVocab, vocabSegments, type VocabEntry } from "@/lib/vocab";
import { person } from "@/data/people";
import { activeLineIndex } from "@/lib/derive";
import { clock } from "@/lib/format";
import { useCopy, useToast } from "../Toaster";
import { Avatar } from "../Avatar";
import { IconBook, IconChevronDown, IconChevronUp, IconCopy, IconPencil, IconPlus, IconSearch, IconX } from "../icons";
import { VocabPanel } from "./VocabPanel";
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

const NO_EDITS: Record<string, string> = {};
const NO_VOCAB: VocabEntry[] = [];

const TranscriptLine = memo(function TranscriptLine({
  line,
  text,
  active,
  matches,
  currentMatch,
  onSeek,
  tint,
  canHighlight,
  menuOpen,
  onMenu,
  onPick,
  vocab,
  raw,
  edited,
  editing,
  onEdit,
  onSaveEdit,
}: {
  line: Line;
  text: string;
  active: boolean;
  /** Matches inside this line, with their global index. */
  matches: { m: Match; i: number }[];
  currentMatch: number;
  onSeek: (t: number) => void;
  /** Colour of a highlight covering this line. */
  tint?: string;
  canHighlight: boolean;
  menuOpen: boolean;
  onMenu: (lineId: string | null) => void;
  onPick: (line: Line, type: HighlightType) => void;
  vocab: VocabEntry[];
  /** Line text before vocabulary fixes (the viewer's edit, if any, else the original). */
  raw: string;
  edited: boolean;
  editing: boolean;
  onEdit: (lineId: string | null) => void;
  /** null reverts to the original text. */
  onSaveEdit: (lineId: string, text: string | null) => void;
}) {
  const [draft, setDraft] = useState(raw);
  useEffect(() => setDraft(raw), [raw, editing]);
  let body: React.ReactNode = vocabSegments(raw, vocab).map((seg, i) =>
    seg.from ? (
      <span key={i} title={`Heard as "${seg.from}" · fixed by your vocabulary`} className="underline decoration-accent/60 decoration-dotted underline-offset-4">
        {seg.text}
      </span>
    ) : (
      seg.text
    ),
  );
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
      style={tint && !active ? { background: tint + "14", boxShadow: `inset 2px 0 0 ${tint}` } : undefined}
      onClick={() => onSeek(line.start)}
    >
      {canHighlight && (
        <span className="absolute -left-5 top-[3px]">
          <button
            type="button"
            aria-label="Highlight this line"
            title="Highlight this line"
            onClick={(e) => {
              e.stopPropagation();
              onMenu(menuOpen ? null : line.id);
            }}
            className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border border-accent/60 text-accent hover:bg-accent hover:text-white ${
              menuOpen ? "bg-accent text-white opacity-100" : "opacity-0 group-hover/line:opacity-100 focus:opacity-100"
            }`}
          >
            <IconPlus size={12} strokeWidth={2.4} />
          </button>
          {menuOpen && (
            <span
              role="menu"
              onClick={(e) => e.stopPropagation()}
              className="absolute left-6 top-0 z-30 block w-44 rounded-lg border border-line-2 bg-raised p-1 shadow-2xl shadow-black/50"
            >
              {HIGHLIGHT_TYPES.map((t) => (
                <button
                  key={t}
                  role="menuitem"
                  onClick={() => onPick(line, t)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] font-medium uppercase tracking-wide hover:bg-white/5"
                  style={{ color: HIGHLIGHT_META[t].color }}
                >
                  <span className="h-2 w-2 rounded-sm" style={{ background: HIGHLIGHT_META[t].color }} />
                  {HIGHLIGHT_META[t].label}
                </button>
              ))}
            </span>
          )}
        </span>
      )}
      <span className={`w-10 shrink-0 pt-[1px] text-right text-[11px] tabular-nums ${active ? "text-accent" : "text-transparent group-hover/line:text-faint"}`}>
        {clock(line.start)}
      </span>
      {editing ? (
        <span className="flex min-w-0 flex-1 flex-col gap-1" onClick={(e) => e.stopPropagation()}>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) (e.preventDefault(), onSaveEdit(line.id, draft));
              if (e.key === "Escape") (e.preventDefault(), onEdit(null));
            }}
            rows={2}
            aria-label="Edit line"
            className="w-full resize-y rounded border border-accent bg-panel-2 px-2 py-1 text-[13.5px] leading-6 outline-none"
          />
          <span className="flex gap-2 text-[11px]">
            <button onClick={() => onSaveEdit(line.id, draft)} className="rounded bg-accent px-2 py-0.5 font-medium text-white">
              Save
            </button>
            <button onClick={() => onEdit(null)} className="text-muted hover:text-fg">
              Cancel
            </button>
            <span className="text-faint">Enter to save · Esc to cancel</span>
          </span>
        </span>
      ) : (
        <p className="min-w-0 flex-1 text-[13.5px] leading-6">
          {body}
          {edited && (
            <span className="ml-1.5 inline-flex items-center gap-1 align-middle text-[11px] text-faint">
              edited
              <button
                onClick={(e) => (e.stopPropagation(), onSaveEdit(line.id, null))}
                className="text-accent hover:underline"
                title={`Original: ${line.text}`}
              >
                revert
              </button>
            </span>
          )}
        </p>
      )}
      {canHighlight && !editing && (
        <button
          type="button"
          aria-label="Edit line"
          title="Fix this line"
          onClick={(e) => (e.stopPropagation(), onEdit(line.id))}
          className="shrink-0 self-start rounded p-1 text-faint opacity-0 hover:bg-white/5 hover:text-fg focus:opacity-100 group-hover/line:opacity-100"
        >
          <IconPencil size={13} />
        </button>
      )}
      {active && <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-accent" />}
    </div>
  );
});

export function TranscriptTab() {
  const { meeting, seekTo, searchRef, highlights, highlightApi, shared } = useMeeting();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const copy = useCopy();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState(0);
  const [follow, setFollow] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  const [speakers, setSpeakers] = useState<PersonId[]>([]);
  const lines = meeting.lines;
  // Viewer corrections. Shared pages always show the seeded text.
  const [storedEdits, setEdits] = useStored<Record<string, string>>(`edits:${meeting.id}`, {});
  const [storedVocab, setVocab] = useStored<VocabEntry[]>("vocab", []);
  const edits = shared || !storedEdits || typeof storedEdits !== "object" ? NO_EDITS : storedEdits;
  const vocab = shared || !Array.isArray(storedVocab) ? NO_VOCAB : storedVocab;
  const [editing, setEditing] = useState<string | null>(null);
  const [showVocab, setShowVocab] = useState(false);
  const onSaveEdit = useCallback(
    (id: string, text: string | null) => {
      setEditing(null);
      const original = lines.find((l) => l.id === id)?.text;
      setEdits((prev) => {
        const next = { ...(prev ?? {}) };
        if (text === null || text.trim() === "" || text.trim() === original) delete next[id];
        else next[id] = text.trim();
        return next;
      });
    },
    [lines, setEdits],
  );
  const visible = useMemo(() => (speakers.length ? lines.filter((l) => speakers.includes(l.speaker)) : lines), [lines, speakers]);
  const display = useMemo(() => visible.map((l) => ({ id: l.id, text: applyVocab(edits[l.id] ?? l.text, vocab) })), [visible, edits, vocab]);
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

  // Close the gutter menu on outside click / Escape.
  useEffect(() => {
    if (!menuFor) return;
    const close = () => setMenuFor(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuFor]);

  const onPick = useCallback(
    (line: Line, type: HighlightType) => {
      setMenuFor(null);
      highlightApi?.add({ type, start: line.start, end: line.end });
      toast(`${HIGHLIGHT_META[type].label} highlight added`);
    },
    [highlightApi, toast],
  );

  const tintByLine = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of highlights)
      for (const l of lines) if (l.end > h.start + 0.05 && l.start < h.end - 0.05 && !map.has(l.id)) map.set(l.id, HIGHLIGHT_META[h.type].color);
    return map;
  }, [highlights, lines]);

  const step = (d: number) => matches.length && setCurrent((c) => (c + d + matches.length) % matches.length);

  const turns = useMemo(() => {
    const out: { speaker: PersonId; lines: Line[] }[] = [];
    for (const l of visible) {
      const last = out[out.length - 1];
      if (last && last.speaker === l.speaker) last.lines.push(l);
      else out.push({ speaker: l.speaker, lines: [l] });
    }
    return out;
  }, [visible]);

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
        {!shared && (
          <button
            onClick={() => setShowVocab((v) => !v)}
            aria-expanded={showVocab}
            title="Custom vocabulary"
            className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-[12px] ${showVocab ? "border-accent text-fg" : "border-line text-muted hover:text-fg"}`}
          >
            <IconBook size={14} /> Vocabulary{vocab.length ? ` · ${vocab.length}` : ""}
          </button>
        )}
        <button onClick={copyAll} title="Copy transcript" aria-label="Copy transcript" className="rounded-md border border-line p-1.5 text-muted hover:text-fg">
          <IconCopy />
        </button>
        {showVocab && !shared && <VocabPanel vocab={vocab} setVocab={setVocab} />}
        {meeting.participants.length > 1 && (
          <div className="flex w-full flex-wrap items-center gap-1.5" role="group" aria-label="Filter by speaker">
            <span className="text-[11px] uppercase tracking-wide text-faint">Speakers</span>
            <button
              onClick={() => setSpeakers([])}
              className={`rounded-full border px-2 py-0.5 text-[12px] ${speakers.length ? "border-line text-muted hover:text-fg" : "border-accent bg-accent/15 text-fg"}`}
            >
              All
            </button>
            {meeting.participants.map((p) => {
              const on = speakers.includes(p);
              return (
                <button
                  key={p}
                  aria-pressed={on}
                  onClick={() => setSpeakers((cur) => (on ? cur.filter((x) => x !== p) : [...cur, p]))}
                  className={`flex items-center gap-1 rounded-full border py-0.5 pl-0.5 pr-2 text-[12px] ${on ? "border-accent bg-accent/15 text-fg" : "border-line text-muted hover:text-fg"}`}
                >
                  <Avatar id={p} size={16} title={false} />
                  {person(p).name.split(" ")[0]}
                </button>
              );
            })}
            {speakers.length > 0 && (
              <span className="text-[11px] text-faint">
                {visible.length} of {lines.length} lines
              </span>
            )}
          </div>
        )}
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
            <div className="pl-6">
              {turn.lines.map((l) => (
                <TranscriptLine
                  key={l.id}
                  line={l}
                  text={textById.get(l.id) ?? l.text}
                  active={l.id === activeId}
                  matches={byLine.get(l.id) ?? []}
                  currentMatch={byLine.has(l.id) ? current : -1}
                  onSeek={onSeek}
                  tint={tintByLine.get(l.id)}
                  canHighlight={!!highlightApi}
                  menuOpen={menuFor === l.id}
                  onMenu={setMenuFor}
                  onPick={onPick}
                  vocab={vocab}
                  raw={edits[l.id] ?? l.text}
                  edited={!!edits[l.id]}
                  editing={editing === l.id}
                  onEdit={setEditing}
                  onSaveEdit={onSaveEdit}
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
