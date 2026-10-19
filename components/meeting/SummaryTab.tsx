"use client";
import { SummaryView } from "./SummaryView";
import { useMeeting } from "./context";

export function SummaryTab() {
  const { meeting } = useMeeting();
  return <SummaryView sections={meeting.summaries[meeting.defaultTemplate]} />;
}
