"use client";
import { useStored } from "@/lib/storage";
import { useMeeting } from "./context";

export function ScratchpadTab() {
  const { meeting } = useMeeting();
  const [text, setText] = useStored<string>(`scratchpad:${meeting.id}`, meeting.scratchpad);
  return (
    <div className="flex h-full min-h-[320px] flex-col">
      <p className="mb-2 text-[12px] text-faint">Private notes, saved in this browser only. Not shown on shared links.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Scratchpad"
        className="min-h-[300px] flex-1 resize-none rounded-lg border border-line bg-panel-2 p-3 text-[13.5px] leading-6 outline-none focus:border-accent"
      />
    </div>
  );
}
