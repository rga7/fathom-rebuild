"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HighlightType, Meeting } from "@/data/types";
import { EMPTY_HIGHLIGHT_STATE, HIGHLIGHT_META, mergeHighlights } from "@/lib/highlights";
import { durationSec } from "@/lib/derive";
import { clock, minutes, shortDate, span } from "@/lib/format";
import { AskPanel } from "../AskPanel";
import { AvatarStack } from "../Avatar";
import { Brand } from "../AppHeader";
import { useCopy } from "../Toaster";
import { IconLink, IconList, IconPlay, IconSparkle } from "../icons";
import { PlayerProvider, usePlayer, usePlayerStore } from "../player/context";
import { TypeBadge } from "./HighlightsTab";
import { Player, TranscriptOnlyNotice } from "../player/Player";
import { isTranscriptOnly } from "@/lib/capture";
import { ActionList, actionsToText, transcriptRows } from "./ActionItemsTab";
import { MeetingContext, type TabId } from "./context";
import { FollowUpEmailButton } from "./FollowUpEmail";
import { SendToMenu } from "./SendToMenu";
import { shareUrl } from "./ShareControls";
import { SummaryTab } from "./SummaryTab";
import { MeetingInsights } from "./MeetingInsights";
import { TranscriptTab } from "./TranscriptTab";
import { useKeyboard } from "./useKeyboard";

type SharedTab = "summary" | "transcript" | "ask";

export interface SharedClip {
  id: string;
  type: HighlightType;
  start: number;
  end: number;
  title: string;
}

function ClipBanner({ meeting, clip }: { meeting: Meeting; clip: SharedClip }) {
  const store = usePlayerStore();
  const inClip = usePlayer((s) => !!s.clip);
  const meta = HIGHLIGHT_META[clip.type];
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: meta.color + "55", background: meta.color + "10" }} data-testid="clip-banner">
      <TypeBadge type={clip.type} />
      <span className="font-medium text-fg">{clip.title}</span>
      <span className="text-[12px] tabular-nums text-muted">
        {clock(clip.start)}–{clock(clip.end)} · {span(clip.end - clip.start)} · from {meeting.title}
      </span>
      <span className="flex-1" />
      <button
        onClick={() => (store.setClip({ start: clip.start, end: clip.end }), store.seek(clip.start, { play: true }))}
        className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[12px] font-medium text-black hover:bg-white/90"
      >
        <IconPlay size={10} /> Play clip
      </button>
      {inClip && (
        <button onClick={() => store.setClip(null)} className="rounded-md border border-line px-2 py-1 text-[12px] text-muted hover:text-fg">
          Keep watching past the clip
        </button>
      )}
    </div>
  );
}

