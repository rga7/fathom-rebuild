import { MEETINGS } from "@/data";
import { PEOPLE } from "@/data/people";
import { durationSec } from "@/lib/derive";
import { dayHeading, dayKey, timeOfDay } from "@/lib/format";
import { AppHeader } from "@/components/AppHeader";
import { MeetingsList, type ListItem } from "@/components/MeetingsList";

export default function Home() {
  const items: ListItem[] = MEETINGS.map((m) => ({
    id: m.id,
    title: m.title,
    kind: m.kind,
    day: dayKey(m.startedAt),
    dayLabel: dayHeading(m.startedAt),
    time: timeOfDay(m.startedAt),
    duration: durationSec(m),
    participants: m.participants,
    snippet: m.snippet,
    actionCount: m.actionItems.length,
    search: [
      m.title,
      m.snippet,
      ...m.participants.map((p) => PEOPLE[p]?.name ?? p),
      ...m.actionItems.map((a) => a.text),
      ...m.summaries.general.flatMap((s) => (s.bullets ?? []).map((b) => `${b.lead ?? ""} ${b.text}`)),
    ]
      .join(" ")
      .toLowerCase(),
  }));
  return (
    <div className="flex h-dvh flex-col">
      <AppHeader title="My meetings" />
      <MeetingsList items={items} />
    </div>
  );
}
