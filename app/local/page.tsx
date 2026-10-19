import type { Metadata } from "next";
import { LocalMeetingView } from "@/components/calendar/LocalMeetingView";

export const metadata: Metadata = { title: "Simulated capture · Fathom rebuild" };

export default function LocalPage() {
  return <LocalMeetingView />;
}
