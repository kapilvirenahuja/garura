#!/usr/bin/env python3
"""
check_gates.py — quality-gate + profile-benchmark + surface gate for /validate
(C11/F3, C13/F13).

Green is the entry, the profile floor is the bar
(KB: technology/validation-floor-profile-benchmarks):

  gates      — every gate the slice's quality lens declares must map to a
               captured check result (by gate id == check_id, or the gate's
               declared check ref); a gate with no captured result is a
               finding — an unmeasured bar is not a passed bar.
  benchmarks — every benchmark the product profile declares for a measure the
               results carry (or a declared mandatory measure) is compared
               against the captured `measures`; below the floor = finding,
               regardless of the tool being green. Direction per benchmark:
               floor (>=) or ceiling (<=).
  surface    — the epic's declared `surface.type` (surface-contract.md) maps to
               exactly one required runnable check. A captured result must carry
               `surface_check: <type>` matching the epic's `surface.type` and
               status pass — a real browser check that opened each `must_open`
               artifact (web_dashboard), an HTTP/API call to the declared
               endpoint (server_api), a run of `human_run_target` (cli), or the
               library/service's own tests. A required surface that was not
               measured, or whose captured surface result does not match the
               declared type, is a finding — "no browser/API probes available"
               does NOT waive the check, it fails it (F13). Verdict ⇒
               fix_required.

Layer rule: asserts over captured files only; runs nothing.

    python3 check_gates.py --quality-lens <quality.yaml> --profile <profile.yaml>
        --results-dir <dir> --out <gates-map.json> [--epic-file <epic.yaml>]

Prints {ok, gates[], benchmarks[], surface{}, findings[], errors[]}.
Exit 0 all satisfied, 1 findings, 2 usage.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_gates.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main():
    ap = argparse.ArgumentParser(description="/validate gate + benchmark check.")
    ap.add_argument("--quality-lens", required=True)
    ap.add_argument("--profile", required=True)
    ap.add_argument("--results-dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--epic-file", default=None,
                    help="the epic.yaml whose surface.type the run must measure (C13/F13)")
    args = ap.parse_args()

    # surface types and whether each requires a user-reachable run surface.
    SURFACE_REQUIRES_RUN = {"web_dashboard", "server_api", "cli"}
    SURFACE_ALL = SURFACE_REQUIRES_RUN | {"library", "service_read_model"}

    errors = []
    findings = []

    results = {}
    measures = {}
    for path in glob.glob(os.path.join(args.results_dir, "*.json")):
        name = os.path.basename(path)
        if name == "summary.json" or name.endswith(".check.json"):
            continue
        try:
            with open(path, "r", encoding="utf-8") as fh:
                rec = json.load(fh)
        except Exception as exc:
            errors.append(f"result unreadable: {path}: {exc}")
            continue
        results[rec.get("check_id")] = rec
        for metric, value in (rec.get("measures") or {}).items():
            measures[metric] = {"value": value, "check_id": rec.get("check_id"),
                                "raw_log_path": rec.get("raw_log_path")}

    # --- quality-lens gates (C11) ----------------------------------------------
    gates_out = []
    try:
        lens = load(args.quality_lens)
        gates = ((lens.get("content") or lens).get("gates")
                 or lens.get("gates") or [])
    except Exception as exc:
        gates = []
        errors.append(f"quality lens unreadable: {exc}")
    for gate in gates:
        gid = gate.get("id") if isinstance(gate, dict) else str(gate)
        ref = (gate.get("check") if isinstance(gate, dict) else None) or gid
        rec = results.get(ref)
        entry = {"gate": gid, "check_id": ref,
                 "status": rec["status"] if rec else "unmeasured"}
        gates_out.append(entry)
        if rec is None:
            findings.append({"kind": "gate-unmeasured", "id": gid,
                             "citation": f"quality lens gate '{gid}' has no captured "
                                         f"result for check '{ref}'",
                             "location": args.quality_lens})
        elif rec["status"] != "pass":
            findings.append({"kind": "gate-failed", "id": gid,
                             "citation": f"check '{ref}' status={rec['status']}: "
                                         f"{rec.get('summary', '')}",
                             "location": rec.get("raw_log_path") or ref})

    # --- profile benchmarks (the floor) -----------------------------------------
    bench_out = []
    try:
        profile = load(args.profile)
        benches = (profile.get("benchmarks")
                   or (profile.get("profile") or {}).get("benchmarks") or [])
    except Exception as exc:
        benches = []
        errors.append(f"profile unreadable: {exc}")
    for bench in benches:
        metric = bench.get("metric")
        floor = bench.get("floor")
        ceiling = bench.get("ceiling")
        got = measures.get(metric)
        entry = {"metric": metric, "floor": floor, "ceiling": ceiling,
                 "value": got["value"] if got else None}
        bench_out.append(entry)
        if got is None:
            if bench.get("mandatory", True):
                findings.append({"kind": "benchmark-unmeasured", "id": metric,
                                 "citation": f"profile declares '{metric}' "
                                             f"(floor={floor}, ceiling={ceiling}) but no "
                                             "captured result measures it — an unmeasured "
                                             "bar is not a passed bar",
                                 "location": args.profile})
            continue
        if floor is not None and got["value"] < floor:
            findings.append({"kind": "benchmark-below-floor", "id": metric,
                             "citation": f"'{metric}' = {got['value']} < floor {floor} "
                                         f"(check '{got['check_id']}') — green is the "
                                         "entry, the floor is the bar",
                             "location": got.get("raw_log_path") or got["check_id"]})
        if ceiling is not None and got["value"] > ceiling:
            findings.append({"kind": "benchmark-above-ceiling", "id": metric,
                             "citation": f"'{metric}' = {got['value']} > ceiling {ceiling} "
                                         f"(check '{got['check_id']}')",
                             "location": got.get("raw_log_path") or got["check_id"]})

    # --- surface contract (C13/F13) ---------------------------------------------
    surface_out = {}
    if args.epic_file:
        try:
            epic_doc = load(args.epic_file)
            epic = epic_doc.get("epic") or epic_doc
            surface = epic.get("surface") or {}
            stype = (surface.get("type") or "").strip()
        except Exception as exc:
            stype = ""
            errors.append(f"epic unreadable for surface check: {exc}")
        if stype and stype not in SURFACE_ALL:
            findings.append({"kind": "surface-unknown-type", "id": stype,
                             "citation": f"epic surface.type '{stype}' is not a "
                                         "surface-contract type — declare one of "
                                         f"{sorted(SURFACE_ALL)} (C13)",
                             "location": args.epic_file})
        elif stype:
            # the captured result claiming to measure this surface
            matched = [r for r in results.values()
                       if (r or {}).get("surface_check")]
            for r in matched:
                if r.get("surface_check") != stype:
                    findings.append(
                        {"kind": "surface-mismatch", "id": r.get("check_id"),
                         "citation": f"captured surface result measures "
                                     f"'{r.get('surface_check')}' but the epic declares "
                                     f"surface.type '{stype}' — a {stype} promise is not "
                                     "measured by a different surface (F13)",
                         "location": r.get("raw_log_path") or r.get("check_id")})
            on_type = [r for r in matched if r.get("surface_check") == stype]
            passing = [r for r in on_type if r.get("status") == "pass"]
            surface_out = {"type": stype,
                           "required_run": stype in SURFACE_REQUIRES_RUN,
                           "measured": bool(passing),
                           "check_ids": [r.get("check_id") for r in on_type]}
            if not on_type:
                findings.append(
                    {"kind": "surface-unmeasured", "id": stype,
                     "citation": f"epic declares surface.type '{stype}' but no captured "
                                 f"result carries surface_check: {stype} — the required "
                                 "runnable check (surface-contract.md) was never run; "
                                 "the absence of a probe FAILS the surface, it does not "
                                 "waive it (F13)",
                     "location": args.epic_file})
            elif not passing:
                worst = on_type[0]
                findings.append(
                    {"kind": "surface-failed", "id": stype,
                     "citation": f"the surface check for '{stype}' did not pass "
                                 f"(status={worst.get('status')}: {worst.get('summary', '')})",
                     "location": worst.get("raw_log_path") or worst.get("check_id")})

    out = {"ok": not findings and not errors, "gates": gates_out,
           "benchmarks": bench_out, "surface": surface_out,
           "findings": findings, "errors": errors}
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    sys.exit(0 if out["ok"] else 1)


if __name__ == "__main__":
    main()
