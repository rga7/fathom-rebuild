// Scripted transcripts for simulated capture. Each is short, hand-written and fixed: the
// "captured" call is not generated from anything the viewer says. Summaries, action items,
// questions and chapters are precomputed here and point at lines by tag, so every timestamp
// is read from the transcript line it cites.
import type { MeetingKind, PersonId } from "../data/types.ts";
import type { CaptureKind } from "./calendar.ts";

/** [speaker, text, optional tag] */
export type ScriptLine = [PersonId, string, string?];

export const MEDDPICC_FIELDS = ["Metrics", "Economic buyer", "Decision criteria", "Decision process", "Paper process", "Identify pain", "Champion", "Competition"] as const;
export type MeddField = (typeof MEDDPICC_FIELDS)[number];

export interface CaptureScript {
  kind: CaptureKind;
  meetingKind: MeetingKind;
  purpose: string;
  snippet: string;
  lines: ScriptLine[];
  takeaways: { text: string; tag: string }[];
  actions: { text: string; owner: PersonId; tag: string; days: number }[];
  questions: { tag: string; answered: boolean }[];
  chapters: { title: string; tag: string }[];
  decisions?: { text: string; tag: string }[];
  prompts: [string, string, string];
  email: { subject: string; body: string };
  meddpicc?: Partial<Record<MeddField, { text: string; tag: string }>>;
}

const standup: CaptureScript = {
  kind: "standup",
  meetingKind: "standup",
  purpose: "Daily engineering standup for the Atlas team.",
  snippet: "Status pill is done behind a flag; audit logging shipped for work orders. Ben is blocked on the staging Postgres upgrade (Dev finishing by noon). Nobody has the nightly device-wipe numbers yet.",
  lines: [
    ["maya", "Morning everyone. Quick round, then we're out. Priya, you first.", "first"],
    ["priya", "Yesterday I finished the sync status pill behind a feature flag. Today I'm wiring it to the fake offline toggle so Sofia can test it.", "priya_today"],
    ["priya", "No blockers, except I still need the warning state colors from design."],
    ["maya", "Jordan, can you chase Sofia on those?", "q_chase"],
    ["jordan", "Yes, I'll get Priya the warning tokens by lunch.", "ai_tokens"],
    ["maya", "Thanks. Ben?"],
    ["ben", "I shipped audit logging to the work order service. The photo service is next, then auth.", "ben_update"],
    ["ben", "One blocker. Staging is still on the old Postgres, so I can't run the migration tests.", "ben_block"],
    ["dev", "That one's mine. I'll finish the staging upgrade before noon.", "ai_staging"],
    ["ben", "Perfect, that unblocks me."],
    ["maya", "Dev, what about the spike doc?"],
    ["dev", "About seventy percent done. The conflict section is written: last write wins, plus a conflict log.", "dev_update"],
    ["dev", "The device wipe section is a placeholder. Does anyone know how many customers wipe their tablets every night?", "q_wipe"],
    ["maya", "No idea. Aisha might."],
    ["jordan", "I'll ask her and post the answer in the channel.", "ai_wipe"],
    ["maya", "Great. Anything else?"],
    ["priya", "Should we demo the status pill in Thursday's review?", "q_demo"],
    ["maya", "Yes, as long as the toggle works by Wednesday."],
    ["jordan", "One more thing. Orchard is asking about the drafts fix again."],
    ["maya", "Okay, I'll check where it sits in the queue and tell you after standup.", "ai_drafts"],
    ["maya", "That's it. Thanks, all."],
  ],
  takeaways: [
    { text: "Sync status pill is finished behind a feature flag; Priya is wiring it to the fake offline toggle for Sofia's test.", tag: "priya_today" },
    { text: "Audit logging shipped to the work order service; photo service and auth are next.", tag: "ben_update" },
    { text: "Ben is blocked by the staging Postgres version; Dev will finish the upgrade before noon.", tag: "ben_block" },
    { text: "Spike doc is about 70% done; the device wipe section waits on nightly wipe numbers that nobody had.", tag: "dev_update" },
  ],
  actions: [
    { text: "Get Priya the warning state design tokens by lunch", owner: "jordan", tag: "ai_tokens", days: 0 },
    { text: "Finish the staging Postgres upgrade before noon", owner: "dev", tag: "ai_staging", days: 0 },
    { text: "Ask Aisha how many customers wipe tablets nightly and post it in the channel", owner: "jordan", tag: "ai_wipe", days: 1 },
    { text: "Check where the Orchard drafts fix sits in the queue and tell Jordan", owner: "maya", tag: "ai_drafts", days: 0 },
  ],
  questions: [
    { tag: "q_chase", answered: true },
    { tag: "q_wipe", answered: false },
    { tag: "q_demo", answered: true },
  ],
  chapters: [
    { title: "Frontend and design", tag: "first" },
    { title: "Backend and staging", tag: "ben_update" },
    { title: "Spike doc and open items", tag: "dev_update" },
  ],
  prompts: ["What is Ben blocked on?", "Who owns the warning tokens?", "What is still unanswered?"],
  email: {
    subject: "Standup notes",
    body: "Hi team,\n\nQuick recap from standup:\n\n- Status pill is done behind a flag.\n- Audit logging shipped for work orders.\n- Dev is finishing the staging Postgres upgrade before noon.\n- Open: nightly device wipe numbers.\n\nThanks,\nJordan",
  },
};

