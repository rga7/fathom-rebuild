import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MEETINGS, getMeetingByToken } from "@/data";
import type { Meeting } from "@/data/types";
import { SharedView, type SharedClip } from "@/components/meeting/SharedView";
import { decodeClip, seedHighlight } from "@/lib/highlights";
import { durationSec } from "@/lib/derive";
import { isTranscriptOnly } from "@/lib/capture";

// Seeded highlights have short ids and are prerendered. Viewer-made highlights
// live only in that viewer's browser, so their id carries the clip itself
// ("c" + base64url JSON) and is decoded here on demand.
function resolve(id: string): { meeting: Meeting; clip: SharedClip } | null {
  // A clip is a playable range; transcript-only calls have no recording, so they have no clip links.
  for (const m of MEETINGS.filter((x) => !isTranscriptOnly(x))) {
    const h = m.highlights.find((x) => x.id === id);
    if (h) {
      const v = seedHighlight(m, h);
      return { meeting: m, clip: { id: v.id, type: v.type, start: v.start, end: v.end, title: v.title } };
    }
  }
  const c = decodeClip(id);
  if (!c) return null;
  const meeting = getMeetingByToken(c.token);
  if (!meeting || isTranscriptOnly(meeting) || c.start > durationSec(meeting)) return null;
  return { meeting, clip: { id, type: c.type, start: c.start, end: Math.min(c.end, durationSec(meeting)), title: c.title } };
}

export function generateStaticParams() {
  return MEETINGS.filter((m) => !isTranscriptOnly(m)).flatMap((m) => m.highlights.map((h) => ({ id: h.id })));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const r = resolve((await params).id);
  return { title: r ? `${r.clip.title} · clip from ${r.meeting.title}` : "Shared clip" };
}

export default async function ClipPage({ params }: { params: Promise<{ id: string }> }) {
  const r = resolve((await params).id);
  if (!r) notFound();
  return <SharedView meeting={r.meeting} clip={r.clip} />;
}
