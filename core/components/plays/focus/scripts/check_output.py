#!/usr/bin/env python3
"""
check_output.py — grade /focus's output against every output rule.

The enforcer. It proves mechanically what the play promises: read-only, capped,
correctly stated for the mode, fully explained, deterministic, and honest about
an empty or partial result. Nothing here is judgment.

    python3 check_output.py --selection <path> --mode-record <path>
                            --issues <path> --issues-after <path>
                            --md <path> [--host-writes <path>]

  --issues / --issues-after  the captured issue set before and after selection;
                             identical content is the read-only proof (F1/C2)
  --host-writes              optional file listing any write verb the run issued
                             against the issue host; absent or empty means none

Prints a PASS/GAP line per check. Exit 0 when every check passes, 1 on any GAP,
2 when an input cannot be read.
"""
import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sys

WRITE_VERBS = ("create-issue", "close-issue", "comment-issue", "add-label",
               "attach-sub-issue", "create-pr", "merge-pr", "comment-pr",
               "request-changes", "update-comment", "add-reviewer")


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def parse_ts(value):
    if not value:
        return None
    text = str(value).strip().replace("Z", "+00:00")
    try:
        stamp = dt.datetime.fromisoformat(text)
    except ValueError:
        return None
    if stamp.tzinfo is None:
        stamp = stamp.replace(tzinfo=dt.timezone.utc)
    return stamp.astimezone(dt.timezone.utc)


