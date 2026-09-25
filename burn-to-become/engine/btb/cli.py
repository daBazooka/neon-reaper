"""btb — the Burn to Become Field Manual in your terminal.

Log When–Then intentions, friction (what you escaped to), evidence, and failures,
then generate a weekly "receipts" report that compares what you said with what you did.

Data lives in one JSON file at $BTB_HOME/log.json (default: ~/.btb/log.json).
"""
import argparse
import json
import os
import re
import sys
from collections import Counter
from datetime import date, datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
FIELD_MANUAL = json.loads((HERE / "field_manual.json").read_text(encoding="utf-8"))

INTENT_RE = re.compile(r"^\s*(?:when|if)\s+(?P<when>.+?)\s*,?\s*(?:then\s+)?i\s+will\s+(?P<then>.+?)\s*\.?\s*$", re.I)
VOICES = [
    ("fear", "FEAR — What if this goes badly?"),
    ("ego", "EGO — What will this say about me?"),
    ("approval", "APPROVAL — What will they think?"),
    ("values", "VALUES — What matters to me even if the outcome is uncertain?"),
]


# ---------------------------------------------------------------- storage
def home() -> Path:
    return Path(os.environ.get("BTB_HOME", Path.home() / ".btb"))


def load() -> dict:
    f = home() / "log.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))
    return {"start": None, "intents": [], "friction": [], "evidence": [], "failures": [], "voices": []}


def save(db: dict) -> None:
    home().mkdir(parents=True, exist_ok=True)
    tmp = home() / "log.json.tmp"
    tmp.write_text(json.dumps(db, indent=1, ensure_ascii=False), encoding="utf-8")
    tmp.replace(home() / "log.json")


def now() -> str:
    return datetime.now().isoformat(timespec="minutes")


def ts(s: str) -> datetime:
    return datetime.fromisoformat(s)


# ---------------------------------------------------------------- field manual
def program_day(db: dict, on: date | None = None) -> int | None:
    if not db.get("start"):
        return None
    n = ((on or date.today()) - date.fromisoformat(db["start"])).days + 1
    return n if n >= 1 else None


def show_day(n: int) -> str:
    d = next((x for x in FIELD_MANUAL if x["day"] == n), None)
    if not d:
        return f"There is no Day {n}. The Field Manual runs from Day 1 to Day 30. Do not start over — continue."
    body = "\n\n".join(d["text"])
    return f"{d['week']}\nDAY {d['day']} — {d['title']}\n\n{body}"


# ---------------------------------------------------------------- commands
def cmd_start(a, db):
    db["start"] = a.date or date.today().isoformat()
    save(db)
    print(f"Started the 30 days on {db['start']}. Run `btb today` for Day 1.")


def cmd_today(a, db):
    n = program_day(db)
    if n is None:
        print("Not started. Run `btb start` (or `btb start --date YYYY-MM-DD`).")
        return
    if n > 30:
        print(f"Day {n}: the 30 days are done. Keep the evidence file, one small promise a day, and redo Day 1 and Day 24 monthly.")
        return
    print(show_day(n))


def cmd_day(a, db):
    print(show_day(a.n))


def parse_intent(text: str):
    m = INTENT_RE.match(text)
    if not m:
        raise ValueError(
            'An intention needs a trigger and an action, e.g. "When it is 7:00 and I am at my desk, I will write one page."'
        )
    return m.group("when").strip(), m.group("then").strip()


def cmd_intent(a, db):
    if a.action == "add":
        try:
            when, then = parse_intent(" ".join(a.text))
        except ValueError as e:
            sys.exit(str(e))
        iid = max((i["id"] for i in db["intents"]), default=0) + 1
        db["intents"].append({"id": iid, "when": when, "then": then, "created": now(), "status": "open"})
        save(db)
        print(f"#{iid}  WHEN {when}  →  I WILL {then}")
        if not re.search(r"\d|morning|evening|night|noon|after|before|wake|lunch|dinner|breakfast|bed|desk|home|gym|office|kitchen|work|school|class", when, re.I):
            print("   Tip: make the trigger concrete (a time or a place) so tomorrow’s you cannot negotiate with it.")
    elif a.action == "list":
        rows = [i for i in db["intents"] if a.all or i["status"] == "open"]
        if not rows:
            print("No open intentions. Add one: btb intent add \"When ..., I will ...\"")
        for i in rows:
            print(f"#{i['id']:<3} [{i['status']:^6}] WHEN {i['when']} → I WILL {i['then']}")
    else:  # kept / missed
        iid = int(a.text[0]) if a.text else sys.exit("Give the intention number, e.g. btb intent kept 3")
        it = next((i for i in db["intents"] if i["id"] == iid), None)
        if not it:
            sys.exit(f"No intention #{iid}.")
        it["status"], it["closed"] = a.action, now()
        if a.action == "missed":
            it["reason"] = a.reason or ""
        save(db)
        print(f"#{iid} marked {a.action}." + ("  Returning is the skill. Shrink it and try again." if a.action == "missed" else "  Evidence logged."))
        if a.action == "kept":
            db["evidence"].append({"ts": now(), "text": f"Kept: when {it['when']}, I {it['then']}"})
            save(db)


