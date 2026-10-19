"use client";
import type { SummaryBullet, SummarySection } from "@/data/types";
import { lineStart } from "@/lib/derive";
import { CiteChip } from "./CiteChip";
import { useMeeting } from "./context";

function Bullet({ b }: { b: SummaryBullet }) {
  const { meeting, seekTo } = useMeeting();
  return (
    <li className="pl-1 marker:text-faint">
      {b.lead && <span className="font-semibold text-fg">{b.lead}: </span>}
      <span>{b.text}</span>
      {b.cite && <CiteChip t={lineStart(meeting, b.cite)} onClick={() => seekTo(lineStart(meeting, b.cite!))} />}
      {b.children && (
        <ul className="mt-1 list-[circle] space-y-1 pl-5">
          {b.children.map((c, i) => (
            <Bullet key={i} b={c} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function SummaryView({ sections }: { sections: SummarySection[] }) {
  return (
    <div className="space-y-5 text-[13.5px] leading-6 text-zinc-300">
      {sections.map((s) => (
        <section key={s.heading}>
          <h3 className="mb-1.5 text-[14px] font-semibold text-fg">{s.heading}</h3>
          {s.body && <p>{s.body}</p>}
          {s.bullets && (
            <ul className="list-disc space-y-1.5 pl-5">
              {s.bullets.map((b, i) => (
                <Bullet key={i} b={b} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
