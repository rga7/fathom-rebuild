"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Meeting } from "@/data/types";
import { person } from "@/data/people";
import { SCOPE_LABEL, answerToText, ask, type Answer, type Citation, type Scope } from "@/lib/ask";
import { meetingHref } from "@/lib/links";
import type { LocalRecord } from "@/lib/localMeetings";
import { LOCAL_KEY } from "@/lib/localMeetings";
import { readStored } from "@/lib/storage";
import { Avatar } from "./Avatar";
import { Menu, MenuItem, MenuLabel } from "./Menu";
import { useCopy } from "./Toaster";
import { IconArrowUp, IconCheck, IconChevronDown, IconCopy, IconSparkle } from "./icons";
import { CiteChip } from "./meeting/CiteChip";

type Msg = { id: number; q: string; scope: Scope; answer: Answer | null };

function shortTitle(t: string) {
  return t.split(/:\s|\s\(/)[0].trim();
}

function AnswerView({ a, current, onCite }: { a: Answer; current?: Meeting; onCite: (c: Citation) => void }) {
  const copy = useCopy();
  return (
    <div className="space-y-2 text-[13px] leading-5 text-zinc-300">
      <p className="text-fg">{a.intro}</p>
      {a.parts.length > 0 && (
        <ul className="space-y-2">
          {a.parts.map((p, i) => (
            <li key={i} className="flex gap-2">
              {p.speaker ? <Avatar id={p.speaker} size={18} /> : <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-faint" />}
              <div className="min-w-0">
                {p.speaker && <span className="font-medium text-fg">{person(p.speaker).name.split(" ")[0]}: </span>}
                {p.lead && <span className="font-medium text-fg">{p.lead}: </span>}
                <span>{p.quote ? `“${p.text}”` : p.text}</span>
                {p.cite && (
                  <span className="mt-0.5 block">
                    <CiteChip
                      t={p.cite.start}
                      label={p.cite.meetingId === current?.id ? p.cite.topic : `${shortTitle(p.cite.meetingTitle)} › ${p.cite.topic}`}
                      navigates={p.cite.meetingId !== current?.id}
                      onClick={() => onCite(p.cite!)}
                    />
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {a.email && (
        <div className="rounded-lg border border-line bg-panel-2 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[12px] text-muted">
              Subject: <span className="text-fg">{a.email.subject}</span>
            </span>
            <button onClick={() => copy(`Subject: ${a.email!.subject}\n\n${a.email!.body}`, "Email copied")} className="text-[12px] text-accent hover:underline">
              Copy email
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-5 text-zinc-300">{a.email.body}</pre>
        </div>
      )}
      <div className="flex items-center gap-2 pt-0.5 text-[11px] text-faint">
        <span>Extractive answer: quotes and seeded notes, no AI generation</span>
        <span className="flex-1" />
        <button onClick={() => copy(answerToText(a), "Answer copied")} aria-label="Copy answer" className="rounded p-1 hover:bg-white/5 hover:text-fg">
          <IconCopy size={13} />
        </button>
      </div>
    </div>
  );
}

export function AskPanel({
  current,
  prompts,
  scopes = ["this", "mine", "all"],
  defaultScope = "this",
  onSeek,
  className = "",
}: {
  current?: Meeting;
  prompts: string[];
  scopes?: Scope[];
  defaultScope?: Scope;
  /** Seek within the current meeting. Citations to other meetings navigate instead. */
  onSeek?: (t: number) => void;
  className?: string;
}) {
  const router = useRouter();
  const [scope, setScope] = useState<Scope>(defaultScope);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);

  // Block body on purpose: an expression body would return scrollIntoView()'s result,
  // and some polyfills/extensions make that a Promise, which React rejects as a cleanup.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [msgs]);

  const submit = async (q: string) => {
    const text = q.trim();
    if (!text) return;
    const id = nextId.current++;
    setMsgs((m) => [...m, { id, q: text, scope, answer: null }]);
    setInput("");
    // All-meeting data is a separate chunk, loaded on first broad question.
    // Finished calls from simulated capture live in this browser's storage, so they join the broad scopes.
    const locals = readStored<LocalRecord[]>(LOCAL_KEY, []).filter((r) => r.status === "done").map((r) => r.meeting);
    const all = scope === "this" && current ? [current] : [...locals, ...(await import("@/data")).MEETINGS];
    const answer = ask(text, scope, current, all);
    setMsgs((m) => m.map((x) => (x.id === id ? { ...x, answer } : x)));
  };

  const onCite = (c: Citation) => {
    if (current && c.meetingId === current.id && onSeek) onSeek(c.start);
    else router.push(meetingHref(c.meetingId, c.start));
  };

  const unused = prompts.filter((p) => !msgs.some((m) => m.q === p));

  return (
    <div className={`flex min-h-[340px] flex-col rounded-xl border border-line bg-panel ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2 text-[12px] font-semibold uppercase tracking-wide">
        <IconSparkle size={14} className="text-accent" />
        <span className="text-muted">Ask</span>
        <span className="ml-auto text-[11px] font-normal normal-case tracking-normal text-faint">retrieval over seeded transcripts</span>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {msgs.map((m) => (
          <div key={m.id} className="space-y-2">
            <div className="ml-8 rounded-lg bg-raised px-2.5 py-1.5 text-fg">
              {m.q}
              <span className="ml-1.5 text-[11px] text-faint">· {SCOPE_LABEL[m.scope]}</span>
            </div>
            {m.answer ? <AnswerView a={m.answer} current={current} onCite={onCite} /> : <p className="text-faint">Searching…</p>}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {unused.length > 0 &&
        (msgs.length ? (
          <div className="flex gap-1.5 overflow-x-auto px-3 pb-2 pt-1">
            {unused.map((p) => (
              <button key={p} onClick={() => submit(p)} className="shrink-0 rounded-full bg-raised px-2.5 py-1 text-[12px] text-muted hover:bg-line hover:text-fg">
                {p}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1.5 px-3 pb-2 pt-2">
            {unused.map((p) => (
              <button
                key={p}
                onClick={() => submit(p)}
                className="max-w-full rounded-lg bg-raised px-2.5 py-1.5 text-right text-muted hover:bg-line hover:text-fg"
              >
                {p}
              </button>
            ))}
          </div>
        ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="m-2 mt-0 rounded-lg border border-line bg-panel-2 focus-within:border-accent"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          aria-label="Ask a question"
          className="w-full bg-transparent px-2.5 pb-1 pt-2 outline-none placeholder:text-faint"
        />
        <div className="flex items-center px-1.5 pb-1.5">
          <Menu
            label="Ask scope"
            button={() => (
              <span className="flex cursor-pointer items-center gap-1 rounded-md bg-raised px-2 py-1 text-[12px] text-muted hover:text-fg">
                {SCOPE_LABEL[scope]} <IconChevronDown size={12} />
              </span>
            )}
            panelClassName="bottom-full mb-1 mt-0"
          >
            {(close) => (
              <>
                <MenuLabel>Search in</MenuLabel>
                {(["this", "mine", "all"] as Scope[]).map((s) => {
                  const enabled = scopes.includes(s);
                  return (
                    <MenuItem key={s} active={s === scope} onClick={() => enabled && (setScope(s), close())}>
                      <span className={`flex-1 ${enabled ? "" : "opacity-40"}`}>{SCOPE_LABEL[s]}</span>
                      {s === scope && <IconCheck size={14} className="text-accent" />}
                      {!enabled && <span className="text-[11px] text-faint">{s === "this" ? "open a call" : "sign in"}</span>}
                    </MenuItem>
                  );
                })}
              </>
            )}
          </Menu>
          <span className="flex-1" />
          <button type="submit" disabled={!input.trim()} aria-label="Send question" className="rounded-full bg-accent p-1.5 text-white disabled:bg-raised disabled:text-faint">
            <IconArrowUp size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
