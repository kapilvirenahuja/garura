#!/usr/bin/env python3
"""
gate_eval.py — append/read the live-eval gate ledger (#467).

One JSONL line per conditional-gate crossing. The human's real action IS the eval
verdict; this file is the write/read path every conditional play shares. Append-only:
lines are never edited — a later correction is a NEW line pointing at the one it refutes.

  append:  python3 gate_eval.py append --ledger <path> --play ux --issue 478 \
              --shape "ux:prose_edits" --predicted gate --human approved_clean \
              --ts 2026-07-04T10:00:00Z [--policy-version 3] [--refutes 12]
  tail:    python3 gate_eval.py tail --ledger <path> --shape "ux:prose_edits" [-n 5]

`--ts` is REQUIRED on append — the caller passes the run's own timestamp so the script
stays replay-deterministic (no wall-clock reads here).

human ∈ approved_clean | approved_edited | rejected | auto_pass
predicted ∈ gate | auto
"""

import argparse
import json
import os
import sys

HUMAN = {"approved_clean", "approved_edited", "rejected", "auto_pass"}
PREDICTED = {"gate", "auto"}


def fail(msg):
    sys.stderr.write(f"gate_eval.py: {msg}\n")
    sys.exit(2)


def read_ledger(path):
    if not os.path.isfile(path):
        return []
    out = []
    with open(path, encoding="utf-8") as fh:
        for i, raw in enumerate(fh, 1):
            raw = raw.strip()
            if not raw:
                continue
            try:
                rec = json.loads(raw)
                rec["_line"] = i
                out.append(rec)
            except ValueError:
                continue  # a corrupt line never breaks the ledger read
    return out


def cmd_append(args):
    if args.human not in HUMAN:
        fail(f"human must be one of {sorted(HUMAN)}")
    if args.predicted not in PREDICTED:
        fail(f"predicted must be one of {sorted(PREDICTED)}")
    if (args.human == "auto_pass") != (args.predicted == "auto") and not args.refutes:
        fail(
            "auto_pass pairs with predicted=auto (and vice versa) except on corrections"
        )
    rec = {
        "ts": args.ts,
        "play": args.play,
        "issue": args.issue,
        "shape": args.shape,
        "predicted": args.predicted,
        "human": args.human,
    }
    if args.policy_version is not None:
        rec["policy_version"] = args.policy_version
    if args.refutes is not None:
        rec["refutes"] = args.refutes
    parent = os.path.dirname(args.ledger)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(args.ledger, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(rec) + "\n")
    print(json.dumps(rec))


def cmd_tail(args):
    recs = [
        r
        for r in read_ledger(args.ledger)
        if not args.shape or r.get("shape") == args.shape
    ]
    for r in recs[-args.n :]:
        print(json.dumps(r))


def main(argv=None):
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("append")
    a.add_argument("--ledger", required=True)
    a.add_argument("--play", required=True)
    a.add_argument("--issue", required=True)
    a.add_argument("--shape", required=True)
    a.add_argument("--predicted", required=True)
    a.add_argument("--human", required=True)
    a.add_argument("--ts", required=True, help="run-provided timestamp (deterministic)")
    a.add_argument("--policy-version", type=int)
    a.add_argument("--refutes", type=int, help="ledger line this correction refutes")
    a.set_defaults(fn=cmd_append)

    t = sub.add_parser("tail")
    t.add_argument("--ledger", required=True)
    t.add_argument("--shape")
    t.add_argument("-n", type=int, default=10)
    t.set_defaults(fn=cmd_tail)

    args = ap.parse_args(argv)
    args.fn(args)


if __name__ == "__main__":
    main()
