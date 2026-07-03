#!/usr/bin/env python3
"""
check_gates.py — quality-gate + measure-benchmark + surface gate for /validate
(C11/F3, C13/F13).

Green is the entry, the declared bar is the bar. In the spine + grounding model the
gate and benchmark DEFINITIONS live in the slice's lens GROUNDING DOCS (Markdown), not
in YAML lens files or a standalone profile:

  gates      — every gate the slice's QUALITY lens (`quality.md` "## Gates" table:
               Dimension | Bar | How checked) declares must map to a captured check
               result (by check_id == the gate's dimension slug). A gate with no
               captured result is a finding — an unmeasured bar is not a passed bar.
  benchmarks — every metric the slice's MEASURE lens (`measure.md` "## Metrics" table:
               Metric | Baseline | Target | Proof) declares must be captured. Where the
               Target cell yields a comparator + number (e.g. "< 2s", ">= 100", "0 ..."),
               the captured value is compared against it (floor/ceiling); where the
               target is prose-only, the metric is presence-required. (The structured
               floor/ceiling numbers the old profile carried now live as prose targets
               in the measure lens — see the spine+grounding migration.)
  surface    — the epic's declared `surface_type` (read from the spine epics entry) maps
               to exactly one required runnable check (surface-contract.md), unchanged.

Layer rule: asserts over captured files only; runs nothing.

    python3 check_gates.py --quality-lens <quality.md> --measure-lens <measure.md>
        --results-dir <dir> --out <gates-map.json> [--product-base <pb> --epic <epic-id>]

Prints {ok, gates[], benchmarks[], surface{}, findings[], errors[]}.
Exit 0 all satisfied, 1 findings, 2 usage.
"""

import argparse
import glob
import json
import os
import re
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_gates.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", str(text).strip().lower()).strip("-")


def read_text(path):
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


def parse_md_table(text, section):
    """Return the rows (list of dicts keyed by header) of the markdown table under the
    given '## <section>' heading. Ignores fenced code blocks."""
    rows = []
    in_section = False
    in_fence = False
    headers = None
    for raw in text.splitlines():
        s = raw.strip()
        if s.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if s.startswith("## "):
            in_section = (s[3:].strip().lower() == section.strip().lower())
            headers = None
            continue
        if not in_section or not s.startswith("|"):
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        if set("".join(cells)) <= set("-: "):      # the |---|---| separator row
            continue
        if headers is None:
            headers = [c.lower() for c in cells]
            continue
        rows.append(dict(zip(headers, cells)))
    return rows


def parse_target(text):
    """Tolerantly read a comparator + number out of a prose target cell.
    Returns (floor, ceiling) where either may be None."""
    if not text:
        return None, None
    m = re.search(r"(<=|<|>=|>)\s*([0-9]+(?:\.[0-9]+)?)", text)
    if m:
        num = float(m.group(2))
        return (num, None) if m.group(1).startswith(">") else (None, num)
    m = re.search(r"\b([0-9]+(?:\.[0-9]+)?)\s*%", text)        # bare "100%" / "0 ..."
    if m:
        return float(m.group(1)), None
    m = re.match(r"\s*([0-9]+(?:\.[0-9]+)?)\b", text)
    if m:
        return float(m.group(1)), None
    return None, None                                          # prose-only → presence