const oneOnOne: CaptureScript = {
  kind: "one_on_one",
  meetingKind: "one_on_one",
  purpose: "Weekly 1:1 between Jordan and Maya.",
  snippet: "Q2 priorities are down to three; a second sync engineer is wanted but not yet funded. Maya's on-call load is manageable but uneven. Jordan owes a revised priority list by Friday.",
  lines: [
    ["jordan", "Thanks for making time. I'd like to start with Q2 priorities, then hiring, then how you're doing.", "first"],
    ["maya", "Sounds good. I think we're trying to do five things and we can only do three well."],
    ["jordan", "Agreed. My three are offline-first, audit logging and the SSO groundwork.", "prio"],
    ["maya", "Then the dashboard rework and the CSV export both slip. I can live with that if Marcus can."],
    ["jordan", "I'll talk to Marcus. Let me send you a revised priority list by Friday.", "ai_list"],
    ["maya", "That would help. I also want to raise hiring."],
    ["maya", "Dev is carrying the whole sync engine. We need a second sync engineer.", "hiring"],
    ["jordan", "I agree. Can we afford a second engineer this half?", "q_afford"],
    ["maya", "I don't know yet. Finance signs off on the plan in two weeks."],
    ["jordan", "Then let's prepare the case now. Can you draft the job description?", "q_jd"],
    ["maya", "Yes, I'll have a draft by Wednesday next week.", "ai_jd"],
    ["jordan", "Great. Now, how is on-call load feeling?", "q_oncall"],
    ["maya", "Manageable, but it's uneven. Ben took most of last month."],
    ["jordan", "Let's review the rotation together and make it fairer.", "oncall"],
    ["maya", "Please. Can we do that before the end of the month?", "q_month"],
    ["jordan", "I'll set up a rotation review for next week.", "ai_rotation"],
    ["maya", "Good. One more thing: I liked the decision memo format. Short and clear."],
    ["jordan", "Thanks. I'll keep doing it that way."],
    ["maya", "That's all from me."],
    ["jordan", "Same. Thanks, Maya."],
  ],
  takeaways: [
    { text: "Q2 narrowed to three priorities: offline-first, audit logging and SSO groundwork. Dashboard rework and CSV export slip.", tag: "prio" },
    { text: "Maya wants a second sync engineer because Dev carries the whole sync engine; funding is not confirmed until finance signs off in two weeks.", tag: "hiring" },
    { text: "On-call load is manageable but uneven; a rotation review is planned.", tag: "oncall" },
  ],
  actions: [
    { text: "Send Maya a revised Q2 priority list", owner: "jordan", tag: "ai_list", days: 4 },
    { text: "Draft the second sync engineer job description", owner: "maya", tag: "ai_jd", days: 9 },
    { text: "Set up an on-call rotation review", owner: "jordan", tag: "ai_rotation", days: 7 },
  ],
  questions: [
    { tag: "q_afford", answered: false },
    { tag: "q_jd", answered: true },
    { tag: "q_oncall", answered: true },
    { tag: "q_month", answered: true },
  ],
  chapters: [
    { title: "Q2 priorities", tag: "first" },
    { title: "Hiring", tag: "hiring" },
    { title: "On-call and feedback", tag: "q_oncall" },
  ],
  prompts: ["What are my action items?", "What did we say about hiring?", "What is still unanswered?"],
  email: {
    subject: "Notes from our 1:1",
    body: "Hi Maya,\n\nThanks for the conversation. My follow-ups:\n\n- Send you the revised Q2 priority list by Friday.\n- Set up the on-call rotation review.\n\nYours: draft the sync engineer job description.\n\nJordan",
  },
};

