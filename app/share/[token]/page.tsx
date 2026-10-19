import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MEETINGS, getMeetingByToken } from "@/data";
import { SharedView } from "@/components/meeting/SharedView";

export const dynamicParams = false;

export function generateStaticParams() {
  return MEETINGS.map((m) => ({ token: m.shareToken }));
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const m = getMeetingByToken((await params).token);
  return { title: m ? `${m.title} · shared` : "Shared meeting" };
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const meeting = getMeetingByToken((await params).token);
  if (!meeting) notFound();
  return <SharedView meeting={meeting} />;
}