def cmd_friction(a, db):
    db["friction"].append({"ts": now(), "task": a.task, "escape": a.escape, "minutes": a.minutes, "note": a.note or ""})
    save(db)
    print(f"Logged: avoided “{a.task}” → escaped to “{a.escape}” ({a.minutes} min). Noticing is the first movement.")


def cmd_evidence(a, db):
    db["evidence"].append({"ts": now(), "text": " ".join(a.text)})
    save(db)
    print(f"Evidence file: {len(db['evidence'])} entries.")


def cmd_fail(a, db):
    db["failures"].append({"ts": now(), "tried": a.tried, "happened": a.happened, "learned": a.learned, "change": a.change})
    save(db)
    print(f"Failure portfolio: {len(db['failures'])} entries. You survived all of them.")


def cmd_voices(a, db):
    decision = " ".join(a.decision)
    print(f"Decision: {decision}\nAnswer each voice in one sentence.\n")
    entry = {"ts": now(), "decision": decision}
    for key, prompt in VOICES:
        entry[key] = getattr(a, key) if getattr(a, key) else input(prompt + "\n> ").strip()
    db["voices"].append(entry)
    save(db)
    print("\nLet values decide:", entry["values"] or "(empty — that is the answer to sit with)")


def window(db, days: int, end: datetime | None = None):
    end = end or datetime.now()
    start = end - timedelta(days=days)
    within = lambda x, k="ts": start <= ts(x[k]) <= end
    return {
        "start": start, "end": end,
        "intents": [i for i in db["intents"] if within(i, "created")],
        "friction": [f for f in db["friction"] if within(f)],
        "evidence": [e for e in db["evidence"] if within(e)],
        "failures": [f for f in db["failures"] if within(f)],
    }


def receipts(db: dict, days: int = 7, end: datetime | None = None) -> str:
    w = window(db, days, end)
    it = w["intents"]
    kept = [i for i in it if i["status"] == "kept"]
    missed = [i for i in it if i["status"] == "missed"]
    open_ = [i for i in it if i["status"] == "open"]
    closed = len(kept) + len(missed)
    rate = f"{100 * len(kept) // closed}%" if closed else "—"
    fr = w["friction"]
    mins = sum(f["minutes"] for f in fr)
    escapes = Counter(f["escape"].lower() for f in fr).most_common(3)
    tasks = Counter(f["task"].lower() for f in fr).most_common(3)
    hours = Counter(ts(f["ts"]).hour for f in fr).most_common(1)

    out = [f"# Receipts — {w['start']:%Y-%m-%d} to {w['end']:%Y-%m-%d}", ""]
    pd = program_day(db, w["end"].date())
    if pd:
        out += [f"Field Manual: day {min(pd, 30)} of 30." + (" (complete)" if pd > 30 else ""), ""]
    out += ["## What you said you would do",
            f"- Intentions set: {len(it)}  ·  kept {len(kept)}  ·  missed {len(missed)}  ·  still open {len(open_)}",
            f"- Keep rate (closed intentions): {rate}"]
    reasons = Counter(i.get("reason", "").lower() for i in missed if i.get("reason")).most_common(2)
    if reasons:
        out.append("- Most common reason for missing: " + "; ".join(f"“{r}” ×{c}" for r, c in reasons))
    out += ["", "## What your behavior did instead",
            f"- Avoidance episodes logged: {len(fr)}  ·  time given to escapes: {mins} min ({mins / 60:.1f} h)"]
    if escapes:
        out.append("- Top escapes: " + ", ".join(f"{e} ×{c}" for e, c in escapes))
    if tasks:
        out.append("- Most avoided: " + ", ".join(f"{t} ×{c}" for t, c in tasks))
    if hours:
        out.append(f"- Avoidance peaks around {hours[0][0]:02d}:00")
    out += ["", "## Evidence", f"- Evidence entries: {len(w['evidence'])}  ·  failures logged and survived: {len(w['failures'])}"]
    out += ["", "## The gap", gap_sentence(kept, missed, tasks, mins)]
    out += ["", "## One action for the next 24 hours", next_action(escapes, tasks, hours, missed, open_)]
    return "\n".join(out) + "\n"


