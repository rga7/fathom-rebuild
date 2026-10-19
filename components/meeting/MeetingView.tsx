"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Meeting } from "@/data/types";
import { durationSec } from "@/lib/derive";
import { minutes, shortDate, timeOfDay } from "@/lib/format";
import { AskPanel } from "../AskPanel";
import { AvatarStack } from "../Avatar";
import { IconArrowLeft, IconCalendar, IconChecklist, IconList, IconPencil, IconSparkle } from "../icons";
import { PlayerProvider, usePlayerStore } from "../player/context";
import { Player } from "../player/Player";
import { ActionItemsTab } from "./ActionItemsTab";
import { MeetingContext, type TabId } from "./context";
import { ScratchpadTab } from "./ScratchpadTab";
import { useKeyboard } from "./useKeyboard";
import { SummaryTab } from "./SummaryTab";
import { TranscriptTab } from "./TranscriptTab";

const TAB_IDS: TabId[] = ["summary", "actions", "transcript", "highlights", "questions", "scratchpad"];

function Tabs({ tab, setTab, counts }: { tab: TabId; setTab: (t: TabId) => void; counts: Partial<Record<TabId, number>> }) {
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "summary", label: "Summary", icon: <IconSparkle size={14} /> },
    { id: "actions", label: "Action Items", icon: <IconChecklist size={14} /> },
    { id: "transcript", label: "Transcript", icon: <IconList size={14} /> },
    { id: "scratchpad", label: "Scratchpad", icon: <IconPencil size={14} /> },
  ];
  return (
    <div role="tablist" className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={tab === t.id}
          onClick={() => setTab(t.id)}
          className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-2.5 text-[13px] ${
            tab === t.id ? "border-accent text-accent" : "border-transparent text-muted hover:text-fg"
          }`}
        >
          {t.icon}
          {t.label}
          {counts[t.id] !== undefined && (
            <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${tab === t.id ? "bg-accent/20" : "bg-raised text-muted"}`}>{counts[t.id]}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function Inner({ meeting }: { meeting: Meeting }) {
  const store = usePlayerStore();
  const [tab, setTabState] = useState<TabId>("summary");

  const setTab = useCallback((t: TabId) => {
    setTabState(t);
    try {
      history.replaceState(null, "", `${location.pathname}${location.search}#${t}`);
    } catch {}
  }, []);

  // Deep links: #tab and ?t=seconds (Ask citations from other meetings use ?t=).
  useEffect(() => {
    const hash = location.hash.slice(1) as TabId;
    const t = Number(new URLSearchParams(location.search).get("t"));
    if (TAB_IDS.includes(hash)) setTabState(hash);
    if (Number.isFinite(t) && t > 0) {
      store.seek(t);
      if (!TAB_IDS.includes(hash)) setTabState("transcript");
    }
  }, [store]);

  const seekTo = useCallback((t: number) => store.seek(t, { play: true }), [store]);
  const searchRef = useRef<HTMLInputElement>(null);
  const ctx = useMemo(() => ({ meeting, shared: false, tab, setTab, seekTo, searchRef }), [meeting, tab, setTab, seekTo]);

  useKeyboard({
    " ": () => store.toggle(),
    ArrowLeft: () => store.skip(-10),
    ArrowRight: () => store.skip(10),
    "/": () => {
      if (searchRef.current) return searchRef.current.focus();
      setTab("transcript");
      requestAnimationFrame(() => searchRef.current?.focus());
    },
  });

  return (
    <MeetingContext.Provider value={ctx}>
      <div className="flex min-h-dvh flex-col lg:h-dvh">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-2.5">
          <Link href="/" className="flex items-center gap-1 text-[12px] text-muted hover:text-fg">
            <IconArrowLeft size={14} /> My meetings
          </Link>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="truncate text-[16px] font-semibold">{meeting.title}</h1>
            <span className="flex items-center gap-1 rounded-md bg-raised px-1.5 py-0.5 text-[12px] text-muted">
              <IconCalendar size={12} /> {shortDate(meeting.startedAt)} · {timeOfDay(meeting.startedAt)}
            </span>
            <span className="rounded-md bg-raised px-1.5 py-0.5 text-[12px] text-muted">{minutes(durationSec(meeting))}</span>
            <AvatarStack ids={meeting.participants} max={8} size={22} />
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">
          <aside className="flex flex-col gap-3 lg:order-2 lg:w-[400px] lg:shrink-0 lg:min-h-0">
            <Player meeting={meeting} />
            <div className="hidden min-h-0 flex-1 lg:flex lg:flex-col">
              <AskPanel current={meeting} prompts={meeting.suggestedPrompts} onSeek={seekTo} className="min-h-0 flex-1" />
            </div>
          </aside>
          <main className="flex min-h-[60vh] min-w-0 flex-1 flex-col rounded-xl border border-line bg-panel lg:order-1 lg:min-h-0">
            <Tabs tab={tab} setTab={setTab} counts={{ actions: meeting.actionItems.length }} />
            <div className="min-h-0 flex-1 overflow-y-auto p-4" id="tab-scroll">
              {tab === "summary" && <SummaryTab />}
              {tab === "actions" && <ActionItemsTab />}
              {tab === "transcript" && <TranscriptTab />}
              {tab === "scratchpad" && <ScratchpadTab />}
            </div>
          </main>
          <div className="lg:hidden">
            <AskPanel current={meeting} prompts={meeting.suggestedPrompts} onSeek={seekTo} />
          </div>
        </div>
      </div>
    </MeetingContext.Provider>
  );
}

export function MeetingView({ meeting }: { meeting: Meeting }) {
  return (
    <PlayerProvider duration={durationSec(meeting)}>
      <Inner meeting={meeting} />
    </PlayerProvider>
  );
}
