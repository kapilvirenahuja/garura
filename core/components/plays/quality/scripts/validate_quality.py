#!/usr/bin/env python3
"""
validate_quality.py — assert /quality's draft lens is schema-true, gates-only, grounded.

Run over the draft before the checkpoint. Enforces /quality's artifact-side constraints:

  - C9/F9  schema: the lens carries the v1 envelope (id, slice_ref, type=quality,
           content, status) and any decision carries its required v1 fields.
  - C3/F3  gates-only: content has exactly the `gates` key, a non-empty list, each gate
           a non-trivial string — no how-to-test / coverage / environments keys.
  - C5/F5  checkable: no gate is a bare one-word adjective; each reads as a condition.
  - C4/F4  grounded: every gate in the grounding manifest names a source that is a
           profile target or an ICE constraint/failure — present and non-empty.
  - C6/F6  first-in-sequence: no gate's grounding source points at another lens
           (ux/architecture/run/agentic).
  - C7/F7  decisions: every gate flagged `material: true` in the manifest names a
           `decision` that resolves to a drafted decision record.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_quality.py --draft <draft_dir> --manifest <quality-manifest.yaml>

Prints {ok, errors[], counts} JSON. Exit 0 clean, 1 on violation, 2 usage error.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_quality.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _empty(v):
    return v is None or (isinstance(v, (list, dict, str)) and len(v) == 0)


LENS_NAMES = ("ux", "architecture", "run", "agentic", "measure")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /quality's draft lens.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--manifest", required=True)
    args = ap.parse_args(argv)

    draft_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(draft_root):
        sys.stderr.write(f"validate_quality.py: no draft tree at {draft_root}\n")
        sys.exit(2)

    errors = []
    counts = {"lens": 0, "gates": 0, "decision": 0}
    lens_gates = set()        # gate strings actually present in the lens

    # --- the quality lens ----------------------------------------------------
    lenses = glob.glob(os.path.join(draft_root, "**", "lens", "quality.yaml"), recursive=True)
    if not lenses:
        errors.append("no quality.yaml in the draft (F3)")
    for lp in lenses:
        counts["lens"] += 1
        doc = (load(lp).get("lens") or {})
        for f in ("id", "slice_ref", "type", "status"):
            if _empty(doc.get(f)):
                errors.append(f"{lp}: lens missing '{f}' (F9)")
        if doc.get("type") != "quality":
            errors.append(f"{lp}: type is '{doc.get('type')}', must be quality (F9)")
        content = doc.get("content") or {}
        extra = [k for k in content if k != "gates"]
        if extra:
            errors.append(f"{lp}: content has non-gate keys {extra} — gates only (F3)")
        gates = content.get("gates") or []
        if _empty(gates):
            errors.append(f"{lp}: content.gates is empty (F3)")
        for g in gates:
            counts["gates"] += 1
            if not isinstance(g, str) or len(g.strip()) < 3:
                errors.append(f"{lp}: gate {g!r} is not a usable string (F3)")
            elif len(g.split()) < 2:
                errors.append(f"{lp}: gate {g!r} is a bare word, not a checkable condition (F5)")
            elif isinstance(g, str):
                lens_gates.add(g.strip())

    # --- decisions -----------------------------------------------------------
    decision_ids = set()
    for d in glob.glob(os.path.join(draft_root, "**", "decisions", "*.yaml"), recursive=True):
        counts["decision"] += 1
        dec = (load(d).get("decision") or {})
        for f in ("id", "title", "reason", "status", "level"):
            if _empty(dec.get(f)):
                errors.append(f"{d}: decision missing '{f}' (F9)")
        if dec.get("id"):
            decision_ids.add(dec["id"])

    # --- grounding manifest --------------------------------------------------
    try:
        man = (load(args.manifest).get("quality") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}
    grounded = man.get("gates") or []
    if not grounded and counts["gates"]:
        errors.append("grounding manifest lists no gates, but the lens has some (C4/F4)")
    grounded_gates = set()    # gate strings the manifest grounds with a real source
    for entry in grounded:
        gid = entry.get("gate", "<gate>")
        src_type = (entry.get("source_type") or "").strip().lower()
        if _empty(entry.get("source")) or _empty(src_type):
            errors.append(f"gate '{gid}' has no grounding source (C4/F4)")
            continue
        if isinstance(gid, str):
            grounded_gates.add(gid.strip())
        if src_type in LENS_NAMES or src_type == "lens":
            errors.append(f"gate '{gid}' grounds on another lens '{src_type}' — "
                          f"/quality is first and reads no lens (C6/F6)")
        elif src_type not in ("profile", "ice"):
            errors.append(f"gate '{gid}' source_type '{src_type}' is neither profile nor ice (C4/F4)")
        # C7/F7 — a material choice must carry a decision that resolves to a record
        if entry.get("material") is True:
            dec = entry.get("decision")
            if _empty(dec):
                errors.append(f"gate '{gid}' is a material choice with no decision recorded (C7/F7)")
            elif dec not in decision_ids:
                errors.append(f"gate '{gid}' names decision '{dec}' that has no drafted record (C7/F7)")

    # --- reconcile both directions: every lens gate must be grounded (C4/F4) --
    for g in sorted(lens_gates - grounded_gates):
        errors.append(f"lens gate {g!r} has no grounding entry in the manifest (C4/F4)")
    for g in sorted(grounded_gates - lens_gates):
        errors.append(f"manifest grounds gate {g!r} that is not in the lens (C4/F4)")

    result = {"ok": not errors, "errors": errors, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