def norm_state(value):
    """Normalize the host's state word. GitLab says `opened`; GitHub says `OPEN`."""
    state = str(value or "").strip().lower()
    return "open" if state == "opened" else state


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selection", required=True)
    ap.add_argument("--mode-record", required=True)
    ap.add_argument("--issues", required=True)
    ap.add_argument("--issues-after", required=True)
    ap.add_argument("--md", required=True)
    ap.add_argument("--kind-map", default=None,
                    help="path to the kind map, for the C11/F9 off-map guard")
    ap.add_argument("--host-writes", default=None)
    ap.add_argument("--now", default=None)
    args = ap.parse_args()

    try:
        with open(args.selection, encoding="utf-8") as fh:
            sel = json.load(fh)
        with open(args.mode_record, encoding="utf-8") as fh:
            mode_rec = json.load(fh)
        with open(args.issues, encoding="utf-8") as fh:
            capture = json.load(fh)
        md = open(args.md, encoding="utf-8").read()
    except (OSError, ValueError) as exc:
        print("cannot read inputs: %s" % exc, file=sys.stderr)
        return 2

    now = parse_ts(args.now) or dt.datetime.now(dt.timezone.utc)
    entries = sel.get("entries") or []
    mode = sel.get("mode")
    cap = int(sel.get("cap", 10))
    window = int(sel.get("window_days", 7))
    results = []

    def check(cid, ok, detail):
        results.append((cid, bool(ok), detail))

    # --- C5/F5 — the mode is one of the three, and the selection used it -----
    check("C5/F5 mode-enum",
          mode_rec.get("mode_valid") is True
          and mode in ("today", "review", "recent")
          and sel.get("mode") == mode_rec.get("mode"),
          "mode=%r valid=%r selection-matches-record=%r"
          % (mode, mode_rec.get("mode_valid"), sel.get("mode") == mode_rec.get("mode")))

    # --- C2/F1 — read only: the captured set is untouched, no write verb ------
    same = os.path.exists(args.issues_after) and sha(args.issues) == sha(args.issues_after)
    # Fail closed: a missing verb log is NOT proof of no writes. The capture step
    # must record every platform-adapter verb it invoked, one per line.
    log_present = bool(args.host_writes) and os.path.exists(args.host_writes)
    writes = []
    if log_present:
        text = open(args.host_writes, encoding="utf-8").read()
        writes = [v for v in WRITE_VERBS if v in text]
    check("C2/F1 read-only", same and log_present and not writes,
          "capture-unchanged=%r verb-log-present=%r write-verbs=%r"
          % (same, log_present, writes))

    # --- C4/F3 — the cap holds and the surplus is reported --------------------
    matched = int(sel.get("matched_count", 0))
    shown = len(entries)
    surplus_ok = sel.get("surplus_count") == max(0, matched - shown)
    reported = surplus_ok and (sel.get("surplus_count", 0) == 0
                               or str(sel["surplus_count"]) in md)
    check("C4/F3 cap+surplus", shown <= cap and shown == sel.get("shown_count") and reported,
          "shown=%d cap=%d matched=%d surplus=%r reported-in-report=%r"
          % (shown, cap, matched, sel.get("surplus_count"), reported))

    # --- C3/F2 — every entry has a number, a title and a reason ---------------
    bad = [e for e in entries
           if not isinstance(e.get("number"), int)
           or not (e.get("title") or "").strip()
           or not (e.get("reason") or "").strip()]
    rendered = all(re.search(r"#%d\b" % e["number"], md) for e in entries
                   if isinstance(e.get("number"), int))
    check("C3/F2 entry-shape",
          not bad and rendered and sel.get("entries_missing_fields") == 0,
          "malformed=%d all-numbers-rendered=%r missing_fields=%r"
          % (len(bad), rendered, sel.get("entries_missing_fields")))

    # --- C11/F9 — kind and recommendation came from the map, never invented ---
    known = set()
    map_read = False
    if args.kind_map and os.path.exists(args.kind_map):
        try:
            import yaml
            doc = yaml.safe_load(open(args.kind_map, encoding="utf-8")) or {}
            known = {r.get("command") for r in (doc.get("kinds") or []) if r.get("command")}
            valid_kinds = {r.get("kind") for r in (doc.get("kinds") or [])}
            valid_kinds.add((doc.get("fallback") or {}).get("kind"))
            map_read = True
        except Exception:
            valid_kinds = set()
    else:
        valid_kinds = set()
    off_map = [e.get("number") for e in entries
               if e.get("command") and e["command"] not in known]
    bad_kind = [e.get("number") for e in entries
                if not e.get("kind") or (valid_kinds and e["kind"] not in valid_kinds)]
    check("C11/F9 kind+recommendation",
          map_read and not off_map and not bad_kind and sel.get("entries_off_map") == 0,
          "map-read=%r off-map=%r bad-kind=%r" % (map_read, off_map, bad_kind))

    # --- C12/F10 — the cardinal rule: no table play means NO recommendation ----
    # An entry the map has no command for must carry none: no default, no generic
    # pointer, no substitute play name. Silence is the correct answer, and the count
    # of such entries must be reported so the gap stays visible.
    unbacked = [e.get("number") for e in entries
                if not e.get("command") and e.get("recommendation")]
    named_play = [e.get("number") for e in entries
                  if not e.get("command")
                  and re.search(r"/[a-z][a-z0-9-]{2,}", str(e.get("recommendation") or ""))]
    blanks = [e for e in entries if not e.get("recommendation")]
    counted = sel.get("entries_without_recommendation") == len(blanks)
    surfaced = (not blanks) or (str(len(blanks)) in md)
    check("C12/F10 no-unbacked-recommendation",
          not unbacked and not named_play and counted and surfaced,
          "recommendation-without-a-table-play=%r names-a-play-anyway=%r "
          "count-correct=%r gap-stated-in-report=%r"
          % (unbacked, named_play, counted, surfaced))

    # --- C6/F4 — every entry is in the right state for its mode ---------------
    wrong = []
    for e in entries:
        state = norm_state(e.get("state"))
        if mode in ("today", "review"):
            if state != "open":
                wrong.append(e.get("number"))
        elif mode == "recent":
            closed = parse_ts(e.get("closed_at"))
            age = (now - closed).days if closed else None
            if state != "closed" or age is None or age > window or age < 0:
                wrong.append(e.get("number"))
    check("C6/F4 state-matches-mode", not wrong,
          "wrong-state entries=%r window=%d" % (wrong, window))

    # --- C7 — selection is deterministic over the captured set ----------------
    order = [e.get("number") for e in entries]
    check("C7 deterministic-order",
          len(order) == len(set(order)) and all(isinstance(n, int) for n in order),
          "order=%r (total order, no duplicates)" % order)

    # --- C8/F6 — an empty result says so; a partial capture never renders -----
    empty_ok = True
    if shown == 0:
        empty_ok = bool(sel.get("empty")) and ("Nothing matched" in md)
    check("C8 empty-is-explicit", empty_ok,
          "shown=%d empty-flag=%r message-present=%r"
          % (shown, sel.get("empty"), "Nothing matched" in md))

    check("F6 capture-complete",
          bool(sel.get("capture_complete")) and bool(capture.get("capture_complete")),
          "capture_complete=%r" % sel.get("capture_complete"))

    # --- C1 — nothing outside the captured issue set reached the output -------
    captured_numbers = {i.get("number") for i in capture.get("issues") or []}
    strays = [n for n in order if n not in captured_numbers]
    check("C1 issues-only", not strays,
          "entries not present in the captured set=%r" % strays)

    gaps = 0
    for cid, ok, detail in results:
        print("%-28s %s  %s" % (cid, "PASS" if ok else "GAP ", detail))
        gaps += 0 if ok else 1
    print("---\n%d check(s), %d gap(s)" % (len(results), gaps))
    return 0 if gaps == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
