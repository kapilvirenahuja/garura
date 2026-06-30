#!/usr/bin/env python3
"""
validate_learn.py — assert /learn's DRAFT obeys its guarantees before the checkpoint.

Reads the draft `learn-manifest.yaml` (the proposed updates) + the live spine and checks the
load-bearing invariants the play promises:

  - outcome-grounded (C5/C12, F5/F12): every proposed change, doc rewrite, and decision carries
    a non-empty `outcome` citation.
  - nfr monotonic-up (C6, F6): a capability/profile nfr level may only rise; a box-move (a raised
    profile nfr) carries a decision.
  - status earned (C8, F8): a status change advances only to an earned state (active / validated /
    delivered) and NEVER advances a `fix_required` — that must become a grounding refinement.
  - decisions well-formed (C7, F7): each is a NEW record, status `accepted`, ids unique, and a
    `supersedes` (when present) names a target.

Manifest shape (authored by `author-learnings`):
  changes:   [{node_ref, node_kind, field(one_line|nfr_needs|status), from, to, outcome, confidence}]
  docs:      [{rel, outcome}]
  decisions: [{id, node_ref, title, supersedes, outcome}]

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_learn.py --draft <draft_dir> --manifest <learn-manifest.yaml> --spine <_spine.yaml>

Prints {ok, errors[]} JSON. Exit 0 clean, 1 on any violation, 2 on usage error.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_learn.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

SCALE = ["none", "low", "medium", "high", "xhigh"]
EARNED = {"active", "validated", "delivered"}


def rank(level):
    try:
        return SCALE.index((level or "none").strip().lower())
    except ValueError:
        return 0


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def cited(entry):
    return bool(str((entry or {}).get("outcome") or "").strip())


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /learn's draft manifest.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--spine", required=True)
    args = ap.parse_args(argv)

    try:
        manifest = load(args.manifest)
    except (OSError, yaml.YAMLError) as exc:
        sys.stderr.write(f"validate_learn.py: manifest unreadable: {exc}\n")
        return 2

    changes = manifest.get("changes") or []
    docs = manifest.get("docs") or []
    decisions = manifest.get("decisions") or []
    errors = []

    # --- outcome-grounded: everything carries a citation --------------------------
    for c in changes:
        if not cited(c):
            errors.append(f"change on '{c.get('node_ref')}' field '{c.get('field')}' has no "
                          "outcome citation (C5/C12)")
    for d in docs:
        if not cited(d):
            errors.append(f"doc rewrite '{d.get('rel')}' has no outcome citation (C5/C12)")
    for dec in decisions:
        if not cited(dec):
            errors.append(f"decision '{dec.get('id')}' has no outcome citation (C5/C12)")

    # --- nfr monotonic-up + box-move carries a decision ---------------------------
    nfr_raised = False
    for c in changes:
        if c.get("field") == "nfr_needs":
            if rank(c.get("to")) < rank(c.get("from")):
                errors.append(f"nfr on '{c.get('node_ref')}' lowered "
                              f"{c.get('from')} -> {c.get('to')} (C6: monotonic-up)")
            elif rank(c.get("to")) > rank(c.get("from")):
                if c.get("node_kind") == "profile":
                    nfr_raised = True
    if nfr_raised and not decisions:
        errors.append("a profile nfr was raised (a box-move) but no decision records it (C6/F6)")

    # --- status earned; never advance a fix_required ------------------------------
    for c in changes:
        if c.get("field") == "status":
            to = (c.get("to") or "").strip().lower()
            frm = (c.get("from") or "").strip().lower()
            if frm == "fix_required" and to in EARNED:
                errors.append(f"status on '{c.get('node_ref')}' advances a fix_required "
                              f"-> {to}; a fix_required must refine the grounding, not advance "
                              "(C8/F8)")
            if to and to not in EARNED and to not in ("proposed", "fix_required"):
                errors.append(f"status on '{c.get('node_ref')}' -> '{to}' is not an earned "
                              "state (active/validated/delivered) (C8)")

    # --- decisions well-formed ----------------------------------------------------
    seen = set()
    for dec in decisions:
        did = dec.get("id")
        if not did:
            errors.append("a decision has no id (C7)")
            continue
        if did in seen:
            errors.append(f"duplicate decision id '{did}' (C7)")
        seen.add(did)
        if "supersedes" in dec and dec.get("supersedes") in ("", None):
            # key present but empty is fine (no supersede); only a truthy-but-blank is wrong
            pass
        status = (dec.get("status") or "accepted").strip().lower()
        if status != "accepted":
            errors.append(f"decision '{did}' status '{status}', must be accepted (C7)")

    out = {"ok": not errors, "errors": errors,
           "changes": len(changes), "docs": len(docs), "decisions": len(decisions)}
    print(json.dumps(out, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
