#!/usr/bin/env python3
"""
validate_arch.py — assert /arch's authored lens is grounded and threads the slice's functionalities.

Run over the arch manifest before the checkpoint. Under direct-model-write (ADR 026,
standards/rules/direct-model-write.md) there is no draft tree: the lens doc (`architecture.md`)
is written straight to the live model by author-architecture-lens, and the decisions are carried
as structured data in the manifest (the keyed persist_arch.py writes them to disk only after the
gate approves). So the material-choice decisions are read from the MANIFEST here, NOT globbed off
disk — validate runs BEFORE persist in the write-then-review order.

In the spine+grounding model the architecture lens is an MD grounding doc (`architecture.md`); its
SHAPE (the Intent/Components/Stack/Vertical build sections, each substantive) is checked by
`lint_grounding.py`, and its UNDERSTANDABILITY by the content eval — both run by the play's
validate step. THIS script checks the things the manifest carries, which the prose can't enforce:

  - grounded: every component in the manifest names >=1 real source (a functionality of the
    slice — its systems — or the profile surfaces); the stack grounds on the KB or a decision.
  - hub-only: no component grounds on another realize lens.
  - decisions: a grounding flagged `material: true` names a `decision` that resolves to a
    decision record carried in the manifest.
  - coverage: the slice's functionalities (read from the slice record) are each threaded by
    at least one component — nothing shaped is left unbuilt.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_arch.py --manifest <arch-manifest.yaml> \
            --slice-file <live slice record .yaml>

Prints {ok, errors[], warnings[], counts} JSON. Exit 0 clean, 1 on violation, 2 usage.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_arch.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

OTHER_LENSES = ("quality", "ux", "agentic", "run", "measure", "marketing", "lens")


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


def collect_decisions(man, errors):
    """Decision ids from the MANIFEST (ADR 026 — decisions are manifest data pre-persist)."""
    ids = set()
    for entry in (man.get("decisions") or []):
        if not isinstance(entry, dict):
            errors.append("a manifest decision entry is not a mapping")
            continue
        rec = entry.get("decision") or entry.get("record") or {}
        dec = rec.get("decision") if isinstance(rec, dict) and "decision" in rec else rec
        dec = dec or {}
        did = dec.get("id") or entry.get("id")
        for f in ("id", "title", "reason", "status", "level"):
            val = dec.get(f) if f != "id" else did
            if _blank(val):
                errors.append(f"manifest decision {did or '<no-id>'}: missing '{f}'")
        if did:
            ids.add(did)
    return ids


def check_grounding(man, decision_ids, errors):
    """Components grounded in functionalities/surfaces; stack on KB/decision. Returns threaded funcs."""
    threaded = set()

    def walk(label, entries):
        if _blank(entries):
            errors.append(f"{label} has no grounding source")
            return
        for e in entries:
            st = (e.get("source_type") or "").strip().lower()
            if _blank(e.get("source")) or not st:
                errors.append(f"{label} has a grounding entry with no source")
                continue
            if st in OTHER_LENSES:
                errors.append(f"{label} grounds on another lens '{st}' — /arch reads the slice's "
                              f"hub + the profile, never a measure/run lens")
            elif st not in ("ice", "functionality", "surface", "profile"):
                errors.append(f"{label} source_type '{st}' is not functionality/surface/profile")
            if st in ("ice", "functionality"):
                fr = e.get("functionality_ref")
                if not _blank(fr):
                    threaded.add(fr)
            if e.get("material") is True:
                dec = e.get("decision")
                if _blank(dec):
                    errors.append(f"{label} is a material choice with no decision recorded")
                elif dec not in decision_ids:
                    errors.append(f"{label} names decision '{dec}' with no drafted record")

    for c in (man.get("components") or []):
        walk(f"component '{c.get('name', '<component>')}'", c.get("grounds"))

    stack = man.get("stack") or {}
    st = (stack.get("source_type") or "").strip().lower()
    if st not in ("kb", "decision"):
        errors.append("the stack must ground on a KB technology/architecture learning or a decision")
    if st == "decision":
        dec = stack.get("decision")
        if _blank(dec):
            errors.append("the stack has no decision recorded")
        elif dec not in decision_ids:
            errors.append(f"the stack names decision '{dec}' with no drafted record")
    return threaded


def slice_functionalities(slice_file, errors):
    if not slice_file or not os.path.isfile(slice_file):
        errors.append(f"slice record not found at {slice_file} — cannot verify coverage")
        return set()
    sl = (load(slice_file).get("slice") or {})
    return {(f or {}).get("functionality_ref") for f in (sl.get("functionalities") or [])
            if (f or {}).get("functionality_ref")}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /arch's authored lens grounding + coverage.")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--slice-file", required=True)
    args = ap.parse_args(argv)

    errors, warnings = [], []
    try:
        man = (load(args.manifest).get("arch") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}

    decision_ids = collect_decisions(man, errors)
    threaded = check_grounding(man, decision_ids, errors)
    to_cover = slice_functionalities(args.slice_file, errors)
    for fid in sorted(f for f in to_cover if f):
        if fid not in threaded:
            errors.append(f"slice functionality {fid!r} is threaded by no component")

    counts = {"manifest_components": len(man.get("components") or []), "decisions": len(decision_ids),
              "to_cover": len(to_cover), "threaded_funcs": len(threaded)}
    result = {"ok": not errors, "errors": errors, "warnings": warnings, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
