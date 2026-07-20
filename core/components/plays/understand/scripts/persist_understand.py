#!/usr/bin/env python3
"""
persist_understand.py — /understand's deterministic keyed persist, in place on the live model.

Direct-model-write remnant of the old apply_understand.py (ADR 026,
standards/rules/direct-model-write.md). There is NO draft tree and NO doc copy: the LLM
enrichment skill already wrote the per-node docs (capability.md, functionality.md) straight
to the live model. This script owns every SHARED file and applies the manifest's structured
spine-delta to the live model IN PLACE, keyed to --capability-ref:

  1. the target capability's spine entry: detail -> detailed, + nfr_needs + compliance_needs
     (+ doc/one_line if the manifest carries them). It refuses to mutate any OTHER capability
     entry — this is the node-level containment the file-level scoped guard cannot provide.
  2. the new `functionalities` entries from the manifest (each must carry capability == the
     target; additive — an id already present is left untouched).
  3. the rolled-up `profile` (the firmed box) from the proposed-profile.
  4. one decision record per approved box-move (ADR, level product, status accepted), each
     linked onto the target capability's `decisions` list.

It reads the manifest (STM, non-model) + the roll-up output; it does NOT read a draft tree
and does NOT copy docs. Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 persist_understand.py --enrich-manifest <enrich-manifest.yaml> \
        --product-base <product_base> --proposed-profile <proposed-profile.yaml> \
        --rollup-report <rollup.json> --capability-ref <cap-id> \
        --decided-by /understand --date <YYYY-MM-DD> --out-manifest <persist-manifest.json>

Exit 0 on success, 2 on usage/parse/containment error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("persist_understand.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def slug(text):
    return "".join(c if c.isalnum() else "-" for c in str(text).lower()).strip("-")


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def find(entries, eid):
    for e in entries:
        if isinstance(e, dict) and e.get("id") == eid:
            return e
    return None


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keyed in-place persist for /understand (ADR 026).")
    ap.add_argument("--enrich-manifest", required=True, help="enrich-manifest.yaml (STM, non-model)")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--proposed-profile", required=True, help="rolled-up profile yaml ({profile: ...})")
    ap.add_argument("--rollup-report", required=True)
    ap.add_argument("--capability-ref", required=True, help="the ONLY capability this run may mutate")
    ap.add_argument("--decided-by", default="/understand")
    ap.add_argument("--date", required=True, help="decision date (play passes it; never auto-generated)")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    cap_id = args.capability_ref
    live_root = os.path.join(args.product_base, "product-os")
    live_spine_path = os.path.join(live_root, "_spine.yaml")
    for p in (args.enrich_manifest, live_spine_path, args.proposed_profile, args.rollup_report):
        if not os.path.isfile(p):
            sys.stderr.write(f"persist_understand.py: missing input {p}\n")
            return 2

    man = load(args.enrich_manifest)
    enrich = man.get("enrich", man) if isinstance(man, dict) else {}
    live = load(live_spine_path)
    proposed_profile = (load(args.proposed_profile).get("profile") or {})

    # --- containment: the manifest must be about the target, nothing else -------------
    man_ref = enrich.get("capability_ref")
    if man_ref and man_ref != cap_id:
        sys.stderr.write(f"persist_understand.py: manifest capability_ref '{man_ref}' != "
                         f"--capability-ref '{cap_id}' — refusing (containment)\n")
        return 2

    written, changed = [], {"capability": None, "functionalities_added": [],
                            "profile": False, "decisions": []}

    # --- 1. the target capability entry: apply the manifest delta, keyed to cap_id -----
    live_caps = live.setdefault("capabilities", [])
    live_cap = find(live_caps, cap_id)
    if live_cap is None:
        sys.stderr.write(f"persist_understand.py: live spine has no capability '{cap_id}' to detail\n")
        return 2
    cap_delta = enrich.get("capability") or {}
    for field in ("detail", "nfr_needs", "compliance_needs", "one_line", "doc"):
        if field in cap_delta:
            live_cap[field] = cap_delta[field]
    if live_cap.get("detail") != "detailed":
        live_cap["detail"] = "detailed"      # promotion is guaranteed by construction
    changed["capability"] = cap_id

    # --- 2. new functionality entries (additive; every one must belong to cap_id) ------
    live_funcs = live.setdefault("functionalities", [])
    have = {f.get("id") for f in live_funcs if isinstance(f, dict)}
    for f in enrich.get("functionalities") or []:
        if not isinstance(f, dict):
            continue
        if f.get("capability") != cap_id:
            sys.stderr.write(f"persist_understand.py: functionality '{f.get('id')}' is not under "
                             f"'{cap_id}' — refusing (containment)\n")
            return 2
        if f.get("id") not in have:
            live_funcs.append(f)
            have.add(f.get("id"))
            changed["functionalities_added"].append(f.get("id"))

    # --- 3. the rolled-up profile (replace the box) ------------------------------------
    live["profile"] = proposed_profile
    changed["profile"] = True

    # --- 4. one decision per approved box-move; link its id onto the capability --------
    report = json.load(open(args.rollup_report, encoding="utf-8"))
    moves = report.get("box_moves", [])
    if moves:
        dec_dir = os.path.join(live_root, "decisions")
        os.makedirs(dec_dir, exist_ok=True)
        cap_decisions = live_cap.setdefault("decisions", [])
        for mv in moves:
            dim, frm, to = mv["dimension"], mv["from"], mv["to"]
            did = f"dec-{slug(cap_id)}-{slug(dim)}-{slug(frm)}-{slug(to)}"
            decision = {"decision": {
                "id": did, "node_ref": cap_id, "level": "product",
                "title": f"Move {dim} box {frm} -> {to} for {cap_id}",
                "reason": (f"The {cap_id} capability's need on {dim} ({to}) exceeds the "
                           f"committed box ({frm}); the box is raised to admit it."),
                "alternatives": [{"name": f"keep {dim} at {frm}",
                                  "why_not": f"would block {cap_id}'s required {dim} level"}],
                "status": "accepted", "superseded_by": None,
                "metadata": {"decided_by": args.decided_by, "date": args.date, "version": 1},
            }}
            dpath = os.path.join(dec_dir, f"{did}.yaml")
            with open(dpath, "w", encoding="utf-8") as fh:
                yaml.safe_dump(decision, fh, sort_keys=False)
            written.append(f"decision:{did}")
            changed["decisions"].append(did)
            if did not in cap_decisions:
                cap_decisions.append(did)

    # --- write the mutated live spine back ---------------------------------------------
    with open(live_spine_path, "w", encoding="utf-8") as fh:
        yaml.safe_dump(live, fh, sort_keys=False, allow_unicode=True)
    written.append("spine:_spine.yaml")

    manifest = {"written": written, "capability_ref": cap_id, "changed": changed, "box_moves": moves}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
