#!/usr/bin/env python3
"""
validate_epics.py — mechanical validation of a drafted epic cut for /grill.

The cut lives in a DRAFT folder (STM): epics/*.yaml + epics/deferrals.yaml, one file
per epic, validated against the slice record it was cut from. The judgment (is the
acceptance genuinely user-testable, is the epic meaningful) stays with the play and
the grilling; this script does the counting and wiring the model should not hand-do:

  shape     — every epic carries the v2 required fields, non-empty: id, slice_ref,
              title, outcome, user_check, functionality_refs, context
              (persona/systems/scope), acceptance, order; status is `ready`,
              issue_ref unset; ids unique; filename == id; user_check distinct
              across epics (anti-boilerplate) (C2/C3/C10 — F1/F10 backstop).
  refs      — every functionality_refs entry resolves to a functionality the slice
              declares; no forbidden embedded-content key (ice, intent, goals,
              expectations, lens, content) — epics reference, never copy (C4/F4).
  coverage  — every slice functionality appears in >= 1 epic's functionality_refs
              OR in deferrals (with a non-empty reason); never both; never neither
              (C5/F3).
  ordering  — order values unique and positive; depends_on resolve to epic ids in
              this cut; the dependency graph is acyclic; the first epic (lowest
              order) has no depends_on (C8/F9).
  tensions  — with --rounds-dir: every tension entry across the round reports
              carries a citation (C6/F5), and none is still `live` — each is
              `resolved` or `accepted` with a recorded reason (C7/F6). Run this
              form as the write-gate before the checkpoint.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_epics.py --draft <dir> --product-base <pb> --slice-file <rel>
                              [--rounds-dir <dir>]

Prints {ok, errors[], counts} JSON. Exit 0 clean, 1 gaps, 2 usage error.
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

FORBIDDEN_KEYS = {"ice", "intent", "goals", "expectations", "lens", "content"}
LIVE = "live"
CLOSED = {"resolved", "accepted"}


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _empty(v):
    return v is None or (isinstance(v, (list, dict, str)) and len(str(v).strip() if isinstance(v, str) else v) == 0)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate a drafted epic cut for /grill.")
    ap.add_argument("--draft", required=True, help="draft dir holding epics/")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--slice-file", required=True, help="slice record, relative to product-base")
    ap.add_argument("--rounds-dir", help="grill rounds dir; enforces cited + no-live tensions")
    args = ap.parse_args(argv)

    errors = []
    counts = {"epics": 0, "deferrals": 0, "tensions": 0, "live_tensions": 0}

    # --- slice record: the declared functionality set ------------------------
    try:
        sl = (load(os.path.join(args.product_base, args.slice_file)).get("slice") or {})
    except (OSError, yaml.YAMLError) as exc:
        print(json.dumps({"ok": False, "errors": [f"slice record unreadable: {exc}"],
                          "counts": counts}, indent=2))
        return 1
    slice_funcs = [(f or {}).get("functionality_ref") for f in (sl.get("functionalities") or [])]
    slice_funcs = [f for f in slice_funcs if not _empty(f)]
    slice_id = os.path.basename(args.slice_file)[:-len(".yaml")]
    domain = os.path.basename(os.path.dirname(os.path.dirname(args.slice_file)))
    expect_slice_ref = f"{domain}/{slice_id}"

    # --- load the draft cut ---------------------------------------------------
    epics_dir = os.path.join(args.draft, "epics")
    epic_files = sorted(f for f in glob.glob(os.path.join(epics_dir, "*.yaml"))
                        if os.path.basename(f) != "deferrals.yaml")
    if not epic_files:
        errors.append(f"no epics in draft ({epics_dir}/*.yaml) — an empty cut is not a cut")

    epics = {}
    user_checks = {}
    for path in epic_files:
        fname = os.path.basename(path)
        try:
            ep = (load(path).get("epic") or {})
        except (OSError, yaml.YAMLError) as exc:
            errors.append(f"{fname}: unreadable ({exc})")
            continue
        eid = ep.get("id")
        if _empty(eid):
            errors.append(f"{fname}: no id")
            continue
        if fname != f"{eid}.yaml":
            errors.append(f"{fname}: filename must be <id>.yaml (id is '{eid}')")
        if eid in epics:
            errors.append(f"{fname}: duplicate epic id '{eid}'")
            continue
        epics[eid] = ep

        # shape (C2/C3/C10)
        for field in ("slice_ref", "title", "outcome", "user_check", "acceptance"):
            if _empty(ep.get(field)):
                errors.append(f"{eid}: '{field}' is empty (C3/F10"
                              + (" — and the user-testability grain, C2/F1" if field in ("user_check", "acceptance") else "")
                              + ")")
        if not _empty(ep.get("slice_ref")) and ep.get("slice_ref") != expect_slice_ref:
            errors.append(f"{eid}: slice_ref '{ep.get('slice_ref')}' != '{expect_slice_ref}'")
        ctx = ep.get("context") or {}
        for field in ("persona", "systems", "scope"):
            if _empty(ctx.get(field)):
                errors.append(f"{eid}: context.{field} is empty — not self-contained (C3/F10)")
        uc = (ep.get("user_check") or "").strip().lower()
        if uc:
            if uc in user_checks:
                errors.append(f"{eid}: user_check duplicates {user_checks[uc]}'s — "
                              f"boilerplate, not a real user test (C2/F1)")
            user_checks[uc] = eid
        if (ep.get("status") or "").strip().lower() != "ready":
            errors.append(f"{eid}: status must be 'ready' at creation (C10)")
        if not _empty(ep.get("issue_ref")):
            errors.append(f"{eid}: issue_ref must be unset — /start owns it (C10)")
        order = ep.get("order")
        if not isinstance(order, int) or order < 1:
            errors.append(f"{eid}: order must be a positive integer (C8/F9)")

        # reference-not-copy (C4/F4)
        leaked = FORBIDDEN_KEYS & set(ep.keys())
        if leaked:
            errors.append(f"{eid}: embeds source content (keys: {sorted(leaked)}) — "
                          f"epics reference intent/lenses, never copy them (C4/F4)")

        # refs resolve (C3)
        frefs = ep.get("functionality_refs") or []
        if _empty(frefs):
            errors.append(f"{eid}: functionality_refs is empty (C3/F10)")
        for ref in frefs:
            if ref not in slice_funcs:
                errors.append(f"{eid}: functionality_refs '{ref}' is not a functionality "
                              f"of slice {expect_slice_ref} (C3/F10)")

    counts["epics"] = len(epics)

    # --- deferrals + coverage (C5/F3) ----------------------------------------
    deferrals_path = os.path.join(epics_dir, "deferrals.yaml")
    deferrals = []
    if os.path.isfile(deferrals_path):
        try:
            deferrals = load(deferrals_path).get("deferrals") or []
        except (OSError, yaml.YAMLError) as exc:
            errors.append(f"deferrals.yaml: unreadable ({exc})")
    counts["deferrals"] = len(deferrals)
    deferred = set()
    for i, d in enumerate(deferrals):
        ref = (d or {}).get("functionality_ref")
        if _empty(ref) or ref not in slice_funcs:
            errors.append(f"deferrals[{i}]: functionality_ref '{ref}' is not a "
                          f"functionality of this slice (C5/F3)")
            continue
        if _empty((d or {}).get("reason")):
            errors.append(f"deferrals[{i}] ('{ref}'): no recorded reason — a deferral "
                          f"without a reason is a silent drop (C5/F3)")
        deferred.add(ref)

    covered = {ref for ep in epics.values() for ref in (ep.get("functionality_refs") or [])}
    for ref in slice_funcs:
        if ref in covered and ref in deferred:
            errors.append(f"functionality '{ref}' is both cut into an epic and deferred — "
                          f"decide one (C5/F3)")
        elif ref not in covered and ref not in deferred:
            errors.append(f"functionality '{ref}' is in no epic and not deferred — "
                          f"silently dropped (C5/F3)")

    # --- ordering (C8/F9) -----------------------------------------------------
    if epics:
        orders = {eid: ep.get("order") for eid, ep in epics.items()
                  if isinstance(ep.get("order"), int)}
        seen = {}
        for eid, o in orders.items():
            if o in seen:
                errors.append(f"order {o} used by both {seen[o]} and {eid} (C8/F9)")
            seen[o] = eid
        deps = {eid: [d for d in (ep.get("depends_on") or [])] for eid, ep in epics.items()}
        for eid, ds in deps.items():
            for d in ds:
                if d not in epics:
                    errors.append(f"{eid}: depends_on '{d}' is not an epic in this cut (C8/F9)")
        if orders:
            first = min(orders, key=orders.get)
            if deps.get(first):
                errors.append(f"first epic '{first}' has dependencies "
                              f"({deps[first]}) — it must stand alone (C8/F9)")
        state = {}

        def cyclic(node, stack):
            state[node] = "visiting"
            stack.append(node)
            for d in deps.get(node, []):
                if d not in epics:
                    continue
                if state.get(d) == "visiting":
                    return stack[stack.index(d):] + [d]
                if d not in state:
                    found = cyclic(d, stack)
                    if found:
                        return found
            state[node] = "done"
            stack.pop()
            return None

        for eid in epics:
            if eid not in state:
                cycle = cyclic(eid, [])
                if cycle:
                    errors.append(f"dependency cycle: {' -> '.join(cycle)} (C8/F9)")
                    break

    # --- tensions: cited + none live (C6/F5, C7/F6) ---------------------------
    if args.rounds_dir:
        for path in sorted(glob.glob(os.path.join(args.rounds_dir, "*.yaml"))):
            try:
                report = load(path)
            except (OSError, yaml.YAMLError) as exc:
                errors.append(f"{os.path.basename(path)}: unreadable round report ({exc})")
                continue
            for t in report.get("tensions") or []:
                counts["tensions"] += 1
                tid = (t or {}).get("tension_id", "?")
                cites = (t or {}).get("cites") or {}
                if _empty(cites.get("source")) or _empty(cites.get("quote")):
                    errors.append(f"{tid}: no citation (cites.source/quote) — an uncited "
                                  f"tension is an uncited push-back (C6/F5)")
                status = ((t or {}).get("status") or "").strip().lower()
                if status == LIVE:
                    counts["live_tensions"] += 1
                    errors.append(f"{tid}: still live — resolve it in the cut or record an "
                                  f"explicit acceptance before writing (C7/F6)")
                elif status not in CLOSED:
                    errors.append(f"{tid}: status '{status}' invalid — live|resolved|accepted")
                elif status == "accepted" and _empty((t or {}).get("resolution_reason")):
                    errors.append(f"{tid}: accepted with no recorded reason (C7/F6)")

    ok = not errors
    print(json.dumps({"ok": ok, "errors": errors, "counts": counts}, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
