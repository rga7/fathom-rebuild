import type { Meeting } from "../types";
import { standupAnchors as A, standupLines } from "../generated/standup.ts";

export const standup: Meeting = {
  id: "atlas-eng-standup",
  shareToken: "aIOlLqxACRYbkXeLDzIh",
  title: "Atlas eng standup",
  kind: "standup",
  startedAt: "2026-10-16T16:30:00Z",
  hostId: "maya",
  participants: ["maya", "priya", "ben", "dev", "jordan"],
  snippet:
    "Status pill is built behind a flag; audit logging is live in the work order and photo services. Ben was blocked on the staging Postgres upgrade (Dev unblocking by 11). The iOS draft fix starts Tuesday.",
  lines: standupLines,
  defaultTemplate: "standup",
  summaries: {
    general: [
      { heading: "Meeting purpose", body: "Daily engineering standup for the Atlas team." },
      {
        heading: "Key takeaways",
        bullets: [
          { text: "Status pill component done behind a feature flag; being wired to a fake network toggle for Sofia's test.", cite: A.priya_today },
          { text: "Audit logging shipped to work order and photo services; auth service is next.", cite: A.ben_blocker },
          { text: "Spike doc ~70% done; device-wipe section is a placeholder pending Aisha's numbers.", cite: A.dev_wipe },
          { text: "iOS form-persistence fix: beta next week, production the week after.", cite: A.jordan_orchard },
        ],
      },
    ],
    one_on_one: [
      { heading: "Format note", body: "Group standup rendered as 1:1 sections." },
      { heading: "Blockers", bullets: [{ text: "Staging auth DB on old Postgres blocks Ben's migration tests.", cite: A.ben_blocker }, { text: "Device-wipe question blocks the spike doc.", cite: A.dev_wipe }] },
      { heading: "Follow-ups", bullets: [{ text: "Jordan gets Priya the warning-state tokens by lunch.", cite: A.ai_tokens }] },
    ],
    standup: [
      {
        heading: "Priya",
        bullets: [
          { lead: "Yesterday", text: "Finished the status pill component (behind a flag)." },
          { lead: "Today", text: "Wire it to the fake network toggle for Sofia.", cite: A.priya_today },
          { lead: "Blockers", text: "Needs warning-state design tokens. Jordan to chase Sofia.", cite: A.ai_tokens },
        ],
      },
      {
        heading: "Ben",
        bullets: [
          { lead: "Yesterday", text: "Shared logging library in work order service and photo store; checked against Tom's required fields." },
          { lead: "Today", text: "Auth service audit logging." },
          { lead: "Blockers", text: "Staging auth DB still on old Postgres. Dev finishing the upgrade by 11.", cite: A.ben_blocker },
        ],
      },
      {
        heading: "Dev",
        bullets: [
          { lead: "Yesterday", text: "Spike doc ~70%; conflict section done (last-write-wins + conflict log)." },
          { lead: "Today", text: "Finish staging upgrade for Ben, then the rest of the doc.", cite: A.ai_staging },
          { lead: "Blockers", text: "Device-wipe numbers from Aisha.", cite: A.dev_wipe },
        ],
      },
      {
        heading: "Jordan",
        bullets: [
          { lead: "Update", text: "Decision memo from planning is out." },
          { lead: "Ask", text: "Status of the iOS drafts fix for Orchard. Answer: starts Tuesday, beta next week.", cite: A.jordan_orchard },
        ],
      },
    ],
    meddpicc: [
      { heading: "Format note", body: "Engineering standup with no sales context. MEDDPICC fields were not discussed." },
      {
        heading: "MEDDPICC",
        bullets: [
          { lead: "Metrics", text: "Not discussed." },
          { lead: "Economic buyer", text: "Not discussed." },
          { lead: "Decision criteria", text: "Not discussed." },
          { lead: "Decision process", text: "Not discussed." },
          { lead: "Paper process", text: "Not discussed." },
          { lead: "Identify pain", text: "Orchard is asking daily about the iOS drafts fix.", cite: A.jordan_orchard },
          { lead: "Champion", text: "Not discussed." },
          { lead: "Competition", text: "Not discussed." },
        ],
      },
    ],
  },
  actionItems: [
    { id: "a1", text: "Get Priya the warning-state design tokens from Sofia", owner: "jordan", due: "2026-10-16", sourceLineId: A.ai_tokens },
    { id: "a2", text: "Finish the staging Postgres upgrade to unblock Ben", owner: "dev", due: "2026-10-16", sourceLineId: A.ai_staging },
    { id: "a3", text: "Tell Orchard the iOS fix ships the week after next", owner: "jordan", due: "2026-10-19", sourceLineId: A.jordan_orchard },
  ],
  questions: [
    { id: "q1", lineId: "L023", answered: true },
    { id: "q2", lineId: "L028", answered: true },
    { id: "q3", lineId: "L031", answered: true },
  ],
  chapters: [
    { id: "c1", title: "Round-robin updates", startLineId: A.ch_round },
    { id: "c2", title: "Product asks", startLineId: "L026" },
  ],
  decisions: [],
  followUpEmail: {
    subject: "Standup notes: Fri Oct 16",
    body: `Team,

- Priya: status pill done (flagged); wiring to the network toggle today. Tokens coming from Sofia via Jordan.
- Ben: audit logging live in work orders and photo store; auth next. Unblocked once staging Postgres is upgraded (Dev, by 11).
- Dev: spike doc ~70%, on track for Friday with an asterisk on the device-wipe section.
- iOS drafts fix: starts Tuesday, beta next week, production the week after.

Dev runs Monday's standup.
Maya`,
  },
  suggestedPrompts: ["Who is blocked and on what?", "When does the iOS drafts fix ship?", "What's the status of audit logging?"],
  highlights: [{ id: "hl-standup-blocker", type: "tech_question", title: "Staging Postgres blocks auth migration tests", startLineId: A.ben_blocker, endLineId: A.ai_staging }],
  scratchpad: `- @Priya send Sofia the status pill build by Monday`,
  vocabSuggestions: [{ from: "post gress", to: "Postgres" }],
};
