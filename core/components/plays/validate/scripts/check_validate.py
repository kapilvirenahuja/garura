#!/usr/bin/env python3
"""
check_validate.py — final self-check for /validate (F3/F6/F11, S1/S2).

Proves the run's own discipline over the captured artifacts before close:

  verdict   — recomputes the validated/fix_required decision from summary.json
              + gates-map.json + findings and asserts it MATCHES verdict.json
              (the stamp can never disagree with the evidence, F3).
  stamp     — the epic file's status equals the verdict (F6: a failed run
              carries fix_required; a clean run carries validated).
  surgical  — against the pre-stamp snapshot, the epic differs ONLY in
              `status`, `metadata.version`, and (on a pass) `surface_verified` (F11).
  report    — on fix_required, report.yaml + report.md exist and every finding
              carries citation + location (F7 downstream guard).

    python3 check_validate.py --verdict <verdict.json> --summary <summary.json>
        --gates-map <gates-map.json> --spine-before <spine-before.yaml>
        --product-base <pb> --epic <epic-id> --report-yaml <report.yaml> --report-md <report.md>

The epic is the spine `epics` entry (read by id from the live spine for the
after-state, and from the pre-stamp spine snapshot for the before-state).

Prints {ok, errors[]}. Exit 0 clean, 1 violation, 2 usage.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_validate.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load_yaml(path):
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def load_json(path):
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def main():
    ap = argparse.ArgumentParser(description="/validate final self-check.")
    ap.add_argument("--verdict", required=True)
    ap.add_argument("--summary", required=True)
    ap.add_argument("--gates-map", required=True)
    ap.add_argument("--spine-before", required=True,
                    help="pre-stamp snapshot of product-os/_spine.yaml")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--epic", required=True, help="epic id")
    ap.add_argument("--report-yaml", required=True)
    ap.add_argument("--report-md", required=True)
    args = ap.parse_args()

    errors = []

    verdict = load_json(args.verdict)
    summary = load_json(args.summary)
    gates_map = load_json(args.gates_map)

    # --- verdict matches evidence (F3) ------------------------------------------
    checks_clean = (summary.get("total", 0) > 0 and summary.get("failed", 1) == 0
                    and summary.get("errored", 1) == 0)
    expected = "validated" if (checks_clean
                               and not (gates_map.get("findings") or [])
                               and not (verdict.get("findings") or [])) \
               else "fix_required"
    if verdict.get("verdict") != expected:
        errors.append(f"verdict '{verdict.get('verdict')}' contradicts the evidence "
                      f"(recomputed: '{expected}') (F3)")

    # --- stamp matches verdict (F6) ----------------------------------------------
    def spine_entry(spine_path, epic_id):
        spine = load_yaml(spine_path)
        return next((e for e in (spine.get("epics") or [])
                     if isinstance(e, dict) and e.get("id") == str(epic_id).split("/")[-1]), {})

    eid = args.epic.split("/")[-1]
    after = spine_entry(os.path.join(args.product_base, "product-os", "_spine.yaml"), eid)
    if (after.get("status") or "") != verdict.get("verdict"):
        errors.append(f"epic status '{after.get('status')}' does not carry the "
                      f"verdict '{verdict.get('verdict')}' — /launch is not actually "
                      "gated (F6)")

    # --- surgical write (F11) ------------------------------------------------------
    before = spine_entry(args.spine_before, eid)
    verdict_pass = verdict.get("verdict") == "validated"
    for key in set(list(before.keys()) + list(after.keys())):
        if key in ("status", "metadata"):
            continue
        if key == "surface_verified":
            # the stamp may flip surface_verified to true on a PASS only (the
            # surface-parity gate passed, surface-contract.md / ADR 022); on a
            # fail it must be untouched.
            if verdict_pass and after.get(key) is True:
                continue
            if not verdict_pass and before.get(key) == after.get(key):
                continue
            errors.append("surface_verified may only be stamped true on a "
                          "validated verdict (F11)")
            continue
        if before.get(key) != after.get(key):
            errors.append(f"epic field '{key}' changed — the stamp is status + "
                          "metadata (+ surface_verified on a pass) only (F11)")
    meta_b = dict(before.get("metadata") or {})
    meta_a = dict(after.get("metadata") or {})
    meta_b.pop("version", None)
    meta_a.pop("version", None)
    if meta_b != meta_a:
        errors.append("epic metadata changed beyond version (F11)")

    # --- report present + cited on fail (F7) ---------------------------------------
    if verdict.get("verdict") == "fix_required":
        try:
            report = load_yaml(args.report_yaml)
            for f in (report.get("findings") or []):
                if not (f.get("citation") or "").strip() or \
                        not (f.get("location") or "").strip():
                    errors.append(f"report finding uncited: {f.get('id')} (F7)")
            if not (report.get("findings") or []):
                errors.append("fix_required with an empty findings list — "
                              "nothing for implement to fix (F7)")
        except Exception as exc:
            errors.append(f"report.yaml unreadable on a failed run: {exc} (F7)")
        try:
            with open(args.report_md, "r", encoding="utf-8") as fh:
                if "Fix exactly these" not in fh.read():
                    errors.append("report.md missing the fix list (F7)")
        except Exception as exc:
            errors.append(f"report.md unreadable on a failed run: {exc} (F7)")

    out = {"ok": not errors, "errors": errors}
    print(json.dumps(out, indent=2))
    sys.exit(0 if out["ok"] else 1)


if __name__ == "__main__":
    main()
