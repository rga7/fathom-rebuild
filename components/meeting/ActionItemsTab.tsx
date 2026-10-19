"use client";
import { person } from "@/data/people";
import { Avatar } from "../Avatar";
import { useMeeting } from "./context";

export function ActionItemsTab() {
  const { meeting } = useMeeting();
  return (
    <ul className="divide-y divide-line">
      {meeting.actionItems.map((a) => (
        <li key={a.id} className="flex items-center gap-3 py-2.5">
          <span className="flex-1">{a.text}</span>
          {a.owner && (
            <span className="flex items-center gap-1.5 text-muted">
              <Avatar id={a.owner} size={18} /> {person(a.owner).name}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
