"use client";
import { person } from "@/data/people";
import { clock } from "@/lib/format";
import { Avatar } from "../Avatar";
import { useMeeting } from "./context";

export function TranscriptTab() {
  const { meeting } = useMeeting();
  return (
    <div className="space-y-3">
      {meeting.lines.map((l) => (
        <p key={l.id}>
          <Avatar id={l.speaker} size={16} /> <span className="text-muted">{person(l.speaker).name}</span>{" "}
          <span className="text-faint">{clock(l.start)}</span> {l.text}
        </p>
      ))}
    </div>
  );
}
