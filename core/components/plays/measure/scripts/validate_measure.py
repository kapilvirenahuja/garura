#!/usr/bin/env python3
"""
validate_measure.py — validate /measure's drafted lens before the checkpoint.

Mechanical enforcement of the measure ICE over the draft on disk:

  - C3/F2  complete claims: every metric carries why, direction, baseline
           (value + as_of; a numeric value requires a source; the honest alternative is
           the literal value "unmeasured"), target (value + horizon), proof
           (source + signal).
  - C4/F4  triangle-primary: every claimed metric's framework is `triangle` — industry
           frames (dora/flow/space/dx) are derived translations, never first-class claims.
  - C7/F7  delivery-only: every metric name is in the triangle vocabulary
           (speed | tokens | cognition | one-shot) — anything else is treated as
           product-outcome smuggling and fails.
  - C6/F6  producible proof: every proof.source names a pipe-readable source (timestamps,
           token dashboard, gate reports, launch records, git/CI) — an unrecognized
           source fails; the recovery is a producible source or a recorded gap proposal.
  - S5     axis coverage: each triangle axis (speed, tokens, cognition) appears either as
           a claim or in an out_of_scope entry — never silently absent.
  - C2/F5  forbidden grounds: nothing in the manifest grounds on the architecture or run
           lens, or on another slice; `source_type: lens` grounds may name only this
           slice's quality/ux/agentic lens.
  - C5/F3  manifest coverage: every claimed metric and every out_of_scope entry has a
           manifest choice (aspect `metric:<name>` / `out_of_scope:<...>`); grounding
           resolution itself is check_kb_grounding.py's job.
  - envelope: type is `measure`, slice_ref present, content keys are exactly within
           focus/metrics/out_of_scope, focus non-empty, >=1 metric.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_measure.py --draft <draft_dir> \
            --manifest <draft>/measure-manifest.yaml --slice-ref <domain>/<slice-id>

Prints {ok, errors[]} JSON. Exit 0 clean, 1 on violation, 2 usage/parse error.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_measure.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

CONTENT_KEYS = {"focus", "metrics", "out_of_scope"}
TRIANGLE_METRICS = ("speed", "tokens", "cognition", "one-shot")
AXES = ("speed", "tokens", "cognition")
DIRECTIONS = ("improve", "hold")
PRODUCIBLE_HINTS = ("timestamp", "pipe", "token", "gate", "launch", "git", "ci")
FORBIDDEN_GROUND_HINTS = ("architecture.yaml", "run.yaml", "lens/architecture", "lens/run")
TRINITY_LENS_HINTS = ("quality.yaml", "ux.yaml", "agentic.yaml")


def _load(path):
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def _is_unmeasured(value):
    return isinstance(value, str) and value.strip().lower() == "unmeasured"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /measure's drafted lens.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--slice-ref", required=True)
    args = ap.parse_args(argv)

    errors = []

    lenses = glob.glob(os.path.join(args.draft, "**", "lens", "measure.yaml"),
                       recursive=True)
    if len(lenses) != 1:
        print(json.dumps({"ok": False, "errors": [
            f"expected exactly one drafted lens/measure.yaml under {args.draft}, found {len(lenses)}"]},
            indent=2))
        return 1
    try:
        doc = _load(lenses[0]) or {}
        manifest = _load(args.manifest) or {}
    except Exception as exc:  # noqa: BLE001 — surface any parse failure as a gap
        print(json.dumps({"ok": False, "errors": [f"parse failure: {exc}"]}, indent=2))
        return 2

    lens = doc.get("lens", doc)

    # --- envelope ------------------------------------------------------------
    if lens.get("type") != "measure":
        errors.append("envelope: lens.type must be 'measure'")
    if not lens.get("slice_ref"):
        errors.append("envelope: lens.slice_ref is missing")
    elif lens["slice_ref"] != args.slice_ref:
        errors.append(f"envelope: slice_ref {lens['slice_ref']!r} != run target {args.slice_ref!r} (C1)")
    content = lens.get("content") or {}
    extra = set(content) - CONTENT_KEYS
    if extra:
        errors.append(f"content: keys outside focus/metrics/out_of_scope: {sorted(extra)} (C7/F7)")
    if not (content.get("focus") or "").strip():
        errors.append("content: focus is missing or empty")
    metrics = content.get("metrics") or []
    if not metrics:
        errors.append("content: at least one metric claim is required (C3)")

    # --- per-claim checks ----------------------------------------------------
    claimed_names = []
    for i, m in enumerate(metrics):
        tag = f"metrics[{i}]"
        name = (m.get("metric") or "").strip()
        claimed_names.append(name)
        if m.get("framework") != "triangle":
            errors.append(f"{tag}: framework {m.get('framework')!r} — industry frames are derived, "
                          "never first-class claims; only 'triangle' may be claimed (C4/F4)")
        if name not in TRIANGLE_METRICS:
            errors.append(f"{tag}: metric {name!r} is outside the triangle vocabulary "
                          f"{TRIANGLE_METRICS} — delivery measurement only (C7/F7)")
        if not (m.get("why") or "").strip():
            errors.append(f"{tag}: why is missing — tie the claim to hub/trinity content (C3)")
        if m.get("direction") not in DIRECTIONS:
            errors.append(f"{tag}: direction must be improve|hold (C3)")
        baseline = m.get("baseline") or {}
        b_value = baseline.get("value")
        if b_value in (None, ""):
            errors.append(f"{tag}: baseline.value is missing (C3/F2)")
        elif not _is_unmeasured(b_value) and not (baseline.get("source") or "").strip():
            errors.append(f"{tag}: baseline {b_value!r} has no source — a number needs a source, "
                          "or the value is the literal 'unmeasured' (C3/F2)")
        if not (str(baseline.get("as_of") or "")).strip():
            errors.append(f"{tag}: baseline.as_of is missing (C3)")
        target = m.get("target") or {}
        if not (str(target.get("value") or "")).strip():
            errors.append(f"{tag}: target.value is missing (C3)")
        if not (str(target.get("horizon") or "")).strip():
            errors.append(f"{tag}: target.horizon is missing (C3)")
        proof = m.get("proof") or {}
        p_source = (proof.get("source") or "").strip()
        if not p_source:
            errors.append(f"{tag}: proof.source is missing (C3/C6)")
        elif not any(h in p_source.lower() for h in PRODUCIBLE_HINTS):
            errors.append(f"{tag}: proof.source {p_source!r} names no pipe-readable source "
                          f"(expects one of {PRODUCIBLE_HINTS}) — swap it or record a gap "
                          "proposal (C6/F6)")
        if not (proof.get("signal") or "").strip():
            errors.append(f"{tag}: proof.signal is missing (C3/C6)")

    # --- axis coverage (S5) ----------------------------------------------------
    oos = [str(x) for x in (content.get("out_of_scope") or [])]
    for axis in AXES:
        in_claims = axis in claimed_names
        in_oos = any(axis in entry.lower() for entry in oos)
        if not in_claims and not in_oos:
            errors.append(f"axis '{axis}' is neither claimed nor in out_of_scope — "
                          "never silently absent (S5)")

    # --- manifest: forbidden grounds + coverage --------------------------------
    mroot = manifest.get("measure", manifest) or {}
    choices = mroot.get("choices") or []
    aspects = {(c.get("aspect") or "").strip() for c in choices}
    for c in choices:
        for g in (c.get("grounds") or []):
            src = str(g.get("source") or "")
            low = src.lower()
            if any(h in low for h in FORBIDDEN_GROUND_HINTS):
                errors.append(f"manifest choice {c.get('aspect')!r}: grounds on the "
                              f"architecture/run lens ({src}) — forbidden (C2/F5)")
            if g.get("source_type") == "lens" and not any(h in low for h in TRINITY_LENS_HINTS):
                errors.append(f"manifest choice {c.get('aspect')!r}: lens ground {src!r} is not "
                              "this slice's quality/ux/agentic lens (C2/F5)")
            if args.slice_ref.split("/")[-1] not in src and "slices/" in low:
                errors.append(f"manifest choice {c.get('aspect')!r}: grounds on another slice "
                              f"({src}) (C1/F5)")
    for name in claimed_names:
        if name and f"metric:{name}" not in aspects:
            errors.append(f"claimed metric {name!r} has no manifest choice 'metric:{name}' (C5/F3)")
    for entry in oos:
        if not any(a.startswith("out_of_scope:") for a in aspects):
            errors.append("out_of_scope entries present but no out_of_scope:* manifest choice (C5/F3)")
            break

    result = {"ok": not errors, "errors": errors}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
