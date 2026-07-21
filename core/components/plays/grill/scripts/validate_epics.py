#!/usr/bin/env python3
"""
validate_epics.py — mechanical validation of an epic cut (spine + grounding model).

Shape of the epic.md docs is lint_grounding's job (kind `epic`); their content quality
is the eval's. THIS script does the cut-level checks lint_grounding cannot:

  - C5/F3  coverage: every functionality the slice bundles is named in >=1 epic's
           functionality_refs OR in deferrals (with a reason) — never both, never neither.
  - C8/F9  ordering: order values are unique 1..N, depends_on is acyclic, the first epic
           (order 1) has no dependencies.
  - C2/C14 each epic entry carries a user_check (distinct across epics) and a surface.
  - C12/F11 + C13/F14 (with --rounds-dir) the rounds write-gate: zero live tensions, every
           decision_question answered, and a CLOSED schema — only `tensions` /
           `decision_questions` (legacy `questions` aliased); any other top-level key fails.

Direct-model-write (ADR 026): there is no draft tree. author-epics writes each `epic.md`
straight to the live model and emits the epics-index delta as structured data in the
epics-manifest (STM, non-model). This validator reads the `epics` list and the `deferrals`
(functionality ids not cut this run) from that MANIFEST — never a draft `_spine.yaml`.

    python3 validate_epics.py --manifest <epics-manifest.yaml> --product-base <pb> \
        --slice-ref <id> [--rounds-dir <dir>] [--out <write-gate.yaml>]

Prints {ok, errors[], counts} JSON. With --out, also writes that verdict as YAML —
the machine-readable write-gate verdict (#466 Batch C): the round reports are a CLOSED
schema (C13/F14) so machine fields never go into them; the stop condition (#464) reads
this file instead (counts.live_tensions, counts.decision_questions_open, ok).
Exit 0 clean, 1 gaps, 2 usage error.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_epics.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

ALLOWED_ROUND_KEYS = {"tensions", "decision_questions", "questions"}  # questions = legacy alias


def load(path):
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def acyclic(nodes, deps):
    color = {n: 0 for n in nodes}

    def dfs(n):
        color[n] = 1
        for m in deps.get(n, []):
            if m in color and (color[m] == 1 or (color[m] == 0 and not dfs(m))):
                return False
        color[n] = 2
        return True
    return all(color[n] != 0 or dfs(n) for n in nodes)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate an epic cut.")
    ap.add_argument("--manifest", required=True,
                    help="epics-manifest.yaml (STM, non-model) — the epics-index delta + deferrals")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--slice-ref", required=True)
    ap.add_argument("--rounds-dir", default=None)
    ap.add_argument("--out", default=None,
                    help="write the verdict as YAML (the write-gate verdict the "
                         "stop condition reads)")
    args = ap.parse_args(argv)

    errors = []
    manifest = load(args.manifest)
    epics = manifest.get("epics") or []

    # the slice's functionalities (from the live spine slice record)
    live = load(os.path.join(args.product_base, "product-os", "_spine.yaml"))
    sl = next((s for s in (live.get("slices") or []) if s.get("id") == args.slice_ref), {})
    slice_funcs = set(sl.get("functionality_refs") or [])

    # deferrals — recorded as structured manifest data (a list of functionality ids)
    _def = manifest.get("deferrals") or manifest.get("functionalities") or []
    if isinstance(_def, dict):
        _def = _def.get("deferrals") or _def.get("functionalities") or []
    deferred = set(_def)

    covered = set()
    orders, user_checks = [], []
    deps = {}
    for e in epics:
        eid = e.get("id")
        covered |= set(e.get("functionality_refs") or [])
        if e.get("order") is not None:
            orders.append(e.get("order"))
        deps[eid] = list(e.get("depends_on") or [])
        if e.get("order") == 1 and deps[eid]:
            errors.append(f"first epic '{eid}' (order 1) has dependencies — must stand alone (C8/F9)")
        uc = e.get("user_check")
        if not uc:
            errors.append(f"epic '{eid}' has no user_check (C2/F1)")
        else:
            user_checks.append(uc)
        if not e.get("surface") and not e.get("surface_type"):
            errors.append(f"epic '{eid}' declares no surface (C14/F15)")

    # coverage
    for fid in slice_funcs:
        in_epic, in_def = fid in covered, fid in deferred
        if not in_epic and not in_def:
            errors.append(f"functionality '{fid}' is in no epic and not deferred (C5/F3)")
        if in_epic and in_def:
            errors.append(f"functionality '{fid}' is both cut and deferred — pick one (C5/F3)")

    # ordering
    if len(orders) != len(set(orders)):
        errors.append("epic order values are not unique (C8/F9)")
    if not acyclic(list(deps), deps):
        errors.append("epic dependencies contain a cycle (C8/F9)")
    if len(user_checks) != len(set(user_checks)):
        errors.append("two epics share a user_check — each must be distinct (C2)")

    # --- rounds write-gate (C12/F11, C13/F14) ---
    live_tensions = decision_qs = open_qs = 0
    if args.rounds_dir and os.path.isdir(args.rounds_dir):
        for rf in sorted(glob.glob(os.path.join(args.rounds_dir, "*.yaml"))):
            doc = load(rf)
            for key in doc:
                if key not in ALLOWED_ROUND_KEYS:
                    errors.append(f"{os.path.basename(rf)}: off-schema round key '{key}' "
                                  f"— closed schema fails the gate (C13/F14)")
            for t in (doc.get("tensions") or []):
                if (t.get("status") or "").strip().lower() == "live":
                    live_tensions += 1
                    errors.append(f"live tension '{t.get('tension_id')}' unresolved (C12/F11)")
            for q in (doc.get("decision_questions") or []) + (doc.get("questions") or []):
                decision_qs += 1
                if not (q.get("human_response") or {}):
                    open_qs += 1
                    errors.append(f"decision_question '{q.get('question_id')}' unanswered (C13/F12)")

    counts = {"epics": len(epics), "covered": len(covered), "deferred": len(deferred),
              "live_tensions": live_tensions, "decision_questions": decision_qs,
              "decision_questions_open": open_qs}
    verdict = {"ok": not errors, "errors": errors, "counts": counts}
    if args.out:
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as fh:
            yaml.safe_dump(verdict, fh, sort_keys=False)
    print(json.dumps(verdict, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
