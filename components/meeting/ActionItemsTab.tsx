"use client";
import type { PersonId } from "@/data/types";
import { person } from "@/data/people";
import { lineById } from "@/lib/derive";
import { clock, dueLabel } from "@/lib/format";
import { useStored } from "@/lib/storage";
import { Avatar } from "../Avatar";
import { IconCheck, IconUser } from "../icons";
import { CiteChip } from "./CiteChip";
import { SendToMenu } from "./SendToMenu";
import { useMeeting } from "./context";

export interface ActionRow {
  id: string;
  text: string;
  owner: PersonId | null;
  due: string | null;
  /** Source line for transcript items; absent for scratchpad items. */
  sourceLineId?: string;
  origin: "transcript" | "scratchpad";
  /** Name as typed after @ when it matched nobody. */
  unknownMention?: string;
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-accent bg-accent text-white" : "border-line-2 hover:border-muted"}`}
    >
      {checked && <IconCheck size={12} strokeWidth={3} />}
    </button>
  );
}

export function useDone(meetingId: string) {
  return useStored<string[]>(`done:${meetingId}`, []);
}

export function actionsToText(rows: ActionRow[], format: "markdown" | "plain") {
  return rows
    .map((r) => `${format === "markdown" ? "- [ ] " : "• "}${r.text}${r.owner ? ` (${person(r.owner).name})` : ""}${r.due ? `, due ${dueLabel(r.due)}` : ""}`)
    .join("\n");
}

export function ActionList({ rows, readOnly = false }: { rows: ActionRow[]; readOnly?: boolean }) {
  const { meeting, seekTo } = useMeeting();
  const [done, setDone] = useDone(meeting.id);
  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => {
        const line = r.sourceLineId ? lineById(meeting, r.sourceLineId) : undefined;
        const isDone = done.includes(r.id);
        return (
          <li key={r.id} className="flex gap-3 py-3" data-action={r.id}>
            {readOnly ? (
              <span className="mt-[3px] h-4 w-4 shrink-0 rounded border border-line-2" />
            ) : (
              <Checkbox
                checked={isDone}
                label={`Mark "${r.text}" done`}
                onChange={() => setDone((d) => (d.includes(r.id) ? d.filter((x) => x !== r.id) : [...d, r.id]))}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-[13.5px] leading-5 ${isDone ? "text-faint line-through" : "text-fg"}`}>{r.text}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                {r.owner ? (
                  <span className="flex items-center gap-1.5">
                    <Avatar id={r.owner} size={16} /> {person(r.owner).name}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400/90">
                    <IconUser size={13} /> {r.unknownMention ? `No participant named @${r.unknownMention}` : "Unassigned"}
                  </span>
                )}
                <span>{r.due ? `Due ${dueLabel(r.due)}` : "No due date"}</span>
                {line && <CiteChip t={line.start} onClick={() => seekTo(line.start)} />}
                {r.origin === "scratchpad" && <span className="rounded bg-raised px-1.5 py-0.5 text-[11px] text-faint">From your scratchpad</span>}
              </div>
              {line && (
                <p className="mt-1.5 border-l-2 border-line-2 pl-2 text-[12px] italic leading-5 text-faint">
                  “{line.text}” <span className="not-italic">({person(line.speaker).name.split(" ")[0]}, {clock(line.start)})</span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function transcriptRows(items: { id: string; text: string; owner: PersonId | null; due: string; sourceLineId: string }[]): ActionRow[] {
  return items.map((a) => ({ ...a, origin: "transcript" as const }));
}

export function ActionItemsTab({ extra = [] }: { extra?: ActionRow[] }) {
  const { meeting } = useMeeting();
  const [done] = useDone(meeting.id);
  const rows = transcriptRows(meeting.actionItems);
  const all = [...rows, ...extra];
  const open = all.filter((r) => !done.includes(r.id)).length;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[15px] font-semibold">Action items</h3>
        <span className="text-[12px] text-faint">
          {open} open · {all.length - open} done
        </span>
        <span className="flex-1" />
        <SendToMenu label="Copy for…" getText={(f) => actionsToText(all, f)} />
      </div>
      <p className="mb-1 text-[12px] text-faint">Detected at seed time from the transcript. The play chip jumps to the exact line each item was assigned on.</p>
      <ActionList rows={rows} />
      {extra.length > 0 && (
        <>
          <h4 className="mb-1 mt-5 text-[13px] font-semibold text-muted">From your scratchpad @mentions</h4>
          <ActionList rows={extra} />
        </>
      )}
    </div>
  );
}
