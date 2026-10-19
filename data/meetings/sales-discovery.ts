import type { Meeting } from "../types";
import { salesDiscoveryAnchors as A, salesDiscoveryLines } from "../generated/sales-discovery.ts";

export const salesDiscovery: Meeting = {
  id: "brightline-discovery",
  shareToken: "OH8O3lOK16GxLJV5rMWE",
  title: "Brightline Logistics: discovery call",
  kind: "sales_discovery",
  startedAt: "2026-10-08T18:00:00Z",
  hostId: "marcus",
  participants: ["marcus", "jordan", "rachel", "omar"],
  snippet:
    "Brightline's 400 technicians re-enter every freezer job (~22 min each, ~3,300 hrs/month). SOC 2 Type II, SAML SSO and a pen test are hard requirements; the competitor has them but its offline demo crashed. Next: security pack, freezer demo, CFO call.",
  lines: salesDiscoveryLines,
  defaultTemplate: "meddpicc",
  summaries: {
    general: [
      { heading: "Meeting purpose", body: "Discovery with Brightline Logistics' field ops director and IT manager to understand pain, decision process, and requirements." },
      {
        heading: "Key takeaways",
        bullets: [
          { lead: "Pain", text: "Technicians lose work inside freezers (no signal), so every job is written on paper and typed again.", cite: A.double_entry },
          { lead: "Cost", text: "~22 minutes of re-entry per job across ~9,000 jobs/month, about 3,300 hours/month. A transcription error caused a compliance fine.", cite: A.metric_minutes },
          { lead: "Requirements", text: "SOC 2 Type II, SAML SSO, and a recent pen test summary are non-negotiable for IT.", cite: A.criteria },
          { lead: "Competition", text: "A larger competitor already has SSO and SOC 2, but its demo crashed offline.", cite: A.ch_competition },
        ],
      },
      {
        heading: "Next steps",
        bullets: [
          { text: "Marcus sends security overview, SOC 2/SSO timeline and draft bridge letter to Omar.", cite: A.ai_security_pack },
          { text: "Jordan runs an in-person freezer demo in Columbus with the offline beta build.", cite: A.ai_demo },
          { text: "Rachel sets up a call with CFO Daniel (likely in two weeks).", cite: A.ai_cfo },
        ],
      },
    ],
    one_on_one: [
      { heading: "Format note", body: "External sales call rendered as 1:1 sections." },
      { heading: "Wins", bullets: [{ text: "Rachel is a strong champion and confirmed pricing is \"in range\".", cite: A.econ_buyer }] },
      { heading: "Blockers", bullets: [{ text: "No SOC 2 report yet; final contract can't be signed without it.", cite: A.bridge }] },
      { heading: "Follow-ups", bullets: [{ text: "Security pack to Omar; demo; CFO call.", cite: A.ch_next }] },
    ],
    standup: [
      { heading: "Format note", body: "Sales call rendered as a standup." },
      {
        heading: "Per person",
        bullets: [
          { lead: "Marcus", text: "Next: security pack + bridge letter to Omar; business case outline.", cite: A.ai_security_pack },
          { lead: "Jordan", text: "Next: offline beta build on a tablet for the freezer demo.", cite: A.ai_demo },
          { lead: "Rachel (Brightline)", text: "Next: ask CFO Daniel for a call.", cite: A.ai_cfo },
        ],
      },
    ],
    meddpicc: [
      {
        heading: "MEDDPICC",
        bullets: [
          { lead: "Metrics", text: "~22 min re-entry per job, ~3,300 hrs/month; first-time fix 71% (target 80%); $380 per truck roll.", cite: A.metric_minutes },
          { lead: "Economic buyer", text: "Rachel owns budget; anything over $250K needs CFO Daniel's sign-off. Daniel is supportive but wants a business case.", cite: A.econ_buyer },
          { lead: "Decision criteria", text: "SOC 2 Type II report, SAML SSO, pen test summary within 12 months (hard requirements), plus offline that works in freezers.", cite: A.criteria },
          { lead: "Decision process", text: "Security review (Omar) → procurement → pilot in Columbus and Atlanta → broader rollout.", cite: A.ch_process },
          { lead: "Paper process", text: "Procurement ~6 weeks after security clears; legal 2–3 weeks in parallel. A bridge letter may start procurement, not the final contract.", cite: A.paper },
          { lead: "Identify pain", text: "Double data entry; transcription errors led to a compliance fine.", cite: A.compliance_pain },
          { lead: "Champion", text: "Rachel Kim, Director of Field Operations." },
          { lead: "Competition", text: "One larger vendor with SSO + SOC 2; weak offline (demo crashed when Wi-Fi was off).", cite: A.ch_competition },
        ],
      },
      { heading: "Pricing signal", body: "Ballpark $450–550K/year for 400 technicians on the enterprise tier; Rachel: \"in range\"." },
    ],
  },
  actionItems: [
    { id: "a1", text: "Send Omar the security overview, SOC 2/SSO timeline and a draft bridge letter", owner: "marcus", due: "2026-10-12", sourceLineId: A.ai_security_pack },
    { id: "a2", text: "Prepare the offline beta build on a tablet for the in-person freezer demo in Columbus", owner: "jordan", due: "2026-10-23", sourceLineId: A.ai_demo },
    { id: "a3", text: "Ask CFO Daniel for an intro call about the business case", owner: "rachel", due: "2026-10-22", sourceLineId: A.ai_cfo },
  ],
  questions: [
    { id: "q1", lineId: A.q_walkthrough, answered: true },
    { id: "q2", lineId: "L017", answered: true },
    { id: "q3", lineId: "L025", answered: true },
    { id: "q4", lineId: "L033", answered: true },
    { id: "q5", lineId: "L041", answered: true },
    { id: "q6", lineId: "L055", answered: true },
    { id: "q7", lineId: "L076", answered: true },
  ],
  chapters: [
    { id: "c1", title: "Intro", startLineId: A.ch_intro },
    { id: "c2", title: "Current process & pain", startLineId: A.ch_pain },
    { id: "c3", title: "Success metrics", startLineId: A.ch_metrics },
    { id: "c4", title: "Decision process & security", startLineId: A.ch_process },
    { id: "c5", title: "Competition", startLineId: A.ch_competition },
    { id: "c6", title: "Next steps", startLineId: A.ch_next },
  ],
  decisions: [{ text: "Pilot would start in Columbus and Atlanta.", lineId: "L054" }],
  followUpEmail: {
    subject: "Great to meet you: next steps for Brightline + Lumen",
    body: `Hi Rachel and Omar,

Thank you for the time today, and for being so open about how field work runs at Brightline.

What we heard
- Technicians lose work in freezers and re-enter every job: ~22 minutes per job, ~3,300 hours a month.
- Goals: re-entry near zero, temperature data captured once at the equipment, first-time fix from 71% to 80%.
- IT requirements: SOC 2 Type II, SAML SSO, and a pen test summary within 12 months.

Next steps
1. I'll send Omar our security overview, the SOC 2 and SSO timeline, and a draft bridge letter.
2. Jordan will bring the offline build to Columbus for a demo in your test freezer.
3. Rachel will ask Daniel about a short call on the business case. I'll send a draft outline using Omar's numbers.

Best,
Marcus`,
  },
  suggestedPrompts: ["What are Brightline's hard security requirements?", "Who signs off on the budget?", "How much time does re-entry cost them?"],
  highlights: [
    { id: "hl-bl-insight", type: "insight", title: "Freezers are Faraday cages", startLineId: "L014", endLineId: A.double_entry },
    { id: "hl-bl-objection", type: "objection", title: "Hard requirements: SOC 2, SSO, pen test", startLineId: A.criteria, endLineId: "L043" },
    { id: "hl-bl-positive", type: "positive", title: "Competitor's demo crashed offline", startLineId: "L060", endLineId: "L060" },
  ],
  scratchpad: `Brightline

- 400 techs, 11 regions. Cold chain.
- @Marcus draft business case outline with Omar's numbers by Friday
- CFO = Daniel. >$250K needs him.`,
  vocabSuggestions: [],
};