def gap_sentence(kept, missed, tasks, mins):
    if tasks and mins >= 60:
        return f"Your words say “{tasks[0][0]}” matters. Your receipts show {mins} minutes spent escaping it. That gap is information, not a verdict."
    if missed and len(missed) > len(kept):
        return "You are making promises your ordinary days cannot keep yet. The fix is smaller promises, not more willpower."
    if kept:
        return "Your behavior and your words are starting to agree. Protect the pattern that made that possible."
    return "Not enough receipts yet. Log what you actually do for a few days before judging anything."


def next_action(escapes, tasks, hours, missed, open_):
    if escapes and tasks:
        h = f" at {hours[0][0]:02d}:00" if hours else ""
        return f"Tomorrow{h}, put “{escapes[0][0]}” out of reach for 45 minutes and give that time to “{tasks[0][0]}”. Log the result with `btb friction` or `btb evidence`."
    if missed:
        m = missed[-1]
        return f"Rewrite intention #{m['id']} at half the size (“I will {m['then']}” → the smallest version you would still do on a bad day) and add it again."
    if open_:
        return f"Close intention #{open_[0]['id']} today: do it, then run `btb intent kept {open_[0]['id']}`."
    return "Add one When–Then intention for tomorrow morning: btb intent add \"When ..., I will ...\""


def cmd_receipts(a, db):
    text = receipts(db, a.days)
    print(text)
    if a.save:
        d = home() / "receipts"
        d.mkdir(parents=True, exist_ok=True)
        f = d / f"receipts-{date.today().isoformat()}.md"
        f.write_text(text, encoding="utf-8")
        print(f"Saved to {f}")


def cmd_status(a, db):
    pd = program_day(db)
    open_ = sum(1 for i in db["intents"] if i["status"] == "open")
    print(f"Day: {pd if pd else 'not started'}  ·  open intentions: {open_}  ·  evidence: {len(db['evidence'])}"
          f"  ·  friction logs: {len(db['friction'])}  ·  failures survived: {len(db['failures'])}")


# ---------------------------------------------------------------- entry point
def build_parser():
    p = argparse.ArgumentParser(prog="btb", description="Burn to Become — the 30-day Field Manual in your terminal.")
    s = p.add_subparsers(dest="cmd", required=True)
    x = s.add_parser("start", help="start the 30 days"); x.add_argument("--date"); x.set_defaults(fn=cmd_start)
    s.add_parser("today", help="show today's practice").set_defaults(fn=cmd_today)
    x = s.add_parser("day", help="show any day's practice"); x.add_argument("n", type=int); x.set_defaults(fn=cmd_day)
    x = s.add_parser("intent", help="When–Then intentions: add | list | kept | missed")
    x.add_argument("action", choices=["add", "list", "kept", "missed"]); x.add_argument("text", nargs="*")
    x.add_argument("--reason"); x.add_argument("--all", action="store_true"); x.set_defaults(fn=cmd_intent)
    x = s.add_parser("friction", help="log an avoidance: the task you avoided and what you escaped to")
    x.add_argument("task"); x.add_argument("escape"); x.add_argument("--minutes", type=int, default=15); x.add_argument("--note")
    x.set_defaults(fn=cmd_friction)
    x = s.add_parser("evidence", help="add to your evidence file"); x.add_argument("text", nargs="+"); x.set_defaults(fn=cmd_evidence)
    x = s.add_parser("fail", help="add to your failure portfolio")
    for k in ("tried", "happened", "learned", "change"):
        x.add_argument("--" + k, required=True)
    x.set_defaults(fn=cmd_fail)
    x = s.add_parser("voices", help="run the Four Voices on a decision"); x.add_argument("decision", nargs="+")
    for k, _ in VOICES:
        x.add_argument("--" + k)
    x.set_defaults(fn=cmd_voices)
    x = s.add_parser("receipts", help="weekly receipts report"); x.add_argument("--days", type=int, default=7)
    x.add_argument("--save", action="store_true"); x.set_defaults(fn=cmd_receipts)
    s.add_parser("status", help="one-line summary").set_defaults(fn=cmd_status)
    return p


def main(argv=None):
    a = build_parser().parse_args(argv)
    a.fn(a, load())


if __name__ == "__main__":
    main()