const sales: CaptureScript = {
  kind: "sales",
  meetingKind: "sales_discovery",
  purpose: "Discovery call with Kessler Field Services about offline-first work orders for field technicians.",
  snippet: "Kessler loses work in dead zones and reworks about 12% of work orders at roughly $220 each. Victor signs off on budget; a six-week pilot with ten technicians is proposed. A SOC 2 report is the main gate.",
  lines: [
    ["marcus", "Thanks for joining, Victor and Claire. Jordan and I would like to understand how your technicians work today.", "first"],
    ["victor", "We have about forty technicians, many in rural areas. Coverage drops constantly, and they lose the forms they've filled in.", "pain"],
    ["jordan", "What does that cost you today?", "q_cost"],
    ["victor", "About twelve percent of work orders get redone. Each one costs us around two hundred twenty dollars.", "metric"],
    ["claire", "And the techs hate it. They've started photographing paper forms as a backup.", "champion"],
    ["marcus", "What are you using right now?", "q_using"],
    ["claire", "A generic forms app. It works when there's signal, and that's about it.", "competition"],
    ["marcus", "Who decides on a purchase like this?", "q_decide"],
    ["victor", "I sign off on the budget. Our IT director reviews security before anything touches field devices.", "buyer"],
    ["jordan", "What would the security review need from us?", "q_sec"],
    ["victor", "A SOC 2 report and our security questionnaire. Without those it doesn't move.", "criteria"],
    ["jordan", "Do you want a SOC 2 Type II? We have Type I today, and the Type II audit window opens in Q1.", "soc"],
    ["victor", "Type I is fine for a pilot. We'd want Type II before a full rollout."],
    ["marcus", "Then here's a proposal: a six week pilot with ten technicians, then a review with you and your IT director.", "process"],
    ["victor", "That works. Claire, can you pick the ten?"],
    ["claire", "Yes, I'll send you the list next week.", "ai_list"],
    ["claire", "Can the pilot include our Texas crews? They have the worst coverage.", "q_texas"],
    ["marcus", "Probably, but let me confirm with engineering first."],
    ["marcus", "I'll send the pilot proposal and pricing by Friday.", "ai_proposal"],
    ["jordan", "And I'll send the security questionnaire and our SOC 2 summary once we have an NDA.", "ai_sec"],
    ["victor", "Perfect. Let's talk after you've sent those."],
  ],
  takeaways: [
    { text: "Kessler's field technicians lose forms in dead zones; about 12% of work orders are redone at roughly $220 each.", tag: "metric" },
    { text: "Victor signs off on budget; their IT director reviews security first, needing a SOC 2 report and a questionnaire.", tag: "buyer" },
    { text: "Type I is acceptable for a pilot; Type II (audit window opens in Q1) is wanted before full rollout.", tag: "soc" },
    { text: "Proposed a six-week pilot with ten technicians, then a review with Victor and the IT director.", tag: "process" },
  ],
  actions: [
    { text: "Send the pilot proposal and pricing", owner: "marcus", tag: "ai_proposal", days: 4 },
    { text: "Send the security questionnaire and SOC 2 summary once an NDA is in place", owner: "jordan", tag: "ai_sec", days: 7 },
    { text: "Send the list of ten pilot technicians", owner: "claire", tag: "ai_list", days: 7 },
  ],
  questions: [
    { tag: "q_cost", answered: true },
    { tag: "q_using", answered: true },
    { tag: "q_decide", answered: true },
    { tag: "q_sec", answered: true },
    { tag: "q_texas", answered: false },
  ],
  chapters: [
    { title: "Current pain", tag: "first" },
    { title: "Buying process", tag: "q_decide" },
    { title: "Pilot proposal", tag: "process" },
  ],
  prompts: ["What did they say about budget?", "What does Kessler need for security review?", "What are the next steps?"],
  email: {
    subject: "Next steps after our call",
    body: "Hi Victor and Claire,\n\nThanks for the conversation. Next steps:\n\n- Marcus sends the pilot proposal and pricing by Friday.\n- I send the security questionnaire and SOC 2 summary once we have an NDA.\n- Claire sends the list of ten pilot technicians next week.\n\nBest,\nJordan",
  },
  meddpicc: {
    Metrics: { text: "About 12% of work orders redone, roughly $220 each.", tag: "metric" },
    "Economic buyer": { text: "Victor (VP Operations) signs off on budget.", tag: "buyer" },
    "Decision criteria": { text: "SOC 2 report and the security questionnaire.", tag: "criteria" },
    "Decision process": { text: "Six-week pilot with ten technicians, then a review with Victor and the IT director.", tag: "process" },
    "Paper process": { text: "Security questionnaire; NDA before the SOC 2 summary is shared.", tag: "ai_sec" },
    "Identify pain": { text: "Technicians lose forms in dead zones and photograph paper as a backup.", tag: "pain" },
    Champion: { text: "Claire, who is picking the pilot technicians.", tag: "champion" },
    Competition: { text: "A generic forms app that only works with signal.", tag: "competition" },
  },
};

