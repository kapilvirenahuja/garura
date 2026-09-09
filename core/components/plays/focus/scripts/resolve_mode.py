#!/usr/bin/env python3
"""
resolve_mode.py — resolve /focus's mode argument to one of three named values.

Deterministic enum resolution (C5/F5). The mode is a fixed choice, never inferred
from free text and never resolved at run time by reasoning. An unrecognised value
halts; the script never guesses.

    python3 resolve_mode.py [--mode <raw>] [--window-days 7] [--cap 10]
                            --out <path>

  --mode          raw mode argument as typed; absent or empty means the default
  --window-days   recency window for `recent` (default 7)
  --cap           maximum entries in the output list (default 10)
  --out           where to write the resolved mode record (JSON)

Prints the JSON record to stdout too. Exit 0 when the mode resolved, 2 when it
did not (the play halts and lists the valid modes — REC5).
"""
import argparse
import json
import os
import sys

MODES = {
    "today":  {"state": "open",   "label": "open work you could pick up now"},
    "review": {"state": "open",   "label": "open work already in flight"},
    "recent": {"state": "closed", "label": "issues closed inside the recency window"},
}
DEFAULT_MODE = "today"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", default="")
    ap.add_argument("--window-days", type=int, default=7)
    ap.add_argument("--cap", type=int, default=10)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    raw = (args.mode or "").strip().lower()
    mode = DEFAULT_MODE if raw == "" else raw
    valid = mode in MODES

    record = {
        "requested_mode": raw or None,
        "mode": mode if valid else None,
        "mode_valid": valid,
        "defaulted": raw == "",
        "valid_modes": sorted(MODES),
        "expected_state": MODES[mode]["state"] if valid else None,
        "label": MODES[mode]["label"] if valid else None,
        "window_days": args.window_days,
        "cap": args.cap,
    }
    if not valid:
        record["error"] = (
            "unrecognised mode %r — valid modes are: %s"
            % (raw, ", ".join(sorted(MODES)))
        )

    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(record, fh, indent=2, sort_keys=True)
        fh.write("\n")
    print(json.dumps(record, indent=2, sort_keys=True))
    return 0 if valid else 2


if __name__ == "__main__":
    sys.exit(main())
