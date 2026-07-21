#!/usr/bin/env python3
"""
validate_ux.py — assert /ux's lens is grounded and covers the slice's functionalities.

Run over the manifest before the checkpoint (direct-model-write, ADR 026). The ux lens is an
MD grounding doc (`ux.md`) written straight to the live model; its SHAPE (the
Intent/Screens/States/Visual core sections, each substantive) is checked by
`lint_grounding.py`, and its UNDERSTANDABILITY by the content eval — both run by the play's
validate step. THIS script checks the things the manifest carries, which the prose can't
enforce:

  - C4/F4    grounded: every screen in the manifest names >=1 real source (a functionality of
             the slice, or a persona/journey); the visual core grounds on the KB or a decision.
  - C7/F7    hub-only: no screen grounds on another lens (quality/agentic/architecture/run/...).
  - C8/F8    decisions: a grounding flagged `material: true` names a `decision` that resolves —
             either the manifest's `decision_delta` (the decision the keyed persist will write)
             or a decision already on the live model (a reused product/slice decision).
  - C6/F6    coverage: the slice's functionalities (read from the slice record) are each
             grounded by at least one screen — nothing shaped is left unvisualized.

There is NO draft tree: the visual-core decision is carried in the manifest as `decision_delta`
until the keyed persist (`persist_ux.py`) writes it in place. Reused decisions are resolved
against the live model under `--product-base`.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_ux.py --manifest <ux-manifest.yaml> \
            --slice-file <live slice record .yaml> [--product-base <product_base>]

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
    sys.stderr.write("validate_ux.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

OTHER_LENSES = ("quality", "agentic", "architecture", "run", "measure", "marketing", "lens")


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


def manifest_decisions(man, errors):
    """Decision ids this run will persist — from the manifest's decision_delta(s).

    The delta's `record` is the decision body the keyed persist writes; validate it carries
    the fields a decision must have, then register its id as resolvable.
    """
    ids = set()
    deltas = man.get("decision_delta") or man.get("decision") or []
    if isinstance(deltas, dict):
        deltas = [deltas]
    for d in (deltas or []):
        if not isinstance(d, dict) or not d:
            continue
        rec = d.get("record") or {}
        dec = rec.get("decision") if isinstance(rec.get("decision"), dict) else rec
        did = d.get("id") or (dec.get("id") if isinstance(dec, dict) else None)
        for f in ("id", "status", "level"):
            if _blank((dec or {}).get(f)) and _blank(d.get(f)):
                errors.append(f"decision_delta {did or '<?>'}: record missing '{f}' (C8/F8)")
        if did:
            ids.add(did)
    return ids


def live_decisions(product_base):
    """Decision ids already on the live model — so a reused decision resolves."""
    ids = set()
    if not product_base:
        return ids
    root = os.path.join(product_base, "product-os")
    if not os.path.isdir(root):
        return ids
    for d in glob.glob(os.path.join(root, "**", "decisions", "*.yaml"), recursive=True):
        try:
            body = load(d)
        except (OSError, yaml.YAMLError):
            continue
        dec = body.get("decision") if isinstance(body.get("decision"), dict) else body
        if isinstance(dec, dict) and dec.get("id"):
            ids.add(dec["id"])
    return ids


def check_grounding(man, decision_ids, errors):
    """C4/C7/C8 over the manifest. Returns grounded functionality refs."""
    grounded_funcs = set()

    def walk(label, entries):
        if _blank(entries):
            errors.append(f"{label} has no grounding source (C4/F4)")
            return
        for e in entries:
            st = (e.get("source_type") or "").strip().lower()
            if _blank(e.get("source")) or not st:
                errors.append(f"{label} has a grounding entry with no source (C4/F4)")
                continue
            if st in OTHER_LENSES:
                errors.append(f"{label} grounds on another lens '{st}' — /ux reads the slice's "
                              f"hub, never a lens (C7/F7)")
            elif st not in ("ice", "functionality", "persona", "journey"):
                errors.append(f"{label} source_type '{st}' is not functionality/persona/journey (C4/F4)")
            if st in ("ice", "functionality"):
                fr = e.get("functionality_ref")
                if not _blank(fr):
                    grounded_funcs.add(fr)
            if e.get("material") is True:
                dec = e.get("decision")
                if _blank(dec):
                    errors.append(f"{label} is a material choice with no decision recorded (C8/F8)")
                elif dec not in decision_ids:
                    errors.append(f"{label} names decision '{dec}' with no resolvable record (C8/F8)")

    for s in (man.get("screens") or []):
        walk(f"screen '{s.get('name', '<screen>')}'", s.get("grounds"))

    ds = man.get("design_system") or man.get("visual_core") or {}
    vt = (ds.get("source_type") or "").strip().lower()
    if vt not in ("kb", "decision"):
        errors.append("visual core must ground on a KB technology learning or a decision (C4/F4)")
    if vt == "decision":
        dec = ds.get("decision")
        if _blank(dec):
            errors.append("visual core has no decision recorded (C8/F8)")
        elif dec not in decision_ids:
            errors.append(f"visual core names decision '{dec}' with no resolvable record (C8/F8)")
    return grounded_funcs


def slice_functionalities(slice_file, errors):
    if not slice_file or not os.path.isfile(slice_file):
        errors.append(f"slice record not found at {slice_file} — cannot verify coverage (C6/F6)")
        return set()
    sl = (load(slice_file).get("slice") or {})
    return {(f or {}).get("functionality_ref") for f in (sl.get("functionalities") or [])
            if (f or {}).get("functionality_ref")}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /ux's lens grounding + coverage.")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--slice-file", required=True)
    ap.add_argument("--product-base", help="live model root — to resolve a reused decision")
    args = ap.parse_args(argv)

    errors, warnings = [], []
    try:
        man = (load(args.manifest).get("ux") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}

    decision_ids = manifest_decisions(man, errors) | live_decisions(args.product_base)

    grounded_funcs = check_grounding(man, decision_ids, errors)
    to_cover = slice_functionalities(args.slice_file, errors)
    for fid in sorted(f for f in to_cover if f):
        if fid not in grounded_funcs:
            errors.append(f"slice functionality {fid!r} is visualized by no screen (C6/F6)")

    counts = {"manifest_screens": len(man.get("screens") or []), "decisions": len(decision_ids),
              "to_cover": len(to_cover), "grounded_funcs": len(grounded_funcs)}
    result = {"ok": not errors, "errors": errors, "warnings": warnings, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