const customer: CaptureScript = {
  kind: "customer",
  meetingKind: "customer_call",
  purpose: "Check-in with Orchard Health on the drafts fix and dispatcher feedback.",
  snippet: "The drafts fix starts Tuesday with a beta next week and production the week after. Hana's dispatchers find the status pill confusing; bulk reassign is requested but unanswered.",
  lines: [
    ["aisha", "Thanks for joining, Greg and Hana. I'd like to cover the drafts fix first, then your feedback.", "first"],
    ["greg", "Please do. Our technicians are still losing drafts on the iOS app, and it's been three weeks.", "pain"],
    ["jordan", "I know, and I'm sorry. The fix starts on Tuesday."],
    ["greg", "When will it be in production?", "q_when"],
    ["jordan", "A beta next week, then production the week after.", "timeline"],
    ["greg", "Okay. Can Hana's team be in the beta?", "q_beta"],
    ["aisha", "Absolutely. I'll set up onboarding for them.", "ai_onboard"],
    ["hana", "Thank you. Now, the dispatch side. The sync status pill is confusing for my dispatchers.", "feedback"],
    ["hana", "They see 'pending' and assume the job is lost.", "hana_pending"],
    ["jordan", "That's useful. We're changing the wording to 'saved on device'.", "ai_wording"],
    ["hana", "That would help a lot. Can dispatchers bulk reassign jobs?", "q_bulk"],
    ["jordan", "Not today. I'd like to hear how you'd use it."],
    ["hana", "Mornings, when a tech calls in sick. We move twenty jobs by hand."],
    ["greg", "I can send you examples of the lost drafts, if that helps.", "ai_examples"],
    ["jordan", "Yes please, with timestamps if you have them."],
    ["aisha", "Anything else before we wrap?"],
    ["greg", "No, that covers it."],
    ["aisha", "Great. I'll follow up with onboarding details this week."],
  ],
  takeaways: [
    { text: "Orchard's iOS technicians are still losing drafts; the fix starts Tuesday, with a beta next week and production the week after.", tag: "timeline" },
    { text: "Hana's team will join the beta; Aisha is setting up onboarding.", tag: "ai_onboard" },
    { text: "Dispatchers read 'pending' as a lost job; wording changes to 'saved on device'.", tag: "hana_pending" },
    { text: "Hana asked for bulk reassign (about twenty jobs by hand on sick-call mornings); not available today.", tag: "q_bulk" },
  ],
  actions: [
    { text: "Set up beta onboarding for Hana's dispatch team", owner: "aisha", tag: "ai_onboard", days: 5 },
    { text: "Change the status pill wording from 'pending' to 'saved on device'", owner: "jordan", tag: "ai_wording", days: 10 },
    { text: "Send examples of lost drafts with timestamps", owner: "greg", tag: "ai_examples", days: 3 },
  ],
  questions: [
    { tag: "q_when", answered: true },
    { tag: "q_beta", answered: true },
    { tag: "q_bulk", answered: false },
  ],
  chapters: [
    { title: "Drafts fix", tag: "first" },
    { title: "Dispatcher feedback", tag: "feedback" },
  ],
  prompts: ["When is the drafts fix in production?", "What did Hana ask for?", "What are my action items?"],
  email: {
    subject: "Following up on today's check-in",
    body: "Hi Greg and Hana,\n\nThanks for the time today.\n\n- Drafts fix: beta next week, production the week after.\n- Aisha will set up beta onboarding for Hana's team.\n- We're changing 'pending' to 'saved on device'.\n- Greg, thanks for sending examples of the lost drafts.\n\nBest,\nJordan",
  },
};