def main():
    ap = argparse.ArgumentParser(description="/validate gate + benchmark check.")
    ap.add_argument("--quality-lens", required=True, help="the slice's quality.md")
    ap.add_argument("--measure-lens", required=True, help="the slice's measure.md")
    ap.add_argument("--results-dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--product-base", default=None,
                    help="product base — with --epic, enables the surface check (C13/F13)")
    ap.add_argument("--epic", default=None,
                    help="epic id whose spine surface_type the run must measure (C13/F13)")
    args = ap.parse_args()

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
            measures[slug(metric)] = {"value": value, "check_id": rec.get("check_id"),
                                      "raw_log_path": rec.get("raw_log_path")}

    # --- quality-lens gates (C11) — from quality.md "## Gates" table ------------
    gates_out = []
    try:
        rows = parse_md_table(read_text(args.quality_lens), "Gates")
        gates = [{"id": slug(r.get("dimension", "")), "bar": r.get("bar", "")}
                 for r in rows if r.get("dimension")]
    except Exception as exc:
        gates = []
        errors.append(f"quality lens unreadable: {exc}")
    for gate in gates:
        gid = gate["id"]
        rec = results.get(gid)
        gates_out.append({"gate": gid, "check_id": gid,
                          "status": rec["status"] if rec else "unmeasured"})
        if rec is None:
            findings.append({"kind": "gate-unmeasured", "id": gid,
                             "citation": f"quality lens gate '{gid}' ({gate['bar']}) has no "
                                         f"captured result for check '{gid}'",
                             "location": args.quality_lens})
        elif rec["status"] != "pass":
            findings.append({"kind": "gate-failed", "id": gid,
                             "citation": f"check '{gid}' status={rec['status']}: "
                                         f"{rec.get('summary', '')}",
                             "location": rec.get("raw_log_path") or gid})

    # --- measure benchmarks — from measure.md "## Metrics" table ----------------
    bench_out = []
    try:
        rows = parse_md_table(read_text(args.measure_lens), "Metrics")
        benches = [{"metric": slug(r.get("metric", "")), "raw_metric": r.get("metric", ""),
                    "target": r.get("target", "")}
                   for r in rows if r.get("metric")]
    except Exception as exc:
        benches = []
        errors.append(f"measure lens unreadable: {exc}")
    for bench in benches:
        metric = bench["metric"]
        floor, ceiling = parse_target(bench["target"])
        got = measures.get(metric)
        bench_out.append({"metric": metric, "target": bench["target"],
                          "floor": floor, "ceiling": ceiling,
                          "value": got["value"] if got else None})
        if got is None:
            findings.append({"kind": "benchmark-unmeasured", "id": metric,
                             "citation": f"measure lens declares '{bench['raw_metric']}' "
                                         f"(target: {bench['target']}) but no captured "
                                         "result measures it — an unmeasured bar is not a "
                                         "passed bar",
                             "location": args.measure_lens})
            continue
        try:
            val = float(got["value"])
        except (TypeError, ValueError):
            continue                                           # non-numeric capture: presence only
        if floor is not None and val < floor:
            findings.append({"kind": "benchmark-below-floor", "id": metric,
                             "citation": f"'{metric}' = {val} < floor {floor} "
                                         f"(check '{got['check_id']}', target: {bench['target']})",
                             "location": got.get("raw_log_path") or got["check_id"]})
        if ceiling is not None and val > ceiling:
            findings.append({"kind": "benchmark-above-ceiling", "id": metric,
                             "citation": f"'{metric}' = {val} > ceiling {ceiling} "
                                         f"(check '{got['check_id']}', target: {bench['target']})",
                             "location": got.get("raw_log_path") or got["check_id"]})

    # --- surface contract (C13/F13) — read from the spine epics entry ------------
    surface_out = {}
    if args.product_base and args.epic:
        try:
            with open(os.path.join(args.product_base, "product-os", "_spine.yaml"),
                      encoding="utf-8") as fh:
                spine = yaml.safe_load(fh) or {}
            epic = next((e for e in (spine.get("epics") or [])
                         if isinstance(e, dict) and e.get("id") == args.epic.split("/")[-1]), None) or {}
            stype = (epic.get("surface_type") or "").strip()
        except Exception as exc:
            stype = ""
            errors.append(f"spine unreadable for surface check: {exc}")
        if stype and stype not in SURFACE_ALL:
            findings.append({"kind": "surface-unknown-type", "id": stype,
                             "citation": f"epic surface_type '{stype}' is not a "
                                         "surface-contract type — declare one of "
                                         f"{sorted(SURFACE_ALL)} (C13)",
                             "location": f"spine epics[{args.epic}]"})
        elif stype:
            matched = [r for r in results.values() if (r or {}).get("surface_check")]
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
                     "location": f"spine epics[{args.epic}]"})
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
