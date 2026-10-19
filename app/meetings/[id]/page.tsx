import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MEETINGS, getMeeting } from "@/data";
import { MeetingView } from "@/components/meeting/MeetingView";

export const dynamicParams = false;

export function generateStaticParams() {
  return MEETINGS.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const m = getMeeting((await params).id);
  return { title: m ? `${m.title} · Fathom rebuild` : "Fathom rebuild" };
}

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const meeting = getMeeting((await params).id);
  if (!meeting) notFound();
  return <MeetingView meeting={meeting} />;
}