const planning: CaptureScript = {
  kind: "planning",
  meetingKind: "planning",
  purpose: "Q2 planning for Atlas with product, engineering, design, sales, customer success, security and marketing.",
  snippet: "The team agreed to ship offline-first v1 with last-write-wins and to defer SAML SSO to Q3 with a written SOC 2 plan instead. Marcus pushed back on SSO; the question of Q3 SSO scope stays open.",
  lines: [
    ["jordan", "Thanks everyone. Goal for today: leave with three Q2 priorities and an owner for each.", "first"],
    ["maya", "From engineering: offline-first is the foundation. Everything else depends on it.", "eng"],
    ["dev", "I'd propose last write wins for v1, with a conflict log so we can see what was overwritten.", "dev_lww"],
    ["sofia", "From design, that's fine if the user can see when something was saved only on the device."],
    ["marcus", "Sales needs SSO. Two enterprise deals are waiting on SAML.", "sso_ask"],
    ["maya", "SAML is about two engineer-months. We can't do it and offline-first in one quarter.", "sso_cost"],
    ["marcus", "Then we lose those deals.", "disagree"],
    ["tom", "Not necessarily. What the buyers really need is a security story. A SOC 2 plan in writing might unblock them.", "tom_plan"],
    ["aisha", "Customers are asking about SOC 2 more than SSO, honestly."],
    ["marcus", "Fine. If the plan is in writing by end of month, I can take that to both."],
    ["jordan", "So the proposal: offline-first v1 with last write wins, SAML deferred to Q3, SOC 2 plan in writing.", "decision1"],
    ["maya", "I'm good with that."],
    ["lena", "Marketing question: can we say 'works offline' in the launch announcement?", "q_claim"],
    ["dev", "Only if we call out last write wins. Otherwise people will assume merging."],
    ["lena", "Understood. I'll draft the copy and have Dev review it.", "ai_copy"],
    ["jordan", "Second decision: we won't build the dashboard rework this quarter.", "decision2"],
    ["sofia", "That's a relief. I'll use the time on the offline states instead."],
    ["tom", "I'll write the SOC 2 plan and send it to Marcus by the end of the month.", "ai_soc"],
    ["aisha", "Who tells Brightline about the SSO timing?", "q_brightline"],
    ["marcus", "I will, once the plan is out.", "ai_brightline"],
    ["jordan", "Last thing. Do we know how many customers wipe their tablets nightly?", "q_wipe"],
    ["dev", "No. I need that number for the sync design."],
    ["aisha", "I'll pull it from support data.", "ai_wipe"],
    ["jordan", "Great. I'll send the decision memo today.", "ai_memo"],
  ],
  takeaways: [
    { text: "Offline-first is the Q2 foundation; v1 uses last write wins with a conflict log.", tag: "dev_lww" },
    { text: "SAML SSO costs about two engineer-months and cannot ship alongside offline-first; Marcus worried about two waiting enterprise deals.", tag: "sso_cost" },
    { text: "Tom proposed a written SOC 2 plan to unblock buyers; Marcus accepted if it is ready by end of month.", tag: "tom_plan" },
    { text: "Marketing may say 'works offline' only with last write wins called out.", tag: "q_claim" },
  ],
  decisions: [
    { text: "Ship offline-first v1 with last write wins; defer SAML SSO to Q3 and provide a written SOC 2 plan.", tag: "decision1" },
    { text: "The dashboard rework is not built this quarter.", tag: "decision2" },
  ],
  actions: [
    { text: "Draft the launch copy and have Dev review it", owner: "lena", tag: "ai_copy", days: 7 },
    { text: "Write the SOC 2 plan and send it to Marcus", owner: "tom", tag: "ai_soc", days: 12 },
    { text: "Tell Brightline about the SSO timing once the plan is out", owner: "marcus", tag: "ai_brightline", days: 14 },
    { text: "Pull the nightly tablet wipe numbers from support data", owner: "aisha", tag: "ai_wipe", days: 5 },
    { text: "Send the decision memo", owner: "jordan", tag: "ai_memo", days: 0 },
  ],
  questions: [
    { tag: "q_claim", answered: true },
    { tag: "q_brightline", answered: true },
    { tag: "q_wipe", answered: false },
  ],
  chapters: [
    { title: "Priorities and offline-first", tag: "first" },
    { title: "SSO versus SOC 2", tag: "sso_ask" },
    { title: "Decisions and owners", tag: "decision1" },
  ],
  prompts: ["What did we decide about SSO?", "Who owns the SOC 2 plan?", "What is still unanswered?"],
  email: {
    subject: "Q2 planning: decisions and owners",
    body: "Hi all,\n\nDecisions:\n\n- Ship offline-first v1 with last write wins.\n- Defer SAML SSO to Q3 and provide a written SOC 2 plan.\n- No dashboard rework this quarter.\n\nOwners: Lena (launch copy), Tom (SOC 2 plan), Marcus (Brightline), Aisha (wipe numbers).\n\nJordan",
  },
};

export const CAPTURE_SCRIPTS: Record<CaptureKind, CaptureScript> = {
  standup,
  one_on_one: oneOnOne,
  sales,
  customer,
  planning,
};
