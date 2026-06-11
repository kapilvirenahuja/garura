#!/usr/bin/env python3
"""
check_ready_epic.py — epic eligibility gate (C1/F1) + box resolution for /implement.

/implement works ONE epic — the tightest box. This gate asserts the epic is
buildable and resolves everything the box references, so downstream steps read
paths without re-deriving them:

  - the slice exists and its status is `realized` (the /run stamp — the slice's
    design is solved; epics were cut from it by /grill);
  - the epic exists under the slice's epics/ folder, its status is `ready`
    (or `in_delivery` carrying an issue_ref — the resume case);
  - every epic in this slice's `depends_on` chain for THIS epic is `delivered`;
  - every `functionality_refs` entry resolves into the slice's functionality
    set and that functionality's `ice_ref` resolves to a file (broken hub =
    LOUD error, never a silent pass);
  - all five lens files exist on the slice (quality, ux, agentic,
    architecture, run).

With --slice and no --epic it auto-picks the lowest-`order` ready epic whose
dependencies are all delivered (graceful "none eligible" otherwise).

Also resolves the play's config flags the canonical preflight does not know:
  - plan_tracking — `implement.plan-tracking`, default true (C12).

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_ready_epic.py --product-base <pb> [--config <config.yaml>]
                                (--epic <[domain/][slice-id/]epic-id> | --slice <[domain/]slice-id>)

Prints {ok, errors[], epic_id, epic_file, slice_id, slice_file, domain,
        lens_dir, lens_files{}, functionality_ices[], epic{...}, plan_tracking} JSON.
Exit 0 eligible, 1 not eligible, 2 usage error.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_ready_epic.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

LENS_TYPES = ["quality", "ux", "agentic", "architecture", "run"]


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


def resolve_slice(root, slice_arg, errors):
    slice_id = slice_arg.split("/")[-1]
    matches = glob.glob(os.path.join(root, "*", "slices", slice_id + ".yaml"))
    if not matches:
        errors.append(f"slice '{slice_id}' not found under any domain's slices/ (C1/F1)")
        return slice_id, None, None
    if len(matches) > 1:
        errors.append(f"slice id '{slice_id}' is ambiguous across domains: {matches}")
        return slice_id, None, None
    slice_file = matches[0]
    domain = os.path.basename(os.path.dirname(os.path.dirname(slice_file)))
    return slice_id, slice_file, domain


def epic_eligible(epic, all_epics, errors, label, allow_in_delivery):
    status = (epic.get("status") or "").strip().lower()
    if status == "ready":
        pass
    elif status == "in_delivery" and allow_in_delivery:
        if _empty(epic.get("issue_ref")):
            errors.append(f"{label}: in_delivery but carries no issue_ref — "
                          f"inconsistent state, fix the epic record (C1/F1)")
    else:
        errors.append(f"{label}: status is '{status}', must be 'ready' "
                      f"(or 'in_delivery' with issue_ref on resume) (C1/F1)")
    for dep in (epic.get("depends_on") or []):
        dep_epic = all_epics.get(dep)
        if dep_epic is None:
            errors.append(f"{label}: depends_on '{dep}' does not exist in this slice (C1/F1)")
        elif (dep_epic.get("status") or "").strip().lower() != "delivered":
            errors.append(f"{label}: dependency '{dep}' is "
                          f"'{dep_epic.get('status')}', must be 'delivered' (C1/F1)")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Epic eligibility gate + box resolution.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--config", default=".garura/core/config.yaml")
    ap.add_argument("--epic", help="[domain/][slice-id/]epic-id")
    ap.add_argument("--slice", help="[domain/]slice-id — auto-pick earliest eligible ready epic")
    args = ap.parse_args(argv)

    if not args.epic and not args.slice:
        sys.stderr.write("check_ready_epic.py: pass --epic or --slice.\n")
        return 2

    errors = []
    root = os.path.join(args.product_base, "product-os")
    out = {"ok": False, "errors": errors,
           "plan_tracking": plan_tracking_from_config(args.config)}

    # --- resolve slice (from --slice, or the epic token's prefix) -------------
    if args.epic and "/" in args.epic:
        slice_arg = "/".join(args.epic.split("/")[:-1])
    else:
        slice_arg = args.slice or ""
    if not slice_arg and args.epic:
        # bare epic id — find it under any slice's epics/
        hits = glob.glob(os.path.join(root, "*", "slices", "*", "epics",
                                      args.epic + ".yaml"))
        if len(hits) == 1:
            slice_arg = os.path.basename(os.path.dirname(os.path.dirname(hits[0])))
        elif not hits:
            errors.append(f"epic '{args.epic}' not found under any slice (C1/F1)")
        else:
            errors.append(f"epic id '{args.epic}' is ambiguous: {hits}")
    if errors:
        print(json.dumps(out, indent=2))
        return 1

    slice_id, slice_file, domain = resolve_slice(root, slice_arg, errors)
    if errors:
        print(json.dumps(out, indent=2))
        return 1

    sl = (load(slice_file).get("slice") or {})
    slice_status = (sl.get("status") or "").strip().lower()
    if slice_status != "realized":
        errors.append(f"slice '{slice_id}' status is '{slice_status}', must be 'realized' "
                      f"— run the realize lenses + /run stamp first (C1/F1)")

    slice_dir = os.path.join(os.path.dirname(slice_file), slice_id)
    lens_dir = os.path.join(slice_dir, "lens")
    lens_files = {}
    for lt in LENS_TYPES:
        p = os.path.join(lens_dir, lt + ".yaml")
        lens_files[lt] = p
        if not os.path.isfile(p):
            errors.append(f"lens '{lt}' missing at {p} — slice not fully realized (C1/F1)")

    # --- load all epics of the slice ------------------------------------------
    epics_dir = os.path.join(slice_dir, "epics")
    all_epics = {}
    for f in sorted(glob.glob(os.path.join(epics_dir, "*.yaml"))):
        if os.path.basename(f) == "deferrals.yaml":
            continue
        try:
            e = (load(f).get("epic") or {})
        except (OSError, yaml.YAMLError) as exc:
            errors.append(f"epic file unreadable: {f} ({exc})")
            continue
        if e.get("id"):
            all_epics[e["id"]] = e
            e["_file"] = f
    if not all_epics:
        errors.append(f"no epics under {epics_dir} — cut them with /grill first (C1/F1)")

    # --- pick / validate the epic ---------------------------------------------
    epic = None
    if args.epic:
        epic_id = args.epic.split("/")[-1]
        epic = all_epics.get(epic_id)
        if epic is None:
            errors.append(f"epic '{epic_id}' not found in slice '{slice_id}' (C1/F1)")
        else:
            epic_eligible(epic, all_epics, errors, f"epic '{epic_id}'",
                          allow_in_delivery=True)
    else:
        candidates = sorted((e for e in all_epics.values()
                             if (e.get("status") or "").lower() == "ready"),
                            key=lambda e: e.get("order") or 0)
        for cand in candidates:
            trial = []
            epic_eligible(cand, all_epics, trial, "candidate", allow_in_delivery=False)
            if not trial:
                epic = cand
                break
        if epic is None:
            errors.append(f"no eligible ready epic in slice '{slice_id}' — every ready epic "
                          f"has undelivered dependencies, or none is ready (C1/F1)")

    # --- resolve the epic's functionality hub ---------------------------------
    functionality_ices = []
    if epic is not None:
        slice_funcs = {(f or {}).get("functionality_ref"): (f or {})
                       for f in (sl.get("functionalities") or [])}
        refs = epic.get("functionality_refs") or []
        if _empty(refs):
            errors.append(f"epic '{epic.get('id')}' has no functionality_refs (C1/F1)")
        for ref in refs:
            sf = slice_funcs.get(ref)
            if sf is None:
                errors.append(f"functionality_ref '{ref}' is not in slice '{slice_id}' — "
                              f"epic points outside its slice (C1/F1)")
                continue
            ice_ref = sf.get("ice_ref")
            if _empty(ice_ref):
                errors.append(f"functionality '{ref}' has no ice_ref in the slice (C1/F1)")
                continue
            ice_path = os.path.join(args.product_base, ice_ref)
            if not os.path.isfile(ice_path):
                errors.append(f"functionality '{ref}' ice_ref does not resolve: {ice_ref} "
                              f"— broken hub, cannot implement (C1/F1)")
            functionality_ices.append({"ref": ref, "ice_ref": ice_ref,
                                       "resolved": os.path.isfile(ice_path)})
        for field in ("outcome", "user_check", "acceptance"):
            if _empty(epic.get(field)):
                errors.append(f"epic '{epic.get('id')}': '{field}' is empty — "
                              f"not a buildable box (C1/F1)")

        out.update({
            "epic_id": epic.get("id"),
            "epic_file": epic.get("_file"),
            "epic": {k: v for k, v in epic.items() if k != "_file"},
            "slice_id": slice_id, "slice_file": slice_file, "domain": domain,
            "lens_dir": lens_dir, "lens_files": lens_files,
            "functionality_ices": functionality_ices,
        })

    out["ok"] = not errors
    print(json.dumps(out, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
