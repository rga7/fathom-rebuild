"use client";
import { useState } from "react";
import { person } from "@/data/people";
import { lineById } from "@/lib/derive";
import { Avatar } from "../Avatar";
import { CiteChip } from "./CiteChip";
import { useMeeting } from "./context";

export function QuestionsTab() {
  const { meeting, seekTo } = useMeeting();
  const [openOnly, setOpenOnly] = useState(false);
  const all = meeting.questions.map((q) => ({ q, line: lineById(meeting, q.lineId)! })).filter((x) => x.line);
  const shown = openOnly ? all.filter((x) => !x.q.answered) : all;
  const openCount = all.filter((x) => !x.q.answered).length;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-[15px] font-semibold">Questions</h3>
        <span className="text-[12px] text-faint">
          {all.length} detected · {openCount} unanswered
        </span>
        <span className="flex-1" />
        <div className="flex rounded-md border border-line p-0.5 text-[12px]">
          {[
            [false, "All"],
            [true, "Unanswered"],
          ].map(([v, label]) => (
            <button
              key={String(v)}
              onClick={() => setOpenOnly(v as boolean)}
              className={`rounded px-2 py-0.5 ${openOnly === v ? "bg-raised text-fg" : "text-muted hover:text-fg"}`}
            >
              {label as string}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-1 text-[12px] text-faint">Detected at seed time. &ldquo;Unanswered&rdquo; means nobody in the call gave an answer.</p>
      <ul className="divide-y divide-line">
        {shown.map(({ q, line }) => (
          <li key={q.id} className="flex gap-3 py-3" data-question={q.id}>
            <Avatar id={line.speaker} size={22} />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] leading-5 text-fg">&ldquo;{line.text}&rdquo;</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                <span>{person(line.speaker).name}</span>
                <CiteChip t={line.start} onClick={() => seekTo(line.start)} />
                {q.answered ? (
                  <span className="text-faint">Answered in the call</span>
                ) : (
                  <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-amber-300">Unanswered</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
