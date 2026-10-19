import type { Meeting } from "../types";
import { kickoffAnchors as A, kickoffLines } from "../generated/kickoff.ts";

export const kickoff: Meeting = {
  id: "kessler-pilot-kickoff",
  shareToken: "Ya3Ux5B0AZtw7PzbSfxQ",
  title: "Kessler Field Services: pilot kickoff",
  kind: "kickoff",
  startedAt: "2026-09-10T16:00:00Z",
  hostId: "aisha",
  participants: ["aisha", "marcus", "victor", "claire"],
  snippet:
    "10-week pilot with 20 technicians in Philadelphia starting Sep 14. Success means 80%+ of jobs closed in-app, dispatch phone time halved, and a passed security review (Kessler needs the SOC 2 report itself). Claire owns the pilot.",
  lines: kickoffLines,
  defaultTemplate: "general",
  summaries: {
    general: [
      { heading: "Meeting purpose", body: "Kick off the Kessler pilot: success criteria, timeline, and owners." },
      {
        heading: "Key takeaways",
        bullets: [
          { lead: "Success criteria", text: "80%+ of jobs closed in the app; dispatch phone time cut in half (from ~2 hrs/day); pass security review.", cite: A.metric_dispatch },
          { lead: "Security", text: "Procurement requires the actual SOC 2 report, not a timeline.", cite: A.report_required },
          { lead: "Dispatch pain", text: "Morning confirmation calls and afternoon status chasing; real-time status is the biggest win.", cite: A.ch_dispatch },
          { lead: "Timeline", text: "10 weeks from Sep 14, Philadelphia region, 20 technicians.", cite: A.ch_timeline },
        ],
      },
      { heading: "Next steps", bullets: [{ text: "Aisha sends kickoff summary by tomorrow.", cite: A.ai_summary }, { text: "Claire sends current job statuses for mapping.", cite: A.ai_statuses }] },
    ],
    one_on_one: [
      { heading: "Format note", body: "Customer kickoff rendered as 1:1 sections." },
      { heading: "Follow-ups", bullets: [{ text: "Status mapping, shared channel, kickoff summary.", cite: A.ai_summary }] },
    ],
    standup: [
      { heading: "Format note", body: "Kickoff rendered as a standup." },
      {
        heading: "Per person",
        bullets: [
          { lead: "Aisha", text: "Next: kickoff summary, shared channel, status mapping.", cite: A.ai_channel },
          { lead: "Claire (Kessler)", text: "Owns the pilot; sends job status list.", cite: A.ai_statuses },
        ],
      },
    ],
    meddpicc: [
      {
        heading: "MEDDPICC",
        bullets: [
          { lead: "Metrics", text: "80%+ jobs in-app; dispatch calls halved from ~2 hrs/day.", cite: A.metric_dispatch },
          { lead: "Economic buyer", text: "Victor Osei, VP Operations." },
          { lead: "Decision criteria", text: "Adoption, dispatch time saved, security review.", cite: A.q_success },
          { lead: "Decision process", text: "10-week pilot → measure in weeks 9–10 → full contract.", cite: A.ch_timeline },
          { lead: "Paper process", text: "Procurement needs the SOC 2 report before signing.", cite: A.report_required },
          { lead: "Identify pain", text: "Dispatch spends ~2 hours a day chasing job status by phone.", cite: A.ch_dispatch },
          { lead: "Champion", text: "Claire Dubois, Service Manager (pilot owner)." },
          { lead: "Competition", text: "Not discussed." },
        ],
      },
    ],
  },
  actionItems: [
    { id: "a1", text: "Send kickoff summary with success criteria, timeline and owners", owner: "aisha", due: "2026-09-11", sourceLineId: A.ai_summary },
    { id: "a2", text: "Map Kessler's job statuses during setup", owner: "aisha", due: "2026-09-14", sourceLineId: A.ai_statuses },
    { id: "a3", text: "Set up a shared support channel and share direct line", owner: "aisha", due: "2026-09-14", sourceLineId: A.ai_channel },
  ],
  questions: [
    { id: "q1", lineId: A.q_success, answered: true },
    { id: "q2", lineId: "L018", answered: true },
    { id: "q3", lineId: "L023", answered: true },
    { id: "q4", lineId: "L025", answered: true },
  ],
  chapters: [
    { id: "c1", title: "Goals & success criteria", startLineId: A.ch_goals },
    { id: "c2", title: "Dispatch today", startLineId: A.ch_dispatch },
    { id: "c3", title: "Timeline & owners", startLineId: A.ch_timeline },
  ],
  decisions: [{ text: "Claire Dubois owns the pilot on Kessler's side.", lineId: "L027" }],
  followUpEmail: {
    subject: "Kessler pilot kickoff summary",
    body: `Hi Victor and Claire,

Thanks for a great kickoff.

Success criteria
- 80%+ of jobs closed in the app
- Dispatch phone time cut in half
- Security review passed (SOC 2 report required for the full contract)

Timeline: 10 weeks from Sep 14; 20 technicians in Philadelphia. Week 1 setup and training, weekly check-ins, measurement in weeks 9–10.

Owners: Claire (Kessler), Aisha (Lumen).

Please send your current job statuses and I'll map them during setup.

Aisha`,
  },
  suggestedPrompts: ["What are the pilot success criteria?", "What does procurement require?", "Who owns the pilot?"],
  highlights: [{ id: "hl-kes-objection", type: "objection", title: "Procurement wants the actual SOC 2 report", startLineId: A.report_required, endLineId: A.report_required }],
  scratchpad: `- @Claire send job status list by Monday`,
  vocabSuggestions: [],
};
