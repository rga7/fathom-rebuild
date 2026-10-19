import type { Meeting } from "../types";
import { monologueAnchors as A, monologueLines } from "../generated/monologue.ts";

export const monologue: Meeting = {
  id: "sync-engine-walkthrough",
  shareToken: "RnbmXj09LaY8ks62o1yD",
  title: "Sync engine walkthrough (solo)",
  kind: "monologue",
  startedAt: "2026-10-16T23:00:00Z",
  hostId: "dev",
  participants: ["dev"],
  snippet:
    "Dev's solo recording on the upload-queue sync engine: device-first writes in SQLite, idempotent change IDs, last-write-wins on server receive time with a conflict log, and a separate resumable photo queue. Open: device wipes before the queue drains.",
  lines: monologueLines,
  defaultTemplate: "general",
  summaries: {
    general: [
      { heading: "Meeting purpose", body: "Solo technical walkthrough of the proposed sync engine for the upload queue." },
      {
        heading: "Key takeaways",
        bullets: [
          { lead: "Device first", text: "Every change is written locally (SQLite on Android and iOS) before it's sent.", cite: A.local_store },
          { lead: "Idempotent writes", text: "Each change gets a device-generated ID, so the server ignores duplicates from retries.", cite: A.idempotent },
          { lead: "Conflicts", text: "Considered last-write-wins, vector clocks, and CRDTs. Chose last-write-wins plus a conflict log for v1; CRDTs are too costly for now.", cite: A.lww_proposal },
          { lead: "Clock skew", text: "Use server receive time, not device time, to pick the winner.", cite: A.server_time },
          { lead: "Photos", text: "Separate queue; form data first, photos uploaded one at a time with resumable uploads and exponential back-off.", cite: A.resumable },
        ],
      },
      { heading: "Open questions", bullets: [{ text: "What happens if a device is wiped before the queue drains?", cite: A.q_wipe }] },
    ],
    one_on_one: [
      { heading: "Format note", body: "Solo recording; no 1:1 conversation took place." },
      { heading: "Blockers", bullets: [{ text: "Needs numbers on nightly device wipes.", cite: A.q_wipe }] },
    ],
    standup: [
      { heading: "Format note", body: "Solo recording rendered as a standup." },
      { heading: "Dev", bullets: [{ lead: "Done", text: "Sync design: local-first, idempotent, LWW + conflict log." }, { lead: "Blocker", text: "Device-wipe question.", cite: A.q_wipe }] },
    ],
    meddpicc: [
      { heading: "Format note", body: "Technical monologue with no sales context. MEDDPICC fields were not discussed." },
      {
        heading: "MEDDPICC",
        bullets: [
          { lead: "Metrics", text: "Not discussed." },
          { lead: "Economic buyer", text: "Not discussed." },
          { lead: "Decision criteria", text: "Not discussed." },
          { lead: "Decision process", text: "Not discussed." },
          { lead: "Paper process", text: "Not discussed." },
          { lead: "Identify pain", text: "Not discussed." },
          { lead: "Champion", text: "Not discussed." },
          { lead: "Competition", text: "Not discussed." },
        ],
      },
    ],
  },
  actionItems: [
    { id: "a1", text: "Get numbers on how many customers wipe tablets nightly before finalizing the queue design", owner: "dev", due: "2026-10-23", sourceLineId: "L028" },
  ],
  questions: [{ id: "q1", lineId: A.q_wipe, answered: false }],
  chapters: [
    { id: "c1", title: "The problem & principles", startLineId: A.ch_problem },
    { id: "c2", title: "Conflict strategies", startLineId: A.ch_conflicts },
    { id: "c3", title: "Photos & open questions", startLineId: A.ch_photos },
  ],
  decisions: [{ text: "Last-write-wins plus a conflict log for v1, using server receive time.", lineId: A.lww_proposal }],
  followUpEmail: {
    subject: "Sync engine walkthrough: recording + summary",
    body: `Team,

I recorded a short walkthrough of the sync engine design. Summary:

- Device-first writes (SQLite), idempotent change IDs.
- Last-write-wins + conflict log for v1, decided on server receive time.
- Separate resumable photo queue with exponential back-off.

Open question: device wipes before the queue drains. Please leave comments in the doc.

Dev`,
  },
  suggestedPrompts: ["Why not CRDTs?", "How are duplicate uploads handled?", "What's the open question?"],
  highlights: [{ id: "hl-mono-tech", type: "tech_question", title: "Device wipe before queue drains", startLineId: A.q_wipe, endLineId: "L027" }],
  scratchpad: `- Record follow-up on battery back-off.`,
  vocabSuggestions: [
    { from: "see are DTs", to: "CRDTs" },
    { from: "See are DTs", to: "CRDTs" },
    { from: "vector clucks", to: "vector clocks" },
    { from: "idem potent", to: "idempotent" },
    { from: "SQL light", to: "SQLite" },
  ],
};
