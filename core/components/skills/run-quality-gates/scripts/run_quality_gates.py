#!/usr/bin/env python3
"""
run_quality_gates.py — execute a quality lens's binding cards (#462).

Reads the lens's machine sibling (quality-gates.yaml, schema:
standards/schemas/product-os/lens/quality-gates.yaml) and executes every
machine-owned card against the project. One normalized outcome per card:

    pass          command ran, exit 0, threshold (if any) met
    fail          command ran; non-zero exit or threshold unmet
    error         command could not run or produce a verdict (tooling present)
    missing-tool  the card's demanded tooling is absent — a FINDING, never a
                  silent pass ("a check that didn't run is not a check that
                  passed"); the build loop consumes this as provisioning work
    human         owner: human — visibly skipped; the review edge judges it

Usage:
    python3 run_quality_gates.py --gates <quality-gates.yaml> \
        --project-root <dir> --out <outcomes.json> [--provision]

--provision: when a card carries requires.install, attempt it once before
declaring missing-tool (mirrors _runner_common.ensure_tool). Default OFF —
the runner reports demands; provisioning is the build loop's decision.

Exit code: 0 all machine gates pass (human skips don't fail a run);
1 any fail/missing-tool; 2 any error. Local tools only — never git/gh/remote.
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("PyYAML required: pip install pyyaml", file=sys.stderr)
    sys.exit(2)

DEFAULT_TIMEOUT = 1800

THRESHOLD_RE = re.compile(r"^\s*(>=|<=|>|<|==)\s*([0-9.]+)\s*$")


def load_gates(path):
    with open(path, "r", encoding="utf-8") as fh:
        doc = yaml.safe_load(fh)
    gates = (doc or {}).get("content", {}).get("gates", [])
    if not isinstance(gates, list):
        raise ValueError("content.gates must be a list")
    return gates


def validate_card(card):
    """Schema policy a card must satisfy before it runs. Returns error string or None."""
    if not card.get("id"):
        return "card missing id"
    owner = card.get("owner")
    if owner == "human":
        return None if card.get("review") else f"{card['id']}: human card missing review"
    if owner != "machine":
        return f"{card.get('id')}: owner must be machine|human"
    if not card.get("command"):
        return f"{card['id']}: machine card missing command"
    req = card.get("requires") or {}
    if not req.get("tool_bins"):
        return f"{card['id']}: machine card missing requires.tool_bins"
    if card.get("measure") and not card.get("threshold"):
        return f"{card['id']}: measure without threshold"
    return None


def tool_present(card, provision, log):
    """First binary in requires.tool_bins found on PATH wins. With --provision,
    try requires.install once and re-probe (per _runner_common.ensure_tool)."""
    req = card.get("requires") or {}
    bins = req.get("tool_bins") or []
    for b in bins:
        if shutil.which(b):
            return b
    install = req.get("install")
    if provision and install:
        log.append(f"provision attempt: {install}")
        try:
            subprocess.run(install, shell=True, capture_output=True, timeout=600)
        except Exception as exc:  # noqa: BLE001 — recorded, never raised
            log.append(f"provision failed: {exc}")
        for b in bins:
            if shutil.which(b):
                return b
    return None


def read_measure(text, measure):
    """Pull the last 'measure: value' or 'measure=value' or bare '<value>%' near the
    measure name from the tool output. Card-declared measures keep this mechanical."""
    pat = re.compile(rf"{re.escape(measure)}\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)", re.I)
    hits = pat.findall(text)
    if hits:
        return float(hits[-1])
    # common fallback: 'TOTAL ... 85%' style coverage lines
    if measure.lower().startswith("coverage"):
        pct = re.findall(r"(?:TOTAL|coverage)[^\n%]*?([0-9]+(?:\.[0-9]+)?)\s*%", text, re.I)
        if pct:
            return float(pct[-1])
    return None


def threshold_holds(value, threshold):
    m = THRESHOLD_RE.match(str(threshold))
    if not m:
        return None  # unparseable threshold -> error, not a guess
    op, bound = m.group(1), float(m.group(2))
    return {"": None, ">=": value >= bound, "<=": value <= bound,
            ">": value > bound, "<": value < bound, "==": value == bound}[op]


def run_card(card, project_root, provision):
    outcome = {"id": card.get("id"), "dimension": card.get("dimension"),
               "owner": card.get("owner"), "status": None, "summary": "",
               "command": card.get("command"), "exit": None,
               "measure": card.get("measure"), "value": None,
               "threshold": card.get("threshold"),
               "requires": (card.get("requires") or {}).get("tool"), "log": []}
    err = validate_card(card)
    if err:
        outcome["status"] = "error"
        outcome["summary"] = f"invalid card: {err}"
        return outcome
    if card["owner"] == "human":
        outcome["status"] = "human"
        outcome["summary"] = f"judged at: {card['review']}"
        return outcome
    if tool_present(card, provision, outcome["log"]) is None:
        req = card.get("requires") or {}
        outcome["status"] = "missing-tool"
        outcome["summary"] = (f"demanded tooling absent: {req.get('tool')} "
                              f"(bins {req.get('tool_bins')}); "
                              "a check that didn't run is not a check that passed")
        return outcome
    try:
        proc = subprocess.run(card["command"], shell=True, cwd=project_root,
                              capture_output=True, text=True,
                              timeout=card.get("timeout", DEFAULT_TIMEOUT))
        outcome["exit"] = proc.returncode
        text = (proc.stdout or "") + (proc.stderr or "")
        outcome["log"] = outcome["log"] + text.splitlines()[-20:]
    except subprocess.TimeoutExpired:
        outcome["status"] = "error"
        outcome["summary"] = f"timeout after {card.get('timeout', DEFAULT_TIMEOUT)}s"
        return outcome
    if card.get("measure"):
        value = read_measure(text, card["measure"])
        outcome["value"] = value
        if value is None:
            outcome["status"] = "error"
            outcome["summary"] = f"measure {card['measure']} not found in output"
            return outcome
        holds = threshold_holds(value, card["threshold"])
        if holds is None:
            outcome["status"] = "error"
            outcome["summary"] = f"unparseable threshold: {card['threshold']}"
            return outcome
        outcome["status"] = "pass" if holds else "fail"
        outcome["summary"] = (f"{card['measure']}={value} "
                              f"{'meets' if holds else 'misses'} {card['threshold']}")
        return outcome
    outcome["status"] = "pass" if proc.returncode == 0 else "fail"
    outcome["summary"] = f"exit {proc.returncode}"
    return outcome


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--gates", required=True)
    ap.add_argument("--project-root", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--provision", action="store_true")
    args = ap.parse_args()

    gates = load_gates(args.gates)
    outcomes = [run_card(c, args.project_root, args.provision) for c in gates]
    counts = {}
    for o in outcomes:
        counts[o["status"]] = counts.get(o["status"], 0) + 1
    result = {"gates_file": args.gates, "project_root": args.project_root,
              "outcomes": outcomes, "counts": counts,
              "ok": all(o["status"] in ("pass", "human") for o in outcomes)}
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(result, fh, indent=2)
    print(json.dumps({"counts": counts, "ok": result["ok"], "out": args.out}, indent=2))
    if any(o["status"] == "error" for o in outcomes):
        sys.exit(2)
    sys.exit(0 if result["ok"] else 1)


if __name__ == "__main__":
    main()
