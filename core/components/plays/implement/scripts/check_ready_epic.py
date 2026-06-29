#!/usr/bin/env python3
"""
check_ready_epic.py — epic eligibility gate (C1/F1) + box resolution for /implement.

/implement works ONE epic — the tightest box. This gate asserts the epic is
buildable and resolves everything the box references, so downstream steps read
paths without re-deriving them. In the spine + grounding model an epic is an
entry in the spine `epics` index (status/issue_ref/order/depends_on/
functionality_refs/surface_type/doc) plus a rich `epic.md` grounding doc:

  - the slice exists in the spine `slices` index and its status is `realized`
    (the /measure stamp — the slice's design is solved; epics were cut by /grill);
  - the epic exists in the spine `epics` index for this slice, its status is
    `ready` (or `in_delivery` carrying an issue_ref — the resume case, or
    `fix_required` with the /validate fix report — the fix round);
  - every epic in this epic's `depends_on` chain is `delivered`;
  - the epic's `epic.md` grounding doc resolves on disk;
  - every `functionality_refs` entry resolves to a spine functionality whose
    `functionality.md` grounding doc exists (broken hub = LOUD error);
  - all seven lens .md docs exist on the slice (quality, ux, agentic, marketing,
    architecture, run, measure).

With --slice and no --epic it auto-picks the lowest-`order` ready epic whose
dependencies are all delivered (graceful "none eligible" otherwise).

Also resolves the play's config flags the canonical preflight does not know:
  - plan_tracking — `implement.plan-tracking`, default true (C12).

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_ready_epic.py --product-base <pb> [--config <config.yaml>]
                                (--epic <epic-id> | --slice <[domain/]slice-id>)

Prints {ok, errors[], epic_id, epic_doc, slice_id, slice_file, domain,
        lens_dir, lens_files{}, functionality_groundings[], epic{...}, plan_tracking} JSON.
Exit 0 eligible, 1 not eligible, 2 usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_ready_epic.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

LENS_TYPES = ["quality", "ux", "agentic", "marketing", "architecture", "run", "measure"]


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _empty(v):
    return v is None or (isinstance(v, (list, dict, str)) and len(v) == 0)


def plan_tracking_from_config(config_path):
    """`implement.plan-tracking`, default True when absent/unreadable (C12)."""
    if not config_path or not os.path.isfile(config_path):
        return True
    try:
        cfg = load(config_path)
    except (OSError, yaml.YAMLError):
        return True
    val = ((cfg.get("implement") or {}).get("plan-tracking"))
    return True if val is None else bool(val)


def slice_id_of(ref):
    """The slice id from a slice_ref that may be 'domain/slice-id' or 'slice-id'."""
    return ref.split("/")[-1] if ref else ref


def epic_eligible(epic, epics_by_id, errors, label, allow_in_delivery, fix_report=None):
    """Returns the entry mode: 'build' (ready), 'resume' (in_delivery), or
    'fix' (fix_required + the /validate fix report — the C14 fix round)."""
    status = (epic.get("status") or "").strip().lower()
    mode = "build"
    if status == "ready":
        pass
    elif status == "in_delivery" and allow_in_delivery:
        mode = "resume"
        if _empty(epic.get("issue_ref")):
            errors.append(f"{label}: in_delivery but carries no issue_ref — "
                          f"inconsistent state, fix the epic entry (C1/F1)")
    elif status == "fix_required":
        mode = "fix"
        if _empty(epic.get("issue_ref")):
            errors.append(f"{label}: fix_required but carries no issue_ref — "
                          f"inconsistent state, fix the epic entry (C1/F1)")
        if not fix_report or not os.path.isfile(fix_report):
            errors.append(f"{label}: fix_required but no /validate fix report at "
                          f"'{fix_report}' — the report is the fix round's exact "
                          f"work list (C1/C14/F1)")
    else:
        errors.append(f"{label}: status is '{status}', must be 'ready' "
                      f"(or 'in_delivery' with issue_ref on resume, or "
                      f"'fix_required' with its fix report — the fix round) (C1/F1)")
    for dep in (epic.get("depends_on") or []):
        dep_epic = epics_by_id.get(dep)
        if dep_epic is None:
            errors.append(f"{label}: depends_on '{dep}' does not exist in the spine (C1/F1)")
        elif (dep_epic.get("status") or "").strip().lower() != "delivered":
            errors.append(f"{label}: dependency '{dep}' is "
                          f"'{dep_epic.get('status')}', must be 'delivered' (C1/F1)")
    return mode


def main(argv=None):
    ap = argparse.ArgumentParser(description="Epic eligibility gate + box resolution (spine).")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--config", default=".garura/core/config.yaml")
    ap.add_argument("--epic", help="epic id")
    ap.add_argument("--slice", help="[domain/]slice-id — auto-pick earliest eligible ready epic")
    ap.add_argument("--fix-report",
                    help="/validate fix report (report.yaml) — required when the "
                         "epic is fix_required (the C14 fix round)")
    args = ap.parse_args(argv)

    if not args.epic and not args.slice:
        sys.stderr.write("check_ready_epic.py: pass --epic or --slice.\n")
        return 2

    errors = []
    root = os.path.join(args.product_base, "product-os")
    spine_path = os.path.join(root, "_spine.yaml")
    out = {"ok": False, "errors": errors,
           "plan_tracking": plan_tracking_from_config(args.config)}
    if not os.path.isfile(spine_path):
        errors.append(f"no spine at {spine_path} (C1/F1)")
        print(json.dumps(out, indent=2))
        return 1
    spine = load(spine_path)
    spine_slices = {s.get("id"): s for s in (spine.get("slices") or []) if isinstance(s, dict)}
    spine_funcs = {f.get("id"): f for f in (spine.get("functionalities") or []) if isinstance(f, dict)}
    spine_epics = [e for e in (spine.get("epics") or []) if isinstance(e, dict)]
    epics_by_id = {e.get("id"): e for e in spine_epics}

    # --- pick / validate the epic ---------------------------------------------
    epic = None
    mode = "build"
    if args.epic:
        epic = epics_by_id.get(args.epic.split("/")[-1])
        if epic is None:
            errors.append(f"epic '{args.epic}' not found in the spine epics index (C1/F1)")
    else:
        slice_id = slice_id_of(args.slice)
        candidates = sorted(
            (e for e in spine_epics
             if slice_id_of(e.get("slice_ref")) == slice_id
             and (e.get("status") or "").lower() == "ready"),
            key=lambda e: e.get("order") or 0)
        for cand in candidates:
            trial = []
            epic_eligible(cand, epics_by_id, trial, "candidate", allow_in_delivery=False)
            if not trial:
                epic = cand
                break
        if epic is None:
            errors.append(f"no eligible ready epic for slice '{slice_id}' — every ready epic "
                          f"has undelivered dependencies, or none is ready (C1/F1)")

    if epic is None:
        print(json.dumps(out, indent=2))
        return 1

    if args.epic:
        mode = epic_eligible(epic, epics_by_id, errors, f"epic '{epic.get('id')}'",
                             allow_in_delivery=True, fix_report=args.fix_report)

    # --- resolve the epic's slice (from its slice_ref) ------------------------
    slice_id = slice_id_of(epic.get("slice_ref"))
    sl = spine_slices.get(slice_id)
    if sl is None:
        errors.append(f"epic '{epic.get('id')}' slice_ref '{epic.get('slice_ref')}' "
                      f"is not in the spine slices index (C1/F1)")
        print(json.dumps(out, indent=2))
        return 1
    slice_status = (sl.get("status") or "").strip().lower()
    if slice_status != "realized":
        errors.append(f"slice '{slice_id}' status is '{slice_status}', must be 'realized' "
                      f"— run the realize pipes + /measure stamp first (C1/F1)")
    # resolve the slice folder + domain from the slice record pointer
    record_rel = sl.get("record") or ""
    domain = record_rel.split("/")[0] if "/" in record_rel else None
    slice_file = os.path.join(root, record_rel) if record_rel else None
    slice_dir = os.path.join(os.path.dirname(slice_file), slice_id) if slice_file else \
        os.path.join(root, domain or "", "slices", slice_id)
    lens_dir = os.path.join(slice_dir, "lens")
    lens_files = {}
    for lt in LENS_TYPES:
        p = os.path.join(lens_dir, lt + ".md")
        lens_files[lt] = p
        if not os.path.isfile(p):
            errors.append(f"lens '{lt}' missing at {p} — slice not fully realized (C1/F1)")

    # --- the epic.md grounding doc --------------------------------------------
    epic_doc = os.path.join(root, epic.get("doc")) if epic.get("doc") else None
    if not epic_doc or not os.path.isfile(epic_doc):
        errors.append(f"epic '{epic.get('id')}' epic.md not found at "
                      f"'{epic.get('doc')}' — the box has no grounding doc (C1/F1)")

    # --- resolve the epic's functionality hub (functionality.md) --------------
    functionality_groundings = []
    refs = epic.get("functionality_refs") or []
    if _empty(refs):
        errors.append(f"epic '{epic.get('id')}' has no functionality_refs (C1/F1)")
    for ref in refs:
        sf = spine_funcs.get(ref)
        if sf is None:
            errors.append(f"functionality_ref '{ref}' is not in the spine functionalities "
                          f"index — epic points at a missing functionality (C1/F1)")
            continue
        doc = sf.get("doc")
        doc_path = os.path.join(root, doc) if doc else None
        if not doc_path or not os.path.isfile(doc_path):
            errors.append(f"functionality '{ref}' doc does not resolve: {doc} "
                          f"— broken hub, cannot implement (C1/F1)")
        functionality_groundings.append({"ref": ref, "doc": doc,
                                          "resolved": bool(doc_path and os.path.isfile(doc_path))})

    out.update({
        "epic_id": epic.get("id"),
        "epic_doc": epic_doc,
        "epic": dict(epic),
        "mode": mode,
        "fix_report": args.fix_report if mode == "fix" else None,
        "slice_id": slice_id, "slice_file": slice_file, "domain": domain,
        "lens_dir": lens_dir, "lens_files": lens_files,
        "functionality_groundings": functionality_groundings,
    })
    out["ok"] = not errors
    print(json.dumps(out, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
