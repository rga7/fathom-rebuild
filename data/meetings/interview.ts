import type { Meeting } from "../types";
import { interviewAnchors as A, interviewLines } from "../generated/interview.ts";

export const interview: Meeting = {
  id: "interview-elena-ruiz",
  shareToken: "yoVGds8cSyWtCwpHXZw5",
  title: "Interview: Senior Product Designer (Elena Ruiz)",
  kind: "interview",
  startedAt: "2026-09-29T20:00:00Z",
  hostId: "sofia",
  participants: ["sofia", "jordan", "elena"],
  snippet:
    "Elena has 8 years designing for deskless workers (warehouse, home-care nursing). In her best project, voice notes at the door cut late notes ~60% after ride-alongs. Strong product judgment: \"SSO is mostly a login screen.\"",
  lines: interviewLines,
  defaultTemplate: "general",
  summaries: {
    general: [
      { heading: "Meeting purpose", body: "Senior Product Designer interview: portfolio deep-dive, product judgment, and candidate questions." },
      {
        heading: "Key takeaways",
        bullets: [
          { lead: "Background", text: "8 years; agency → logistics (warehouse apps) → healthcare scheduling startup (home-care nurses).", cite: A.q_background },
          { lead: "Best project", text: "Rejected \"more reminders\"; did ride-alongs and moved visit notes to a 90-second voice flow at the door.", cite: A.voice_notes },
          { lead: "Impact", text: "Late notes down ~60% in two months; note quality improved.", cite: A.sixty_percent },
          { lead: "Product judgment", text: "Prioritize what makes people leave; noted SSO is mostly engineering, so both could fit.", cite: A.ch_product },
          { lead: "Collaboration", text: "Separates disagreements into problem, evidence, and solution, and prototypes to settle solution disputes.", cite: A.disagree },
        ],
      },
      { heading: "Open questions", bullets: [{ text: "Candidate asked how design and engineering resolve scope disagreements; no clean answer given.", cite: A.q_scope_unanswered }] },
    ],
    one_on_one: [
      { heading: "Format note", body: "Interview rendered as 1:1 sections." },
      { heading: "Strengths", bullets: [{ text: "Field research habit (ride-alongs).", cite: A.voice_notes }, { text: "Pragmatic on design systems: start with the five most-used components." }] },
      { heading: "Growth areas", bullets: [{ text: "Would involve engineering in research earlier next time (her own reflection)." }] },
    ],
    standup: [
      { heading: "Format note", body: "Interview rendered as a standup." },
      { heading: "Per person", bullets: [{ lead: "Sofia", text: "Next: send decision to Elena by end of next week." }] },
    ],
    meddpicc: [
      { heading: "Format note", body: "Hiring interview with no sales context. MEDDPICC fields were not discussed." },
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
    { id: "a1", text: "Get back to Elena with a decision", owner: "sofia", due: "2026-10-09", sourceLineId: "L053" },
  ],
  questions: [
    { id: "q1", lineId: "L015", answered: true },
    { id: "q2", lineId: "L019", answered: true },
    { id: "q3", lineId: "L028", answered: true },
    { id: "q4", lineId: "L034", answered: true },
    { id: "q5", lineId: "L043", answered: true },
    { id: "q6", lineId: "L048", answered: true },
    { id: "q7", lineId: "L050", answered: false },
  ],
  chapters: [
    { id: "c1", title: "Intro & background", startLineId: A.ch_intro },
    { id: "c2", title: "Project deep-dive", startLineId: A.ch_project },
    { id: "c3", title: "Product judgment", startLineId: A.ch_product },
    { id: "c4", title: "Candidate questions", startLineId: A.ch_questions },
  ],
  decisions: [],
  followUpEmail: {
    subject: "Thank you for interviewing with Lumen",
    body: `Hi Elena,

Thank you for spending time with Sofia and me today. We really enjoyed hearing about the voice-notes project and your ride-alongs with home-care nurses.

As promised, we'll get back to you by the end of next week.

Best,
Jordan`,
  },
  suggestedPrompts: ["What was Elena's strongest example?", "How does she handle disagreements?", "What did she ask us?"],
  highlights: [
    { id: "hl-int-insight", type: "insight", title: "Notes are hard at the right moment, not hard to write", startLineId: "L017", endLineId: A.voice_notes },
    { id: "hl-int-positive", type: "positive", title: "\"SSO is mostly a login screen\"", startLineId: "L031", endLineId: "L032" },
  ],
  scratchpad: `Elena Ruiz

- Strong field-research instincts.
- @Sofia schedule reference checks by next Friday`,
  vocabSuggestions: [],
};
