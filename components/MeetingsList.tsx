"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MeetingKind, PersonId } from "@/data/types";
import { PEOPLE } from "@/data/people";
import { dayHeading, dayKey, minutes, timeOfDay } from "@/lib/format";
import { durationSec } from "@/lib/derive";
import { useLocalMeetings, type LocalRecord } from "@/lib/localMeetings";
import { KIND_META } from "@/lib/kinds";
import { Avatar, AvatarStack } from "./Avatar";
import { Menu, MenuItem, MenuLabel } from "./Menu";
import { IconChecklist, IconChevronDown, IconSearch, IconUser, IconX } from "./icons";

export interface ListItem {
  id: string;
  title: string;
  kind: MeetingKind;
  day: string;
  dayLabel: string;
  time: string;
  duration: number;
  participants: PersonId[];
  snippet: string;
  actionCount: number;
  search: string;
  /** Calls from simulated capture link elsewhere and carry a badge. */
  href?: string;
  origin?: "recording" | "simulated";
}

function localItem({ meeting: m, status }: LocalRecord): ListItem {
  return {
    id: m.id,
    title: m.title,
    kind: m.kind,
    day: dayKey(m.startedAt),
    dayLabel: dayHeading(m.startedAt),
    time: timeOfDay(m.startedAt),
    duration: durationSec(m),
    participants: m.participants,
    snippet: status === "recording" ? "Recording in progress. A scripted transcript is streaming in on the simulated clock." : m.snippet,
    actionCount: status === "recording" ? 0 : m.actionItems.length,
    search: [m.title, m.snippet, ...m.participants.map((p) => PEOPLE[p]?.name ?? p), ...m.actionItems.map((a) => a.text)].join(" ").toLowerCase(),
    href: `/local?m=${m.id}`,
    origin: status === "recording" ? "recording" : "simulated",
  };
}

function Thumb({ item }: { item: ListItem }) {
  const k = KIND_META[item.kind];
  return (
    <div
      className="relative hidden h-[84px] w-[150px] shrink-0 overflow-hidden rounded-lg sm:block"
      style={{ background: `linear-gradient(135deg, ${k.from}, ${k.to})` }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.18),transparent_60%)]" />
      <div className="absolute left-2.5 top-2 text-[11px] font-semibold uppercase tracking-wide text-white/85">{k.label}</div>
      <div className="absolute bottom-2 left-2.5 flex items-end gap-[3px] opacity-60">
        {[6, 12, 9, 16, 7, 13, 10, 5, 14, 8].map((h, i) => (
          <span key={i} className="w-[3px] rounded-full bg-white" style={{ height: h }} />
        ))}
      </div>
      {item.origin === "recording" ? (
        <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md bg-red-600/90 px-1.5 py-0.5 text-[11px] font-medium text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Recording
        </span>
      ) : (
        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">{minutes(item.duration)}</span>
      )}
    </div>
  );
}

