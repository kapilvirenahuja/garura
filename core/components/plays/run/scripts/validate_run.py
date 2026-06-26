#!/usr/bin/env python3
"""
validate_run.py — assert /run's draft is grounded and considers the slice's hub.

Run over the draft before the checkpoint. In the spine+grounding model the run lens is an
MD grounding doc (`run.md`); its SHAPE (Environments / Rollout / Migrations / Config & secrets
/ CI/CD, each substantive) is checked by `lint_grounding.py`, and its UNDERSTANDABILITY by the
content eval — both run by the play's validate step. THIS script checks what the manifest
carries, which the prose can't enforce:

  - grounded: every grounding entry names a real source — the slice's HUB (a functionality,
    persona, or journey), the profile, or the ARCHITECTURE lens (run reads architecture, and
    only architecture among the lenses). Never another lens (ux/agentic/quality/measure/marketing).
  - decisions: a grounding flagged `material: true` names a `decision` that resolves.
  - coverage: every functionality of the slice is considered by the run plan (each appears in
    the manifest grounds) — the run lens can't ignore part of the slice.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_run.py --draft <draft_dir> --manifest <run-manifest.yaml> \
            --slice-file <live slice record .yaml>

Prints {ok, errors[], warnings[], counts} JSON. Exit 0 clean, 1 on violation, 2 usage.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_run.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

# run reads the architecture lens; these are the lenses it must NOT ground on.
OTHER_LENSES = ("agentic", "ux", "quality", "measure", "marketing", "lens")
# allowed grounding source types for run (architecture lens included).
ALLOWED = ("profile", "ice", "functionality", "persona", "journey", "architecture")


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _blank(v):
    if v is None:
        return True
    if isinstance(v, str):
        return len(v.strip()) == 0
    if isinstance(v, (list, dict)):
        return len(v) == 0
    return False


def collect_decisions(draft_root, errors):
    ids = set()
    for d in glob.glob(os.path.join(draft_root, "**", "decisions", "*.yaml"), recursive=True):
        dec = (load(d).get("decision") or {})
        for f in ("id", "title", "reason", "status", "level"):
            if _blank(dec.get(f)):
                errors.append(f"{d}: decision missing '{f}'")
        if dec.get("id"):
            ids.add(dec["id"])
    return ids


def check_grounding(man, decision_ids, errors):
    grounded = set()
    entries = man.get("grounds")
    if _blank(entries):
        errors.append("run plan has no grounding (grounds is empty)")
        return grounded
    for e in entries:
        st = (e.get("source_type") or "").strip().lower()
        if _blank(e.get("source")) and _blank(e.get("functionality_ref")):
            errors.append("a grounding entry has no source")
            continue
        if st in OTHER_LENSES:
            errors.append(f"grounds on lens '{st}' — /run reads the hub + the architecture "
                          f"lens, never {st}")
        elif st not in ALLOWED:
            errors.append(f"source_type '{st}' is not one of {ALLOWED}")
        if st in ("ice", "functionality"):
            fr = e.get("functionality_ref")
            if not _blank(fr):
                grounded.add(fr)
        if e.get("material") is True:
            dec = e.get("decision")
            if _blank(dec):
                errors.append("a material choice has no decision recorded")
            elif dec not in decision_ids:
                errors.append(f"a material choice names decision '{dec}' with no drafted record")
    return grounded


def slice_functionalities(slice_file, errors):
    if not slice_file or not os.path.isfile(slice_file):
        errors.append(f"slice record not found at {slice_file} — cannot verify coverage")
        return set()
    sl = (load(slice_file).get("slice") or {})
    return {(f or {}).get("functionality_ref") for f in (sl.get("functionalities") or [])
            if (f or {}).get("functionality_ref")}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /run's draft grounding + coverage.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--slice-file", required=True)
    args = ap.parse_args(argv)

    draft_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(draft_root):
        sys.stderr.write(f"validate_run.py: no draft tree at {draft_root}\n")
        return 2

    errors, warnings = [], []
    decision_ids = collect_decisions(draft_root, errors)
    try:
        man = (load(args.manifest).get("run") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}

    grounded = check_grounding(man, decision_ids, errors)
    to_cover = slice_functionalities(args.slice_file, errors)
    for fid in sorted(f for f in to_cover if f):
        if fid not in grounded:
            errors.append(f"slice functionality {fid!r} is not considered by the run plan")

    counts = {"grounds": len(man.get("grounds") or []), "decisions": len(decision_ids),
              "to_cover": len(to_cover), "grounded": len(grounded)}
    result = {"ok": not errors, "errors": errors, "warnings": warnings, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
