"use client";
import { useState } from "react";
import { countOccurrences, type VocabEntry } from "@/lib/vocab";
import { IconPlus, IconTrash } from "../icons";
import { useMeeting } from "./context";

export function VocabPanel({ vocab, setVocab }: { vocab: VocabEntry[]; setVocab: (v: VocabEntry[]) => void }) {
  const { meeting } = useMeeting();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const has = (f: string) => vocab.some((v) => v.from.toLowerCase() === f.toLowerCase());
  const add = (e: VocabEntry) => {
    if (!e.from.trim() || !e.to.trim() || has(e.from)) return;
    setVocab([...vocab, { from: e.from.trim(), to: e.to.trim() }]);
  };
  const suggestions = meeting.vocabSuggestions
    .map((s) => ({ ...s, n: countOccurrences(meeting.lines, s.from) }))
    .filter((s) => s.n > 0);
  return (
    <div className="w-full rounded-lg border border-line bg-panel-2 p-3 text-[12px]" data-testid="vocab-panel">
      <div className="mb-2 flex items-baseline gap-2">
        <h4 className="font-semibold text-fg">Custom vocabulary</h4>
        <span className="text-faint">Fixes how words were heard, across all your calls. Saved in this browser.</span>
      </div>
      {suggestions.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 text-[11px] uppercase tracking-wide text-faint">Likely mis-heard in this call</div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s.from}
                disabled={has(s.from)}
                onClick={() => add(s)}
                className="flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-muted hover:border-accent hover:text-fg disabled:opacity-40"
              >
                <span className="line-through decoration-faint">{s.from}</span> → <span className="text-fg">{s.to}</span>
                <span className="text-faint">×{s.n}</span>
                {!has(s.from) && <IconPlus size={11} />}
              </button>
            ))}
          </div>
        </div>
      )}
      {vocab.length > 0 && (
        <ul className="mb-2 divide-y divide-line rounded-md border border-line">
          {vocab.map((v) => (
            <li key={v.from} className="flex items-center gap-2 px-2 py-1">
              <span className="text-muted">{v.from}</span> → <span className="text-fg">{v.to}</span>
              <span className="text-faint">×{countOccurrences(meeting.lines, v.from)} here</span>
              <span className="flex-1" />
              <button onClick={() => setVocab(vocab.filter((x) => x.from !== v.from))} aria-label={`Remove ${v.from}`} className="rounded p-1 text-faint hover:text-red-300">
                <IconTrash size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-wrap items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          add({ from, to });
          setFrom("");
          setTo("");
        }}
      >
        <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Heard as (e.g. sock two)" aria-label="Heard as" className="min-w-0 flex-1 rounded border border-line bg-panel px-2 py-1 outline-none focus:border-accent" />
        <span className="text-faint">→</span>
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Should be (e.g. SOC 2)" aria-label="Should be" className="min-w-0 flex-1 rounded border border-line bg-panel px-2 py-1 outline-none focus:border-accent" />
        <button type="submit" disabled={!from.trim() || !to.trim()} className="rounded bg-accent px-2.5 py-1 font-medium text-white disabled:opacity-40">
          Add
        </button>
      </form>
    </div>
  );
}