function Inner({ meeting, sharePath, clip }: { meeting: Meeting; sharePath: string; clip?: SharedClip }) {
  const store = usePlayerStore();
  const playback = !isTranscriptOnly(meeting);
  const copy = useCopy();
  const [tab, setTab] = useState<SharedTab>("summary");
  const searchRef = useRef<HTMLInputElement>(null);
  const seekTo = useCallback((t: number) => playback && store.seek(t, { play: true }), [store, playback]);
  // Shared pages are read-only: seeded highlights, plus the clip being shared.
  const highlights = useMemo(() => {
    const seeded = mergeHighlights(meeting, EMPTY_HIGHLIGHT_STATE);
    if (!clip || seeded.some((h) => h.id === clip.id)) return seeded;
    return [...seeded, { ...clip, seeded: false }].sort((a, b) => a.start - b.start);
  }, [meeting, clip]);
  const ctx = useMemo(
    () => ({
      meeting,
      shared: true,
      playback,
      tab: tab as TabId,
      setTab: (t: TabId) => setTab(t === "transcript" ? "transcript" : "summary"),
      seekTo,
      searchRef,
      highlights,
    }),
    [meeting, playback, tab, seekTo, highlights],
  );
  useEffect(() => {
    if (clip) {
      store.setClip({ start: clip.start, end: clip.end });
      store.seek(clip.start);
      setTab("transcript");
      return;
    }
    const t = Number(new URLSearchParams(location.search).get("t"));
    if (Number.isFinite(t) && t > 0) ((playback && store.seek(t)), setTab("transcript"));
  }, [store, clip, playback]);
  useKeyboard({
    " ": () => playback && store.toggle(),
    ArrowLeft: () => playback && store.skip(-10),
    ArrowRight: () => playback && store.skip(10),
    "/": () => {
      if (searchRef.current) return searchRef.current.focus();
      setTab("transcript");
      requestAnimationFrame(() => searchRef.current?.focus());
    },
  });

  const tabs: { id: SharedTab; label: string; icon: React.ReactNode }[] = [
    { id: "summary", label: "Summary", icon: <IconSparkle size={14} /> },
    { id: "transcript", label: "Transcript", icon: <IconList size={14} /> },
    { id: "ask", label: "Ask", icon: <IconSparkle size={14} /> },
  ];
  const rows = transcriptRows(meeting.actionItems);

  return (
    <MeetingContext.Provider value={ctx}>
      <div className="flex min-h-dvh flex-col lg:h-dvh">
        <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2">
          <Brand />
          <Link href="/" className="rounded-md bg-amber-400/15 px-2.5 py-1 text-[12px] font-medium text-amber-300 hover:bg-amber-400/25">
            Get your own AI notetaker →
          </Link>
          <span className="flex-1" />
          <span className="text-[12px] text-faint">Shared view · no sign-in needed</span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">
          <aside className="flex flex-col gap-3 lg:order-2 lg:w-[400px] lg:shrink-0 lg:overflow-y-auto">
            <div className="px-1">
              <h1 className="text-[17px] font-semibold leading-6">{meeting.title}</h1>
              <div className="mt-1 flex items-center gap-2 text-[12px] text-muted">
                {shortDate(meeting.startedAt)} · {minutes(durationSec(meeting))}
                <AvatarStack ids={meeting.participants} max={8} size={20} />
              </div>
            </div>
            {playback ? <Player meeting={meeting} highlights={highlights} /> : <TranscriptOnlyNotice />}
            <button
              onClick={() => copy(shareUrl(sharePath), "Link copied")}
              className="flex items-center justify-between rounded-md bg-accent/12 px-3 py-2 text-[13px] font-medium text-accent hover:bg-accent/20"
            >
              Share <IconLink size={14} />
            </button>
            <div className="rounded-xl border border-line bg-panel p-3">
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-[12px] font-semibold uppercase tracking-wide text-muted">Action items</h2>
                <span className="flex-1" />
              </div>
              <div className="mb-1 flex gap-2">
                <SendToMenu label="Copy for…" getText={(f) => actionsToText(rows, f)} />
                <FollowUpEmailButton meeting={meeting} className="flex-1" />
              </div>
              <ActionList rows={rows} readOnly />
            </div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col gap-3 lg:order-1 lg:min-h-0">
          {clip && <ClipBanner meeting={meeting} clip={clip} />}
          <main className="flex min-h-[60vh] min-w-0 flex-1 flex-col rounded-xl border border-line bg-panel lg:min-h-0">
            <div role="tablist" className="flex shrink-0 gap-1 border-b border-line px-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`-mb-px flex items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-[13px] ${
                    tab === t.id ? "border-accent text-accent" : "border-transparent text-muted hover:text-fg"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
            <div className={`min-h-0 flex-1 overflow-y-auto ${tab === "ask" ? "flex flex-col p-3" : "p-4"}`} id="tab-scroll">
              {tab === "summary" && (
                <SummaryTab>
                  <MeetingInsights />
                </SummaryTab>
              )}
              {tab === "transcript" && <TranscriptTab />}
              {tab === "ask" && <AskPanel current={meeting} prompts={meeting.suggestedPrompts} scopes={["this"]} onSeek={seekTo} className="min-h-[60vh] flex-1 border-0" />}
            </div>
          </main>
          </div>
        </div>
      </div>
    </MeetingContext.Provider>
  );
}

export function SharedView({ meeting, clip }: { meeting: Meeting; clip?: SharedClip }) {
  return (
    <PlayerProvider duration={durationSec(meeting)}>
      <Inner meeting={meeting} sharePath={`/share/${meeting.shareToken}`} clip={clip} />
    </PlayerProvider>
  );
}

