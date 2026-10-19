"use client";
import { useMemo, useRef, useState } from "react";
import type { Meeting } from "@/data/types";
import { person } from "@/data/people";
import { parseMentions } from "@/lib/scratchpad";
import { useStored } from "@/lib/storage";
import { Avatar } from "../Avatar";
import type { ActionRow } from "./ActionItemsTab";
import { useMeeting } from "./context";
import { dueLabel } from "@/lib/format";

function hash(s: string) {
  let h = 5381;
  for (const c of s) h = (h * 33) ^ c.charCodeAt(0);
  return (h >>> 0).toString(36);
}

/** Scratchpad text for a meeting (viewer's copy, else the seed). */
export function useScratchpad(m: Meeting) {
  const [text, setText] = useStored<string>(`scratchpad:${m.id}`, m.scratchpad);
  return [typeof text === "string" ? text : m.scratchpad, setText] as const;
}

export function useScratchpadActions(m: Meeting): ActionRow[] {
  const [text] = useScratchpad(m);
  return useMemo(
    () =>
      parseMentions(text, m).map((it) => ({
        id: `sp-${hash(`${it.owner ?? it.mention}|${it.text}`)}`,
        text: it.text,
        owner: it.owner,
        due: it.due,
        origin: "scratchpad" as const,
        unknownMention: it.owner ? undefined : it.mention,
      })),
    [text, m],
  );
}

export function ScratchpadTab() {
  const { meeting, setTab } = useMeeting();
  const [text, setText] = useScratchpad(meeting);
  const rows = useScratchpadActions(meeting);
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mention, setMention] = useState<{ query: string; at: number } | null>(null);
  const [sel, setSel] = useState(0);

  const options = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return meeting.participants.filter((p) => person(p).name.toLowerCase().split(" ").some((w) => w.startsWith(q))).slice(0, 6);
  }, [mention, meeting.participants]);

  const detect = (value: string, caret: number) => {
    const m = value.slice(0, caret).match(/(^|\s)@([A-Za-z]*)$/);
    setMention(m ? { query: m[2], at: caret - m[2].length - 1 } : null);
    setSel(0);
  };

  const insert = (id: string) => {
    if (!mention || !ref.current) return;
    const first = person(id).name.split(" ")[0];
    const caret = ref.current.selectionStart;
    const next = text.slice(0, mention.at) + `@${first} ` + text.slice(caret);
    setText(next);
    setMention(null);
    const pos = mention.at + first.length + 2;
    requestAnimationFrame(() => ref.current?.setSelectionRange(pos, pos));
  };

  return (
    <div className="flex h-full flex-col">
      <p className="mb-2 text-[12px] text-faint">
        Private notes, saved in this browser only and never shown on shared links. Type <span className="text-muted">@name</span> to turn a line into an action
        item for that person; add &ldquo;by Friday&rdquo; or &ldquo;by Oct 30&rdquo; for a due date.
      </p>
      <div className="relative">
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => (setText(e.target.value), detect(e.target.value, e.target.selectionStart))}
          onKeyDown={(e) => {
            if (!mention || !options.length) return;
            if (e.key === "ArrowDown") (e.preventDefault(), setSel((s) => (s + 1) % options.length));
            if (e.key === "ArrowUp") (e.preventDefault(), setSel((s) => (s - 1 + options.length) % options.length));
            if (e.key === "Enter" || e.key === "Tab") (e.preventDefault(), insert(options[sel]));
            if (e.key === "Escape") setMention(null);
          }}
          onBlur={() => setTimeout(() => setMention(null), 150)}
          aria-label="Scratchpad"
          className="min-h-[260px] w-full resize-y rounded-lg border border-line bg-panel-2 p-3 text-[13.5px] leading-6 outline-none focus:border-accent"
        />
        {mention && options.length > 0 && (
          <ul role="listbox" aria-label="Mention a participant" className="absolute left-3 top-full z-20 -mt-2 w-56 rounded-lg border border-line-2 bg-raised p-1 shadow-2xl shadow-black/50">
            {options.map((id, i) => (
              <li key={id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === sel}
                  onMouseDown={(e) => (e.preventDefault(), insert(id))}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] ${i === sel ? "bg-white/10 text-fg" : "text-muted"}`}
                >
                  <Avatar id={id} size={18} title={false} /> {person(id).name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-4">
        <div className="mb-1 flex items-center gap-2">
          <h4 className="text-[13px] font-semibold">Action items from your @mentions</h4>
          <span className="text-[12px] text-faint">{rows.length}</span>
          <span className="flex-1" />
          {rows.length > 0 && (
            <button onClick={() => setTab("actions")} className="text-[12px] text-accent hover:underline">
              View in Action Items →
            </button>
          )}
        </div>
        {rows.length === 0 ? (
          <p className="text-[12px] text-faint">No @mentions yet.</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line" data-testid="mention-items">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-2 px-3 py-2">
                {r.owner ? <Avatar id={r.owner} size={18} /> : <span className="h-[18px] w-[18px] rounded-full border border-dashed border-amber-400/70" />}
                <span className="flex-1 text-[13px]">{r.text}</span>
                <span className={`text-[12px] ${r.owner ? "text-muted" : "text-amber-300"}`}>
                  {r.owner ? person(r.owner).name : `No participant "@${r.unknownMention}"`}
                </span>
                <span className="w-24 text-right text-[12px] text-faint">{r.due ? dueLabel(r.due) : "No due date"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
