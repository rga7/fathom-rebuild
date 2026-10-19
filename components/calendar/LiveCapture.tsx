"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { person } from "@/data/people";
import { activeLineIndex, durationSec } from "@/lib/derive";
import { CAPTURE_OPTIONS } from "@/lib/capture";
import { clock } from "@/lib/format";
import type { LocalRecord } from "@/lib/localMeetings";
import { useLocalMeetings } from "@/lib/localMeetings";
import { Avatar } from "../Avatar";
import { IconArrowLeft, IconPause, IconPlay } from "../icons";
import { PlayerProvider, usePlayer, usePlayerStore } from "../player/context";
import { useToast } from "../Toaster";

function Live({ record }: { record: LocalRecord }) {
  const { meeting } = record;
  const store = usePlayerStore();
  const [, api] = useLocalMeetings();
  const toast = useToast();
  const time = usePlayer((s) => Math.floor(s.time));
  const shown = usePlayer((s) => activeLineIndex(meeting.lines, s.time) + 1);
  const playing = usePlayer((s) => s.playing);
  const rate = usePlayer((s) => s.rate);
  const endRef = useRef<HTMLDivElement>(null);
  const done = !playing && store.time >= store.duration - 0.05;
  const mode = CAPTURE_OPTIONS.find((o) => o.id === (meeting.capture ?? "audio"))?.label ?? "Audio";

  // The simulated clock drives the stream. Resume where a previous visit left off, and save progress as it runs.
  useEffect(() => {
    store.seek(record.progress);
    if (record.progress < store.duration - 0.1) store.play();
    const save = () => api.update(meeting.id, { progress: store.time });
    const id = setInterval(save, 2000);
    return () => {
      clearInterval(id);
      save();
      store.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, meeting.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [shown]);

  const end = () => {
    store.pause();
    api.update(meeting.id, { status: "done", progress: store.duration });
    toast("Capture finished. Notes are precomputed for this script.");
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-2.5">
        <Link href="/" className="flex items-center gap-1 text-[12px] text-muted hover:text-fg">
          <IconArrowLeft size={14} /> My meetings
        </Link>
        <h1 className="text-[16px] font-semibold leading-6">{meeting.title}</h1>
        <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2 py-0.5 text-[12px] font-medium text-red-300" data-testid="recording-badge">
          <span className={`h-2 w-2 rounded-full bg-red-400 ${playing ? "animate-pulse" : ""}`} /> Recording (simulated)
        </span>
        <span className="tabular-nums text-[12px] text-muted" data-testid="live-clock">
          {clock(time)}
        </span>
        <span className="ml-auto flex items-center gap-2">
          <button
            onClick={store.toggle}
            disabled={done}
            aria-label={playing ? "Pause capture" : "Resume capture"}
            className="rounded-md border border-line-2 p-1.5 text-muted hover:text-fg disabled:opacity-40"
          >
            {playing ? <IconPause size={14} /> : <IconPlay size={14} />}
          </button>
          <button onClick={store.cycleRate} className="min-w-[46px] rounded-md border border-line px-1.5 py-1 text-[12px] font-medium tabular-nums text-muted hover:text-fg" aria-label={`Capture speed ${rate}x`}>
            {rate}x
          </button>
          <button onClick={end} className="rounded-md bg-red-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-red-400" data-testid="end-capture">
            End capture
          </button>
        </span>
      </header>
      <div className="border-b border-line bg-panel px-4 py-1.5 text-[12px] text-muted">
        Created from simulated capture ({mode}). Nothing is being recorded: a scripted transcript streams in on the simulated clock.
        {!done && " Ending early still finalises the whole scripted call."}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-1.5 px-4 py-4" data-testid="live-transcript">
          {meeting.lines.slice(0, shown).map((l, i) => (
            <div key={l.id} className={`flex gap-2.5 rounded-md px-2 py-1 ${i === shown - 1 ? "bg-accent/10" : ""}`}>
              <Avatar id={l.speaker} size={20} />
              <p>
                <span className="font-medium text-muted">{person(l.speaker).name.split(" ")[0]} </span>
                <span className="mr-2 text-[11px] tabular-nums text-faint">{clock(l.start)}</span>
                <span className="text-fg">{l.text}</span>
              </p>
            </div>
          ))}
          {shown === 0 && <p className="text-faint">Waiting for the first line…</p>}
          {done && (
            <p className="rounded-md bg-raised px-3 py-2 text-muted" data-testid="capture-complete">
              The scripted call has ended. Press <span className="text-fg">End capture</span> to finalise the summary, action items and questions.
            </p>
          )}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}

export function LiveCapture({ record }: { record: LocalRecord }) {
  return (
    <PlayerProvider duration={durationSec(record.meeting)}>
      <Live record={record} />
    </PlayerProvider>
  );
}
