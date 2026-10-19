#!/usr/bin/env python3
"""Append prompt/final-response pairs to .agent-logs/<session>.md.

Wired to UserPromptSubmit and Stop in .claude/settings.json. Both events
deliver JSON on stdin (session_id, transcript_path, cwd, and for
UserPromptSubmit the `prompt`). Only the prompt and the final assistant text
of each turn are recorded: no thinking, no tool calls.

Entries are append-only. A turn is identified by its number; a number already
present in the log is never rewritten. Only the front-matter header is
refreshed (exchange count, last prompt time).
"""
import glob
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone

DEFAULT_MODEL = "claude-sonnet-5-5"
STOP_WAIT = 5.0  # seconds to wait for the final message on Stop
SKIP_PREFIXES = ("<local-command", "<command-name>", "<command-message>")


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.") + \
        f"{datetime.now(timezone.utc).microsecond // 1000:03d}Z"


def block_text(content):
    if isinstance(content, str):
        return content
    parts = []
    for b in content or []:
        if isinstance(b, dict) and b.get("type") == "text":
            parts.append(b.get("text", ""))
    return "\n".join(parts)


def read_turns(path):
    """Return [{prompt, prompt_ts, response, response_ts, model}] from transcript."""
    turns = []
    if not path or not os.path.exists(path):
        return turns
    model = DEFAULT_MODEL
    cur = None
    with open(path) as f:
        for line in f:
            try:
                e = json.loads(line)
            except Exception:
                continue
            t = e.get("type")
            msg = e.get("message") or {}
            if t == "user" and not e.get("isMeta"):
                c = msg.get("content")
                if isinstance(c, list) and any(
                        isinstance(b, dict) and b.get("type") == "tool_result" for b in c):
                    # tool result inside a turn: restart collecting the final text
                    if cur is not None:
                        cur["response"], cur["response_ts"], cur["ended"] = [], None, False
                    continue
                text = block_text(c)
                if not text.strip() or text.lstrip().startswith(SKIP_PREFIXES):
                    continue
                cur = {"prompt": text, "prompt_ts": e.get("timestamp"),
                       "response": [], "response_ts": None, "model": model,
                       "ended": False}
                turns.append(cur)
            elif t == "assistant" and cur is not None:
                m = msg.get("model")
                if m and not m.startswith("<"):
                    model = m
                    cur["model"] = m
                txt = block_text(msg.get("content"))
                if txt.strip():
                    cur["response"].append(txt)
                    cur["response_ts"] = e.get("timestamp")
                if txt.strip() or any(isinstance(b, dict) and b.get("type") == "tool_use"
                                      for b in msg.get("content") or []):
                    cur["ended"] = bool(txt.strip()) and msg.get("stop_reason") == "end_turn"
    for tr in turns:
        tr["response"] = "\n\n".join(tr["response"])
    return turns


def author(cwd):
    try:
        return subprocess.check_output(
            ["git", "config", "user.name"], cwd=cwd, text=True).strip() or "unknown"
    except Exception:
        return "unknown"


def session_file(logdir, sid, first_ts):
    hit = glob.glob(os.path.join(logdir, f"*_{sid}.md"))
    if hit:
        return hit[0]
    dt = datetime.strptime(first_ts[:19], "%Y-%m-%dT%H:%M:%S")
    return os.path.join(logdir, f"{dt:%Y-%m-%d_%H-%M-%S}_{sid}.md")


def entry(kind, num, sid, ts, model, body, note=""):
    return (f"[LOG_ENTRY type={kind} num={num} session={sid[:8]}]\n"
            f"timestamp: {ts}\nmodel: {model}\n{note}\n{body}\n\n\n")


def debug(root, event, payload, turns, note=""):
    """Append one line per invocation to .claude/hooks/capture-debug.log."""
    try:
        last = turns[-1] if turns else None
        found = bool(last and last["response"])
        with open(os.path.join(root, ".claude", "hooks", "capture-debug.log"), "a") as f:
            f.write(f"{now()} event={event or '?'} keys={sorted(payload)} "
                    f"transcript={payload.get('transcript_path')} turns={len(turns)} "
                    f"final_assistant_text={found} {note}\n")
    except Exception:
        pass


def main():
    payload = json.load(sys.stdin)
    event = payload.get("hook_event_name", "")
    sid = payload["session_id"]
    cwd = payload.get("cwd") or os.getcwd()
    root = os.environ.get("CLAUDE_PROJECT_DIR") or cwd
    logdir = os.path.join(root, ".agent-logs")
    os.makedirs(logdir, exist_ok=True)

    tpath = payload.get("transcript_path")
    turns = read_turns(tpath)
    waited = 0.0
    # Stop can fire before the final assistant message is flushed to the transcript.
    while event == "Stop" and not (turns and turns[-1]["ended"]) and waited < STOP_WAIT:
        time.sleep(0.25)
        waited += 0.25
        turns = read_turns(tpath)
    debug(root, event, payload, turns, f"waited={waited:.2f}s")
    live_prompt = payload.get("prompt") if event == "UserPromptSubmit" else None

    # On UserPromptSubmit the new prompt is not in the transcript yet.
    if live_prompt is not None:
        turns.append({"prompt": live_prompt, "prompt_ts": now(), "response": "",
                      "response_ts": None, "model": turns[-1]["model"] if turns else DEFAULT_MODEL,
                      "live": True})
    if not turns:
        return

    first_ts = turns[0]["prompt_ts"] or now()
    path = session_file(logdir, sid, first_ts)
    existing = open(path).read() if os.path.exists(path) else ""
    body = existing[existing.find("[LOG_ENTRY"):] if "[LOG_ENTRY" in existing else ""
    logged = {(m.group(1), int(m.group(2)))
              for m in re.finditer(r"\[LOG_ENTRY type=(PROMPT|RESPONSE) num=(\d+)", body)}

    add = ""
    for i, tr in enumerate(turns, 1):
        is_last = i == len(turns)
        late = "" if tr.get("live") else None
        if ("PROMPT", i) not in logged:
            note = "" if tr.get("live") else \
                "captured: back-filled from transcript (hook not yet active when this prompt was sent)\n"
            add += entry("PROMPT", i, sid, tr["prompt_ts"] or now(), tr["model"], tr["prompt"], note)
        # a response is final only once the turn is over: Stop event, or a later turn exists
        turn_over = event == "Stop" or not is_last
        if turn_over and tr["response"] and ("RESPONSE", i) not in logged:
            add += entry("RESPONSE", i, sid, tr["response_ts"] or now(), tr["model"], tr["response"])

    body += add
    if not body:
        return
    ptimes = re.findall(r"type=PROMPT num=\d+ session=\w+\]\ntimestamp: (\S+)", body)
    nprompts = len(ptimes)
    model = re.findall(r"^model: (\S+)", body, re.M)[0]
    proj = os.path.basename(root.rstrip("/"))
    date = (ptimes[0] if ptimes else first_ts)[:10]
    auth = author(cwd)
    header = (f"---\nsession_id: {sid}\ndate: {date}\nauthor: {auth}\nmodel: {model}\n"
              f"tool: claude-code\nproject: {proj}\ntotal_exchanges: {nprompts}\n"
              f"first_prompt_time: {ptimes[0]}\nlast_prompt_time: {ptimes[-1]}\n---\n\n"
              f"# Session Log - {date}\n\n"
              f"Session: `{sid[:8]}` | Project: `{proj}` | Author: `{auth}`\n\n---\n\n")
    with open(path, "w") as f:
        f.write(header + body)


if __name__ == "__main__":
    try:
        main()
    except Exception as ex:  # never block the session, but leave a trace
        try:
            with open(os.path.join(os.environ.get("CLAUDE_PROJECT_DIR", "."), ".agent-logs",
                                   "capture-errors.log"), "a") as f:
                f.write(f"{now()} {type(ex).__name__}: {ex}\n")
        except Exception:
            pass
