import type { Meeting } from "../types";
import { flagshipAnchors as A, flagshipLines } from "../generated/flagship.ts";

export const flagship: Meeting = {
  id: "q1-planning-atlas-2",
  shareToken: "TF5FvWmPPxSGTH52zX4V",
  title: "Q1 Planning: Atlas 2.0 scope & launch date",
  kind: "planning",
  startedAt: "2026-10-15T21:00:00Z",
  hostId: "jordan",
  participants: ["jordan", "maya", "dev", "sofia", "marcus", "aisha", "tom", "lena"],
  snippet:
    "Atlas 2.0 goes GA on March 24 at Field Service Connect with SSO and enterprise features; offline (\"never lose work\") ships as an Android beta. The SOC 2 Type II window starts January 6, and route optimization moves to Q2.",
  lines: flagshipLines,
  defaultTemplate: "general",
  summaries: {
    general: [
      {
        heading: "Meeting purpose",
        body: "Agree on the scope of Atlas 2.0 and a launch date the team believes in, with an owner for each piece.",
      },
      {
        heading: "Key takeaways",
        bullets: [
          { lead: "Retention is the bigger problem", text: "NRR fell to 94%, the lowest in six quarters. 17 of 25 churned accounts cited technicians losing work without signal (~$410K ARR), against ~$260K lost to missing enterprise features.", cite: A.churn_offline },
          { lead: "Enterprise pipeline is blocked", text: "Three late-stage deals worth ~$1.2M first-year ACV (Brightline, Kessler, Orchard's parent) are waiting on SOC 2 Type II and SAML SSO.", cite: A.pipeline_value },
          { lead: "Offline scope narrowed", text: "Research with six technicians showed nobody wants an offline toggle. They want the app to keep their work and queue photos and signatures. That cuts the estimate from ~9 to ~5 engineer-months.", cite: A.no_toggle },
          { lead: "Capacity is 14 engineer-months", text: "Q1 capacity includes security work. Maya wants a 20% buffer on anything touching sync, which leaves ~11.5 committable.", cite: A.capacity_number },
          { lead: "Disagreement, resolved", text: "Marcus argued SSO and SOC 2 should come first to unblock known revenue; Maya argued offline protects the larger installed base. They settled it by sequencing SSO first (February) without cutting offline.", cite: A.dis_peak },
        ],
      },
      {
        heading: "Decisions",
        bullets: [
          { lead: "Decision 1", text: "Start the SOC 2 Type II observation window on January 6, owned by Tom. SAML SSO ships in Atlas 2.0 and lands first, in February.", cite: A.dec1_start },
          { lead: "Decision 2", text: "Atlas 2.0 GA on March 24 at Field Service Connect. SSO and enterprise features are GA; \"Never lose work\" ships as an Android-first beta (read access + queued writes). Route optimization moves to Q2.", cite: A.dec2_start },
        ],
      },
      {
        heading: "Topics",
        bullets: [
          {
            lead: "Customer signals",
            text: "Offline data loss dominates churn; photo uploads that fail silently drive support tickets.",
            cite: A.photo_insight,
            children: [
              { text: "Pricing churn (5 accounts) was mostly accounts that never adopted forms, so it is more an onboarding problem than a price problem." },
              { text: "Orchard's ops manager: technicians write on paper first, then re-type it later.", cite: A.greg_quote },
            ],
          },
          {
            lead: "Engineering",
            text: "Upload queue uses last-write-wins with a conflict log for the office instead of CRDTs. The Postgres upgrade must happen in Q1.",
            cite: A.q_lww,
            children: [
              { text: "Audit logging starts with customer-data services (work orders, photo store, auth) in Nov–Dec." },
              { text: "The iOS form-persistence fix (~2 weeks) ships in Q4 as a quick win." },
            ],
          },
          {
            lead: "Security",
            text: "SSO v1 must support Okta and Azure AD; SCIM provisioning is Q2. Auditor engagement (~$42K) approved; pen test in February after SSO lands.",
            cite: A.jan6,
          },
          {
            lead: "Launch",
            text: "Launch at Field Service Connect (Dallas). Analyst briefings two weeks before; SOC 2 described as \"in progress\" on the trust page only, not in press.",
            cite: A.q_announce,
          },
        ],
      },
      {
        heading: "Open questions",
        bullets: [
          { text: "Is \"Never lose work\" in the base plan or an add-on? Lena to model it.", cite: A.q_pricing },
          { text: "Who owns the legacy Android migration? Offline on Android is blocked on it.", cite: A.q_android },
          { text: "Does adding an EU region change SOC 2 audit scope? Tom to ask the auditor.", cite: A.q_eu },
          { text: "How many customers wipe tablets nightly (which would erase queued work)?", cite: A.q_wipe },
        ],
      },
    ],
    one_on_one: [
      { heading: "Context", body: "Group planning meeting, not a 1:1. Mapped below to the closest 1:1 sections." },
      {
        heading: "Wins",
        bullets: [
          { text: "Team reached two clear decisions with named owners and dates.", cite: A.dec2_start },
          { text: "Sofia's research reframed offline into a smaller, shippable scope.", cite: A.no_toggle },
        ],
      },
      {
        heading: "Blockers & risks",
        bullets: [
          { text: "Legacy Android migration has no owner; Maya flagged the March beta at risk if unresolved by early December.", cite: A.q_android },
          { text: "Nightly device wipes at some medical customers could erase queued work.", cite: A.q_wipe },
        ],
      },
      {
        heading: "Feedback & dynamics",
        bullets: [
          { text: "Marcus and Maya disagreed sharply on ordering; both acknowledged it at the end and agreed the outcome was good.", cite: A.dis_peak },
        ],
      },
      {
        heading: "Follow-ups",
        bullets: [
          { text: "Jordan circulates the decision memo today.", cite: A.ai_jordan_memo },
          { text: "Maya rebalances the Q1 capacity plan by Oct 23.", cite: A.ai_maya_capacity },
        ],
      },
    ],
    standup: [
      { heading: "Format note", body: "Planning meeting rendered as a standup: what's done, what's next, and blockers per person." },
      {
        heading: "Per person",
        bullets: [
          { lead: "Dev", text: "Next: upload-queue spike doc (Fri Oct 23), clickable build for Sofia (end of Oct). Blocker: device-wipe question.", cite: A.ai_dev_spike },
          { lead: "Tom", text: "Next: sign auditor engagement letter by Oct 30; policies mostly drafted. Needs a vendor inventory from every team.", cite: A.ai_tom_auditor },
          { lead: "Sofia", text: "Done: offline field study. Next: device test with six technicians, results Nov 6.", cite: A.ai_sofia_test },
          { lead: "Marcus", text: "Next: email the three blocked prospects with a \"targeting\" timeline by Oct 21.", cite: A.ai_marcus_prospects },
          { lead: "Aisha", text: "Done: churn analysis. Next: churn interview clips by Oct 22, beta list next week.", cite: A.ai_aisha_churn },
          { lead: "Lena", text: "Next: launch brief and beta criteria by Nov 3; confirm the speaking slot by mid-November.", cite: A.ai_lena_brief },
          { lead: "Maya", text: "Next: rebalanced Q1 capacity plan by Oct 23. Blocker: Android migration owner.", cite: A.ai_maya_capacity },
          { lead: "Jordan", text: "Next: decision memo today; finance approval for the auditor this week.", cite: A.ai_jordan_memo },
        ],
      },
    ],
    meddpicc: [
      { heading: "Format note", body: "Internal planning call. MEDDPICC fields are filled from the pipeline discussion (Brightline, Kessler, Orchard parent)." },
      {
        heading: "MEDDPICC",
        bullets: [
          { lead: "Metrics", text: "~$1.2M first-year ACV across three deals; Brightline ~$540K, Kessler ~$400K, Orchard parent ~$270K.", cite: A.pipeline_value },
          { lead: "Economic buyer", text: "Not discussed in this call." },
          { lead: "Decision criteria", text: "SOC 2 Type II report and SAML SSO are hard requirements for all three.", cite: A.marcus_blockers },
          { lead: "Decision process", text: "Brightline will sign on a committed date plus bridge letter; Kessler needs the report; Orchard parent unknown.", cite: A.q_report },
          { lead: "Paper process", text: "Bridge letter only valid once the observation window has started (Jan 6).", cite: A.jan6 },
          { lead: "Identify pain", text: "Enterprise security reviews return the same two red flags: no SOC 2 report, no SAML." },
          { lead: "Champion", text: "Rachel (Brightline, director of field ops) is pushing internally." },
          { lead: "Competition", text: "A competitor that already has SSO is in two of three deals.", cite: A.dis_start },
        ],
      },
    ],
  },
  actionItems: [
    { id: "a1", text: "Circulate the decision memo with both decisions and open questions", owner: "jordan", due: "2026-10-15", sourceLineId: A.ai_jordan_memo },
    { id: "a2", text: "Email Brightline, Kessler and the Orchard parent with the SSO and SOC 2 timeline (\"targeting\", not \"committed\"); copy Tom", owner: "marcus", due: "2026-10-21", sourceLineId: A.ai_marcus_prospects },
    { id: "a3", text: "Share churn-interview clips tagged \"offline\" with the team", owner: "aisha", due: "2026-10-22", sourceLineId: A.ai_aisha_churn },
    { id: "a4", text: "Write the upload-queue spike doc: last-write-wins, conflict log, battery back-off", owner: "dev", due: "2026-10-23", sourceLineId: A.ai_dev_spike },
    { id: "a5", text: "Rebalance the Q1 capacity plan: route optimization to Q2, SSO sequenced first", owner: "maya", due: "2026-10-23", sourceLineId: A.ai_maya_capacity },
    { id: "a6", text: "Book the SOC 2 Type II auditor and sign the engagement letter; confirm the Jan 6 start", owner: "tom", due: "2026-10-30", sourceLineId: A.ai_tom_auditor },
    { id: "a7", text: "Draft the Atlas 2.0 launch brief and beta criteria", owner: "lena", due: "2026-11-03", sourceLineId: A.ai_lena_brief },
    { id: "a8", text: "Run the offline device test with six technicians and share results", owner: "sofia", due: "2026-11-06", sourceLineId: A.ai_sofia_test },
  ],
  questions: [
    { id: "q1", lineId: A.q_eleven, answered: true },
    { id: "q2", lineId: A.q_crash, answered: true },
    { id: "q3", lineId: A.q_report, answered: true },
    { id: "q4", lineId: A.q_signatures, answered: true },
    { id: "q5", lineId: A.q_why_offline, answered: true },
    { id: "q6", lineId: A.q_lww, answered: true },
    { id: "q7", lineId: A.q_wipe, answered: false },
    { id: "q8", lineId: A.q_eu, answered: false },
    { id: "q9", lineId: A.q_announce, answered: true },
    { id: "q10", lineId: A.q_pricing, answered: false },
    { id: "q11", lineId: A.q_android, answered: false },
  ],
  chapters: [
    { id: "c1", title: "Kickoff & context", startLineId: A.ch_kickoff },
    { id: "c2", title: "Customer signals", startLineId: A.ch_signals },
    { id: "c3", title: "Capacity & the offline-vs-SSO debate", startLineId: A.ch_capacity },
    { id: "c4", title: "Security & SOC 2 timeline", startLineId: A.ch_security },
    { id: "c5", title: "Design & launch plan", startLineId: A.ch_launch },
    { id: "c6", title: "Owners & open questions", startLineId: A.ch_wrap },
  ],
  decisions: [
    { text: "Start the SOC 2 Type II observation window on January 6 (Tom owns). SAML SSO ships in Atlas 2.0 and lands first, in February.", lineId: A.dec1_start },
    { text: "Atlas 2.0 GA on March 24 at Field Service Connect; \"Never lose work\" ships as an Android-first beta; route optimization moves to Q2.", lineId: A.dec2_start },
  ],
  followUpEmail: {
    subject: "Atlas 2.0 planning: decisions, owners, open questions",
    body: `Hi all,

Thanks for a productive (and occasionally spirited) planning session. Here's what we agreed.

Decisions
1. SOC 2 Type II observation window starts January 6 (Tom). SAML SSO ships in Atlas 2.0 and lands first, in February.
2. Atlas 2.0 goes GA on March 24 at Field Service Connect. SSO and enterprise features are GA; "Never lose work" ships as an Android-first beta. Route optimization moves to Q2.

Owners
- Jordan: decision memo (today)
- Marcus: timeline emails to Brightline, Kessler, Orchard parent (Oct 21)
- Aisha: churn interview clips (Oct 22), beta list (next week)
- Dev: upload-queue spike doc (Oct 23), clickable build (end of Oct)
- Maya: rebalanced Q1 capacity plan (Oct 23)
- Tom: auditor booked, engagement letter signed (Oct 30)
- Lena: launch brief + beta criteria (Nov 3)
- Sofia: device test results (Nov 6)

Still open
- Base plan vs add-on for "Never lose work" (Lena)
- Owner for the legacy Android migration (Maya)
- Whether an EU region changes SOC 2 scope (Tom, with auditor)
- How many customers wipe tablets nightly (Aisha)

Design principle we agreed on: no offline mode switch. The app just saves.

Thanks,
Jordan`,
  },
  suggestedPrompts: [
    "What did we decide about SOC 2 and SSO?",
    "Why did Marcus and Maya disagree?",
    "What questions are still unanswered?",
  ],
  highlights: [
    { id: "hl-flag-insight", type: "insight", title: "17 of 25 churned accounts cite offline data loss", startLineId: A.churn_offline, endLineId: A.hl_insight_end },
    { id: "hl-flag-feedback", type: "feedback", title: "Technicians don't want an offline toggle", startLineId: A.no_toggle, endLineId: A.hl_feedback_end },
    { id: "hl-flag-objection", type: "objection", title: "\"People say a lot of things in exit interviews\"", startLineId: A.hl_objection, endLineId: A.hl_objection },
    { id: "hl-flag-tech", type: "tech_question", title: "Last-write-wins vs CRDTs for the queue", startLineId: A.q_lww, endLineId: A.hl_tech_end },
    { id: "hl-flag-action", type: "action_item", title: "Tom books the auditor by Oct 30", startLineId: A.ai_tom_auditor, endLineId: A.ai_tom_auditor, note: "Marcus is waiting on this before saying \"committed\"." },
    { id: "hl-flag-positive", type: "positive", title: "Status-pill prototype lands well", startLineId: A.hl_positive, endLineId: A.hl_positive_end },
    { id: "hl-flag-bookmark", type: "bookmark", title: "Decision 2: March 24 GA", startLineId: A.dec2_start, endLineId: A.dec_launch },
  ],
  scratchpad: `Planning notes

- NRR 94%, lowest in 6 quarters. Lead with retention.
- Offline = "never lose work", not a mode.
- @Tom confirm auditor can ask about EU residency scope by Oct 30
- @Aisha find out how many customers wipe tablets nightly by Friday

Remember: Lena needs a date before mid-Nov for the speaking slot.`,
  vocabSuggestions: [
    { from: "sock two", to: "SOC 2" },
    { from: "samel", to: "SAML" },
    { from: "see are DTs", to: "CRDTs" },
    { from: "post gress", to: "Postgres" },
    { from: "octa", to: "Okta" },
  ],
};
