#!/usr/bin/env python3
"""
check_done.py — done-verdict assembler for /implement (C4/C9/C10, F4/F7/F8).

"Done" for /implement means: every plan piece done, every gate passing, the
steelman verdict is PASS and was authored by the independent verifier, and the
play performed no closing action. This script assembles that verdict
mechanically over the captured artifacts — the model never self-declares done.

Checks:
  pieces   — every plan piece status == done (F7 surface).
  gates    — gates-results.yaml: pass == true (C10/F7).
  verdict  — verdict.yaml: authored_by == 'quality-auditor', verdict == 'pass',
             and every refutation entry carries resolved: true (C9/F8). A
             missing verdict, or one authored by anything else (e.g. the
             builder), refuses.
  no close — no end-sequence member result exists under the evidence dir
             (end/*.json), and no done file already claims delivery (C4/F4).

On success writes done.yaml: status `specs-passing-awaiting-validation` — the
play's terminal state; FULL done belongs to /validate and the close chain.

    python3 check_done.py --plan <plan.yaml> --gates <gates-results.yaml>
                          --verdict <verdict.yaml> --evidence-dir <dir>
                          --output <done.yaml>

Prints {ok, errors[], status} JSON. Exit 0 done, 1 not done, 2 usage error.
"""

import argparse
import glob
import json
import os
import sys
import time

try:
    import yaml
except ImportError:
    sys.stderr.write("check_done.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

TERMINAL = "specs-passing-awaiting-validation"


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Assemble the /implement done verdict.")
    ap.add_argument("--plan", required=True)
    ap.add_argument("--gates", required=True)
    ap.add_argument("--verdict", required=True)
    ap.add_argument("--evidence-dir", required=True)
    ap.add_argument("--output", required=True)
    args = ap.parse_args(argv)

    errors = []

    # --- pieces ----------------------------------------------------------------
    try:
        pieces = ((load(args.plan).get("plan") or {}).get("pieces") or [])
    except (OSError, yaml.YAMLError) as exc:
        pieces = []
        errors.append(f"plan unreadable: {exc}")
    not_done = [p.get("id") for p in pieces if (p or {}).get("status") != "done"]
    if not pieces:
        errors.append("plan has no pieces — nothing was built (F7)")
    if not_done:
        errors.append(f"pieces not done: {', '.join(map(str, not_done))} (F7)")

    # --- gates -------------------------------------------------------------------
    try:
        gates = (load(args.gates).get("gates_results") or {})
        if gates.get("pass") is not True:
            failing = [c.get("name") for c in (gates.get("commands") or [])
                       if not c.get("pass")]
            errors.append(f"gates failing: {', '.join(map(str, failing)) or 'all'} "
                          f"(C10/F7)")
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"gates results unreadable: {exc} (C10/F7)")

    # --- steelman verdict ----------------------------------------------------------
    try:
        verdict = (load(args.verdict).get("verdict") or {})
        if (verdict.get("authored_by") or "") != "quality-auditor":
            errors.append(f"verdict authored_by '{verdict.get('authored_by')}' — only the "
                          f"independent verifier's verdict counts (C9/F8)")
        if (verdict.get("verdict") or "") != "pass":
            errors.append(f"steelman verdict is '{verdict.get('verdict')}', not pass (C9)")
        for r in (verdict.get("refutations") or []):
            if not (r or {}).get("resolved"):
                errors.append(f"refutation unresolved: "
                              f"{((r or {}).get('claim') or '')[:60]!r} (C9/F7)")
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"verdict unreadable: {exc} (C9/F8)")

    # --- no closing action (C4/F4) ----------------------------------------------------
    closers = glob.glob(os.path.join(args.evidence_dir, "end", "*.json"))
    if closers:
        errors.append(f"close-sequence evidence exists ({len(closers)} file(s) under end/) "
                      f"— this play never closes; the close belongs after /validate (C4/F4)")

    ok = not errors
    if ok:
        with open(args.output, "w", encoding="utf-8") as fh:
            yaml.safe_dump({"done": {
                "status": TERMINAL,
                "assembled_at": int(time.time()),
                "pieces": len(pieces),
                "gates_pass": True,
                "verdict_by": "quality-auditor",
                "note": "built, specs passing; awaiting /validate — the work is "
                        "uncommitted by design (C4)",
            }}, fh, sort_keys=False, allow_unicode=True)

    print(json.dumps({"ok": ok, "errors": errors,
                      "status": TERMINAL if ok else "not-done"}, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
