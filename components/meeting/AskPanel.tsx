"use client";
import { IconArrowUp, IconSparkle } from "../icons";
import { useMeeting } from "./context";

export function AskPanel() {
  const { meeting } = useMeeting();
  return (
    <div className="flex min-h-[320px] flex-col rounded-xl border border-line bg-panel">
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2 text-[12px] font-semibold uppercase tracking-wide">
        <IconSparkle size={14} className="text-accent" /> <span className="text-muted">Ask</span>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-1.5 p-3">
        {meeting.suggestedPrompts.map((p) => (
          <span key={p} className="self-end rounded-lg bg-raised px-2.5 py-1.5 text-muted">
            {p}
          </span>
        ))}
      </div>
      <div className="m-2 flex items-center rounded-lg border border-line bg-panel-2 px-2.5 py-2">
        <input disabled placeholder="Ask anything…" className="flex-1 bg-transparent outline-none placeholder:text-faint" />
        <IconArrowUp className="text-faint" />
      </div>
    </div>
  );
}
