#!/usr/bin/env python3
"""
check_stop_condition.py — evaluate a play's baked stop condition (#464).

A play ends because "done" was PROVEN, not because its step list ran out.
The proof is this script: it reads the play's compiled stop-condition
manifest (stop-condition.yaml, baked by play-creator from the ICE's
"### Done means" section) and evaluates every clause against what actually
exists on disk at close. Pure assertions — it executes nothing, so the
close gate stays instant and side-effect-free (implement's hand-built
check_done.py pattern, made play-agnostic).

Clause types (mechanical, closed set):
    artifact_exists     {path}                       — glob ok, ≥1 match
    field_equals        {file, field, equals}        — dot-path into JSON/YAML
    gate_outcomes_pass  {file}                       — run-quality-gates output: ok == true

Manifest shape (content.done is the clause list):
    schema: {name: stop-condition}
    content:
      done:
        - id: D1
          says: "the commits exist and the tree is clean"   # human sentence
          check: {type: artifact_exists, path: "...commits.yaml"}

Usage:
    python3 check_stop_condition.py --manifest <stop-condition.yaml> \
        --base <run/STM root for relative paths> --out <verdict.yaml>

Verdict: {stop_condition: held|unmet, clauses: [{id, says, status, detail}]}
Exit 0 held, 1 unmet, 2 manifest/clause error (an unevaluable clause is an
error, never a silent pass — the run-quality-gates rule, reused).
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    print("PyYAML required: pip install pyyaml", file=sys.stderr)
    sys.exit(2)


def load_doc(path):
    with open(path, "r", encoding="utf-8") as fh:
        if path.endswith(".json"):
            return json.load(fh)
        return yaml.safe_load(fh)


def dot_get(doc, field):
    cur = doc
    for part in field.split("."):
        if isinstance(cur, list):
            cur = cur[int(part)]
        elif isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return None, False
    return cur, True


def eval_clause(clause, base):
    check = clause.get("check") or {}
    ctype = check.get("type")
    try:
        if ctype == "artifact_exists":
            pattern = os.path.join(base, check["path"])
            hits = glob.glob(pattern)
            return ("held" if hits else "unmet",
                    f"{len(hits)} match(es) for {check['path']}")
        if ctype == "field_equals":
            fpath = os.path.join(base, check["file"])
            if not os.path.exists(fpath):
                return "unmet", f"file missing: {check['file']}"
            value, found = dot_get(load_doc(fpath), check["field"])
            if not found:
                return "unmet", f"field missing: {check['field']}"
            ok = value == check["equals"]
            return ("held" if ok else "unmet",
                    f"{check['field']} = {value!r} (want {check['equals']!r})")
        if ctype == "gate_outcomes_pass":
            fpath = os.path.join(base, check["file"])
            if not os.path.exists(fpath):
                return "unmet", f"gate outcomes missing: {check['file']}"
            doc = load_doc(fpath)
            ok = bool(doc.get("ok"))
            counts = doc.get("counts", {})
            return ("held" if ok else "unmet", f"gates ok={ok} counts={counts}")
        return "error", f"unknown check type: {ctype!r}"
    except Exception as exc:  # noqa: BLE001 — an unevaluable clause is an error
        return "error", f"clause evaluation failed: {exc}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--base", required=True,
                    help="root for the manifest's relative paths (the run's STM)")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    doc = load_doc(args.manifest) or {}
    clauses = (doc.get("content") or {}).get("done") or []
    if not clauses:
        verdict = {"stop_condition": "error",
                   "clauses": [],
                   "detail": "manifest has no content.done clauses"}
        code = 2
    else:
        results = []
        for c in clauses:
            status, detail = eval_clause(c, args.base)
            results.append({"id": c.get("id"), "says": c.get("says"),
                            "status": status, "detail": detail})
        if any(r["status"] == "error" for r in results):
            overall, code = "error", 2
        elif all(r["status"] == "held" for r in results):
            overall, code = "held", 0
        else:
            overall, code = "unmet", 1
        verdict = {"stop_condition": overall, "clauses": results}

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        yaml.safe_dump(verdict, fh, sort_keys=False)
    print(json.dumps(verdict, indent=2))
    sys.exit(code)


if __name__ == "__main__":
    main()
