import type { Meeting } from "./types";
import { flagship } from "./meetings/flagship.ts";
import { oneOnOne } from "./meetings/one-on-one.ts";
import { standup } from "./meetings/standup.ts";
import { salesDiscovery } from "./meetings/sales-discovery.ts";
import { customerCall } from "./meetings/customer-call.ts";
import { interview } from "./meetings/interview.ts";
import { designReview } from "./meetings/design-review.ts";
import { monologue } from "./meetings/monologue.ts";
import { metricsReview } from "./meetings/metrics-review.ts";
import { kickoff } from "./meetings/kickoff.ts";

/** All seeded meetings, newest first. */
export const MEETINGS: Meeting[] = [
  flagship,
  oneOnOne,
  standup,
  salesDiscovery,
  customerCall,
  interview,
  designReview,
  monologue,
  metricsReview,
  kickoff,
].sort((a, b) => b.startedAt.localeCompare(a.startedAt));

export const FLAGSHIP_ID = flagship.id;

export function getMeeting(id: string): Meeting | undefined {
  return MEETINGS.find((m) => m.id === id);
}

export function getMeetingByToken(token: string): Meeting | undefined {
  return MEETINGS.find((m) => m.shareToken === token);
}
