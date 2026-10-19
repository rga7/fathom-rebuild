// Quick CLI check of Ask answers: node --experimental-strip-types scripts/try-ask.ts "question" [this|mine|all] [meetingId]
import { MEETINGS, getMeeting, FLAGSHIP_ID } from "../data/index.ts";
import { ask, answerToText, type Scope } from "../lib/ask.ts";
const [q, scope = "this", id = FLAGSHIP_ID] = process.argv.slice(2);
console.log(answerToText(ask(q, scope as Scope, getMeeting(id), MEETINGS)));