export function MeetingsList({ items: seeded, upcoming }: { items: ListItem[]; upcoming?: React.ReactNode }) {
  const [records] = useLocalMeetings();
  // Calls made by simulated capture are newer than anything seeded, so they go on top.
  const items = useMemo(() => [...records.map(localItem), ...seeded], [records, seeded]);
  const [query, setQuery] = useState("");
  const [who, setWho] = useState<PersonId | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/^(INPUT|TEXTAREA)$/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const people = useMemo(() => {
    const counts = new Map<PersonId, number>();
    items.forEach((i) => i.participants.forEach((p) => counts.set(p, (counts.get(p) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || PEOPLE[a[0]].name.localeCompare(PEOPLE[b[0]].name));
  }, [items]);

  const filtered = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((i) => (!who || i.participants.includes(who)) && terms.every((t) => i.search.includes(t)));
  }, [items, query, who]);

  const groups = useMemo(() => {
    const g: { day: string; label: string; items: ListItem[] }[] = [];
    for (const i of filtered) {
      const last = g[g.length - 1];
      if (last?.day === i.day) last.items.push(i);
      else g.push({ day: i.day, label: i.dayLabel, items: [i] });
    }
    return g;
  }, [filtered]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-2 bg-bg/95 px-4 pb-3 pt-1 backdrop-blur">
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1.5 focus-within:border-accent">
            <IconSearch className="text-faint" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, summaries, people, action items"
              className="w-full bg-transparent outline-none placeholder:text-faint"
              aria-label="Search meetings"
            />
            {query ? (
              <button onClick={() => setQuery("")} aria-label="Clear search" className="text-faint hover:text-fg">
                <IconX size={14} />
              </button>
            ) : (
              <kbd className="rounded border border-line px-1 text-[11px] text-faint">/</kbd>
            )}
          </label>
          <Menu
            label="Filter by participant"
            align="auto"
            panelClassName="max-h-[60vh] w-64 overflow-y-auto"
            button={() => (
              <span className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1.5 text-muted hover:text-fg">
                {who ? <Avatar id={who} size={18} /> : <IconUser />}
                <span className="max-w-[140px] truncate">{who ? PEOPLE[who].name : "Any participant"}</span>
                <IconChevronDown size={14} />
              </span>
            )}
          >
            {(close) => (
              <>
                <MenuLabel>Participant</MenuLabel>
                <MenuItem active={!who} onClick={() => (setWho(null), close())}>
                  <IconUser /> Any participant
                </MenuItem>
                {people.map(([id, n]) => (
                  <MenuItem key={id} active={who === id} onClick={() => (setWho(id), close())}>
                    <Avatar id={id} size={18} title={false} />
                    <span className="flex-1 truncate">{PEOPLE[id].name}</span>
                    <span className="text-[11px] text-faint">{n}</span>
                  </MenuItem>
                ))}
              </>
            )}
          </Menu>
          {who && (
            <button onClick={() => setWho(null)} className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-[12px] text-accent">
              {PEOPLE[who].name.split(" ")[0]} <IconX size={12} />
            </button>
          )}
          <span className="ml-auto text-[12px] text-faint">
            {filtered.length} of {items.length} meetings
          </span>
        </div>

        {upcoming}

        {groups.length === 0 && (
          <div className="rounded-lg border border-dashed border-line p-8 text-center text-muted">
            No meetings match{query ? ` "${query}"` : ""}
            {who ? ` with ${PEOPLE[who].name}` : ""}.{" "}
            <button className="text-accent hover:underline" onClick={() => (setQuery(""), setWho(null))}>
              Clear filters
            </button>
          </div>
        )}

        {groups.map((g) => (
          <section key={g.day} className="mb-5">
            <h2 className="mb-1.5 text-[12px] font-medium text-muted">{g.label}</h2>
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
              {g.items.map((i) => (
                <li key={i.id}>
                  <Link href={i.href ?? `/meetings/${i.id}`} className="flex gap-4 p-3 transition-colors hover:bg-white/[0.03]">
                    <Thumb item={i} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <h3 className="truncate text-[14px] font-semibold text-fg">{i.title}</h3>
                        <span className="shrink-0 text-[12px] text-faint">{i.time}</span>
                        {i.origin && (
                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${i.origin === "recording" ? "bg-red-500/15 text-red-300" : "bg-amber-400/15 text-amber-200"}`}>
                            {i.origin === "recording" ? "Recording (simulated)" : "Created from simulated capture · this browser only"}
                          </span>
                        )}
                        <span className="ml-auto shrink-0 rounded bg-raised px-1.5 py-0.5 text-[11px] text-muted sm:hidden">{minutes(i.duration)}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-muted">{i.snippet}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <AvatarStack ids={i.participants} max={6} size={20} />
                        <span className="text-[12px] text-faint">
                          {i.participants.length} {i.participants.length === 1 ? "speaker" : "people"}
                        </span>
                        <span className="flex items-center gap-1 text-[12px] text-faint">
                          <IconChecklist size={13} /> {i.actionCount}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="pb-6 pt-2 text-center text-[11px] text-faint">
          Unofficial rebuild for study. Not affiliated with Fathom. All people, companies and calls are fictional seed data.
        </p>
      </div>
    </div>
  );
}
