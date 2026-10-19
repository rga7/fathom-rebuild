"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocalMeetings } from "@/lib/localMeetings";
import { AppHeader } from "../AppHeader";
import { MeetingView } from "../meeting/MeetingView";
import { LiveCapture } from "./LiveCapture";

/** Client-only page for calls made by simulated capture: they live in this browser's localStorage, so the server can't render them. */
export function LocalMeetingView() {
  const [id, setId] = useState<string | null | undefined>(undefined);
  const [records] = useLocalMeetings();
  useEffect(() => {
    setId(new URLSearchParams(location.search).get("m"));
  }, []);

  if (id === undefined) return <div className="min-h-dvh" />;
  const record = records.find((r) => r.meeting.id === id);
  if (!record) {
    return (
      <div className="flex min-h-dvh flex-col">
        <AppHeader title="Meeting not found" />
        <div className="mx-auto max-w-md p-8 text-center text-muted" data-testid="local-missing">
          <p className="text-fg">This call isn&apos;t in this browser.</p>
          <p className="mt-1">
            Calls from simulated capture are stored only in the browser that created them, so a link to one won&apos;t work anywhere else (or after clearing site data).
          </p>
          <Link href="/" className="mt-3 inline-block text-accent hover:underline">
            Back to My meetings
          </Link>
        </div>
      </div>
    );
  }
  return record.status === "recording" ? <LiveCapture key={record.meeting.id} record={record} /> : <MeetingView key={record.meeting.id} meeting={record.meeting} />;
}
