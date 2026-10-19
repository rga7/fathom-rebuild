"use client";
import { NO_RECORDING_TIP } from "@/lib/capture";
import { person } from "@/data/people";
import { chapterAt, durationSec, lineStart, talkTime } from "@/lib/derive";
import { clock, span } from "@/lib/format";
import { IconBars, IconChapters } from "../icons";
import { usePlayer } from "../player/context";
import { Avatar } from "../Avatar";
import { useMeeting } from "./context";

export function Chapters() {
  const { meeting, seekTo, playback } = useMeeting();
  const current = usePlayer((s) => chapterAt(meeting, s.time)?.id);
  const end = durationSec(meeting);
  const starts = meeting.chapters.map((c) => lineStart(meeting, c.startLineId));
  return (
    <section className="rounded-lg border border-line bg-panel-2 p-3" aria-label="Chapters">
      <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted">
        <IconChapters size={14} /> Chapters
      </h3>
      <ol className="space-y-0.5">
        {meeting.chapters.map((c, i) => (
          <li key={c.id}>
            <button
              onClick={() => seekTo(starts[i])}
              disabled={!playback}
              title={playback ? undefined : NO_RECORDING_TIP}
              className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left enabled:hover:bg-white/5 disabled:cursor-default ${current === c.id ? "bg-accent/12 text-fg" : "text-zinc-300"}`}
            >
              <span className={`w-11 shrink-0 text-[12px] tabular-nums ${current === c.id ? "text-accent" : "text-faint"}`}>{clock(starts[i])}</span>
              <span className="min-w-0 flex-1 truncate">{c.title}</span>
              <span className="shrink-0 text-[11px] tabular-nums text-faint">{span((starts[i + 1] ?? end) - starts[i])}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function TalkTime() {
  const { meeting } = useMeeting();
  const rows = talkTime(meeting);
  const max = rows[0]?.share ?? 1;
  return (
    <section className="rounded-lg border border-line bg-panel-2 p-3" aria-label="Talk time">
      <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted">
        <IconBars size={14} /> Talk time
        <span className="ml-auto font-normal normal-case tracking-normal text-faint">from line timings</span>
      </h3>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.speaker} className="flex items-center gap-2" title={`${person(r.speaker).name}: ${clock(r.seconds)} speaking`}>
            <Avatar id={r.speaker} size={18} />
            <span className="w-24 shrink-0 truncate text-[12px] text-zinc-300">{person(r.speaker).name.split(" ")[0]}</span>
            <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(r.share / max) * 100}%`, background: person(r.speaker).color }} />
            </span>
            <span className="w-9 shrink-0 text-right text-[12px] tabular-nums text-muted">{Math.round(r.share * 100)}%</span>
            <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-faint">{clock(r.seconds)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MeetingInsights() {
  const { meeting } = useMeeting();
  return (
    <div className="mb-5 grid gap-3 md:grid-cols-2">
      <Chapters />
      {meeting.participants.length > 1 && <TalkTime />}
    </div>
  );
}
