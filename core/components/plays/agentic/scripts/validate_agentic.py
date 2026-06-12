#!/usr/bin/env python3
"""
validate_agentic.py — assert /agentic's draft lens is schema-true, coherent, and grounded.

Run over the draft before the checkpoint. The agentic lens is an `is_agent` gate plus, when
agentic, five axes on the low->ultra scale: three weights (cognitive/creative/logistical =
degree of offload) and two controls (guardrails, handoff). Enforces /agentic's artifact-side
constraints:

  - C9/F9   schema: the lens carries the v1 envelope (id, slice_ref, type=agentic,
            content, status) and any decision carries its required v1 fields.
  - C3/F3   shape: content is is_agent + note (+ weights cognitive/creative/logistical +
            controls guardrails/handoff when agentic); no other key; every axis level is one
            of low/medium/high/xhigh/ultra.
  - C5/F5   coherent: is_agent present with a note; when agentic every axis has a valid level
            and a note; when not agentic no axis is rated.
  - C4/F4   grounded: the is_agent decision and every rated axis name a real ICE source in
            the manifest — none invented.
  - C6/F6   hub-only: no grounding source points at another lens (quality/ux/architecture/run).
  - C7/F7   decision: a manifest grounding flagged `material: true` names a `decision` that
            resolves to a drafted decision record.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_agentic.py --draft <draft_dir> --manifest <agentic-manifest.yaml>

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
    sys.stderr.write("validate_agentic.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


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


OTHER_LENSES = ("quality", "ux", "architecture", "run", "measure", "lens")
CONTENT_KEYS = {"is_agent", "note", "weights", "controls"}
WEIGHT_AXES = ("cognitive", "creative", "logistical")
CONTROL_AXES = ("guardrails", "handoff")
ALL_AXES = WEIGHT_AXES + CONTROL_AXES
LEVELS = ("low", "medium", "high", "xhigh", "ultra")


def _level_ok(v):
    return isinstance(v, str) and v.strip().lower() in LEVELS


def validate_lens(draft_root, errors):
    """C9/C3/C5 — the lens shape + coherence. Returns the set of rated axis names."""
    rated = set()
    lenses = glob.glob(os.path.join(draft_root, "**", "lens", "agentic.yaml"), recursive=True)
    if not lenses:
        errors.append("no agentic.yaml in the draft (F3)")
        return rated
    for lp in lenses:
        doc = (load(lp).get("lens") or {})
        for f in ("id", "slice_ref", "type", "status"):
            if _blank(doc.get(f)):
                errors.append(f"{lp}: lens missing '{f}' (F9)")
        if doc.get("type") != "agentic":
            errors.append(f"{lp}: type is '{doc.get('type')}', must be agentic (F9)")
        content = doc.get("content") or {}
        extra = [k for k in content if k not in CONTENT_KEYS]
        if extra:
            errors.append(f"{lp}: content has keys outside is_agent/note/weights/controls {extra} (F3)")

        is_agent = content.get("is_agent")
        if not isinstance(is_agent, bool):
            errors.append(f"{lp}: is_agent must be a boolean (F5)")
        if _blank(content.get("note")):
            errors.append(f"{lp}: is_agent has no note giving the load judgment (F5)")

        weights = content.get("weights") or {}
        controls = content.get("controls") or {}
        rated_here = bool(weights) or bool(controls)

        if is_agent is True:
            for group, axes in (("weights", WEIGHT_AXES), ("controls", CONTROL_AXES)):
                block = content.get(group) or {}
                for ax in axes:
                    w = block.get(ax)
                    if not isinstance(w, dict):
                        errors.append(f"{lp}: {group}.{ax} missing (agentic must rate all five axes) (F5)")
                        continue
                    if not _level_ok(w.get("level")):
                        errors.append(f"{lp}: {ax} level {w.get('level')!r} not in "
                                      f"low/medium/high/xhigh/ultra (F3)")
                    else:
                        rated.add(ax)
                    if _blank(w.get("note")):
                        errors.append(f"{lp}: {ax} has no note (F5)")
            # unknown axes?
            for group, axes in (("weights", WEIGHT_AXES), ("controls", CONTROL_AXES)):
                for k in (content.get(group) or {}):
                    if k not in axes:
                        errors.append(f"{lp}: {group} has unknown axis '{k}' (F3)")
        elif is_agent is False:
            if rated_here:
                errors.append(f"{lp}: is_agent is false but axes are rated — clear them (F5)")
        # is_agent non-bool already flagged
    return rated


def collect_decisions(draft_root, errors):
    ids = set()
    for d in glob.glob(os.path.join(draft_root, "**", "decisions", "*.yaml"), recursive=True):
        dec = (load(d).get("decision") or {})
        for f in ("id", "title", "reason", "status", "level"):
            if _blank(dec.get(f)):
                errors.append(f"{d}: decision missing '{f}' (F9)")
        if dec.get("id"):
            ids.add(dec["id"])
    return ids


def check_grounding(man, decision_ids, errors):
    """C4/C6/C7 over the manifest. Returns the set of grounded axis names."""
    grounded = set()
    for a in (man.get("axes") or []):
        ax = a.get("axis") or "<axis>"
        entries = a.get("grounds")
        if _blank(entries):
            errors.append(f"axis '{ax}' has no grounding source (C4/F4)")
            continue
        hit = False
        for e in entries:
            st = (e.get("source_type") or "").strip().lower()
            if _blank(e.get("source")) or not st:
                errors.append(f"axis '{ax}' has a grounding entry with no source (C4/F4)")
                continue
            if st in OTHER_LENSES:
                errors.append(f"axis '{ax}' grounds on another lens '{st}' — "
                              f"/agentic reads the hub, never a lens (C6/F6)")
            elif st != "ice":
                errors.append(f"axis '{ax}' source_type '{st}' is not ice (C4/F4)")
            else:
                hit = True
            if e.get("material") is True:
                dec = e.get("decision")
                if _blank(dec):
                    errors.append(f"axis '{ax}' is a material choice with no decision recorded (C7/F7)")
                elif dec not in decision_ids:
                    errors.append(f"axis '{ax}' names decision '{dec}' with no drafted record (C7/F7)")
        if hit:
            grounded.add(ax)
    return grounded


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /agentic's draft lens.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--manifest", required=True)
    args = ap.parse_args(argv)

    draft_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(draft_root):
        sys.stderr.write(f"validate_agentic.py: no draft tree at {draft_root}\n")
        sys.exit(2)

    errors = []

    rated = validate_lens(draft_root, errors)
    decision_ids = collect_decisions(draft_root, errors)

    try:
        man = (load(args.manifest).get("agentic") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}

    grounded = check_grounding(man, decision_ids, errors)

    # every rated axis in the lens must be grounded in the manifest (C4/F4)
    for ax in sorted(rated - grounded):
        errors.append(f"axis '{ax}' is rated in the lens but has no grounding entry in the manifest (C4/F4)")

    counts = {"rated_axes": len(rated), "grounded_axes": len(grounded), "decisions": len(decision_ids)}
    result = {"ok": not errors, "errors": errors, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
