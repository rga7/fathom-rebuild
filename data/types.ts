export type PersonId = string;

export interface Person {
  id: PersonId;
  name: string;
  title: string;
  company: string;
  /** Avatar background, any CSS color. */
  color: string;
}

/** One transcript line. Every line carries its own start time, not just each turn. */
export interface Line {
  id: string;
  speaker: PersonId;
  text: string;
  /** Seconds from the start of the recording. */
  start: number;
  end: number;
}

export type MeetingKind =
  | "planning"
  | "one_on_one"
  | "standup"
  | "sales_discovery"
  | "customer_call"
  | "interview"
  | "design_review"
  | "monologue"
  | "metrics_review"
  | "kickoff";

export type TemplateId = "general" | "one_on_one" | "standup" | "meddpicc";

export interface SummaryBullet {
  lead?: string;
  text: string;
  /** Line id this claim comes from; rendered as a seek chip. */
  cite?: string;
  children?: SummaryBullet[];
}

export interface SummarySection {
  heading: string;
  body?: string;
  bullets?: SummaryBullet[];
}

export interface ActionItem {
  id: string;
  text: string;
  owner: PersonId | null;
  /** ISO date (YYYY-MM-DD). */
  due: string;
  /** The line the item was assigned on. Its timestamp is read from the transcript. */
  sourceLineId: string;
}

export interface DetectedQuestion {
  id: string;
  lineId: string;
  /** False when nobody answered it in the call. */
  answered: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  startLineId: string;
}

export interface Decision {
  text: string;
  lineId: string;
}

export const HIGHLIGHT_TYPES = [
  "action_item",
  "insight",
  "positive",
  "feedback",
  "objection",
  "tech_question",
  "bookmark",
] as const;
export type HighlightType = (typeof HIGHLIGHT_TYPES)[number];

/** Seeded highlights anchor to lines so their ranges always match the transcript. */
export interface SeedHighlight {
  id: string;
  type: HighlightType;
  title: string;
  startLineId: string;
  endLineId: string;
  note?: string;
}

/** How a call was captured. Transcript-only calls have no recording, so no player. */
export type CaptureMode = "video" | "audio" | "transcript";

export interface Meeting {
  id: string;
  /** Opaque token for the signed-out /share/[token] page. */
  shareToken: string;
  title: string;
  kind: MeetingKind;
  /** Set on calls made by the simulated capture flow. They live in one browser only and have no share links. */
  origin?: "simulated-capture";
  /** Absent means a normal (audio) call with the simulated player. */
  capture?: CaptureMode;
  /** ISO datetime the call started. */
  startedAt: string;
  hostId: PersonId;
  participants: PersonId[];
  /** One- or two-sentence snippet for the meetings list. */
  snippet: string;
  lines: Line[];
  /** Template the meeting opens on. */
  defaultTemplate: TemplateId;
  summaries: Record<TemplateId, SummarySection[]>;
  actionItems: ActionItem[];
  questions: DetectedQuestion[];
  chapters: Chapter[];
  decisions: Decision[];
  followUpEmail: { subject: string; body: string };
  suggestedPrompts: [string, string, string];
  highlights: SeedHighlight[];
  /** Seed scratchpad text; viewers' edits override it in localStorage. */
  scratchpad: string;
  /** Likely speech-to-text errors spotted at seed time, offered as vocabulary fixes. */
  vocabSuggestions: { from: string; to: string }[];
}
