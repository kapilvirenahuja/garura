#!/usr/bin/env python3
"""
check_output.py — the /next output enforcer (C2-C8, F1/F3/F4/F5/F6).

Mechanical verdict over the finished recommendations artifact. Checks:

  F3/C2  read-only proof ......... the model hash from the BEFORE scan equals
                                   the AFTER scan (the play wrote nothing).
  F1/C8  freshness + determinism . the AFTER-state re-derivation produced the
                                   same derivation_hash as the one the ranking
                                   consumed; every recommended entry maps to a
                                   candidate that is STILL runnable.
  F5/C3  explanations ............ every entry carries command + a plain-text
                                   `why` (non-trivial length) + `unblocks`.
  F5/C4  the cap ................. nba + entries <= 11 total; nba present.
  C5     repair takes the NBA .... when inconsistencies exist, the NBA is a
                                   repair-lane entry.
  F4/C7  thin-history rule ....... when the operator profile says
                                   thin_history, no entry carries a
                                   fit_reason and the artifact carries a
                                   fit_notice.
  F6     coverage ................ every RUNNABLE candidate either appears as
                                   an entry or is listed in cut_for_cap (no
                                   silent omission).
  C3     blockers named .......... every blocked entry names its blocker.

Layer rule: asserts over files already on disk; no git/gh/network.

    python3 check_output.py --recommendations <recommendations.yaml> \
        --candidates <candidates.json> --candidates-after <candidates-after.json> \
        --state-before <model-state.json> --state-after <model-state-after.json> \
        --profile <operator-profile.json>

Prints a PASS/GAP report. Exit 0 all pass, 1 any gap, 2 usage error.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_output.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

CAP = 11
MIN_WHY = 40  # chars — a real sentence, not a label


def jload(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def main(argv=None):
    ap = argparse.ArgumentParser(description="/next output enforcer.")
    ap.add_argument("--recommendations", required=True)
    ap.add_argument("--candidates", required=True)
    ap.add_argument("--candidates-after", required=True)
    ap.add_argument("--state-before", required=True)
    ap.add_argument("--state-after", required=True)
    ap.add_argument("--profile", required=True)
    args = ap.parse_args(argv)

    gaps = []
    with open(args.recommendations, encoding="utf-8") as fh:
        rec = yaml.safe_load(fh) or {}
    cands = jload(args.candidates)
    cands_after = jload(args.candidates_after)
    before = jload(args.state_before)
    after = jload(args.state_after)
    profile = jload(args.profile)

    # ---- F3/C2: read-only proof ------------------------------------------
    if before.get("model_hash") != after.get("model_hash"):
        gaps.append("F3/C2: model hash changed during the run "
                    f"({before.get('model_hash')} -> {after.get('model_hash')}) "
                    "— the play (or something concurrent) wrote to the model")

    # ---- F1/C8: determinism + freshness ------------------------------------
    if cands.get("derivation_hash") != cands_after.get("derivation_hash"):
        gaps.append("F1/C8: re-derivation on the after-state produced a different "
                    "candidate set — derivation is not deterministic or the model "
                    "moved mid-run")

    nba = rec.get("nba")
    entries = rec.get("entries") or []
    all_entries = ([nba] if nba else []) + entries
    runnable_ids = {c["id"] for c in cands_after.get("candidates", [])
                    if c.get("status") == "runnable"}
    blocked_ids = {c["id"] for c in cands_after.get("candidates", [])
                   if c.get("status") == "blocked"}
    known_ids = runnable_ids | blocked_ids

    # ---- F5/C4: the cap + NBA present --------------------------------------
    if not nba:
        gaps.append("F5/C4: no next-best-action (nba) in the artifact")
    if len(all_entries) > CAP:
        gaps.append(f"F5/C4: {len(all_entries)} entries including the NBA — cap is {CAP}")

    # ---- per-entry checks ---------------------------------------------------
    for i, e in enumerate(all_entries):
        label = "nba" if (nba and i == 0) else f"entry[{i if not nba else i-1}]"
        e = e or {}
        cid = e.get("candidate_id")
        if not e.get("command"):
            gaps.append(f"F5/C3: {label} has no command")
        if len((e.get("why") or "").strip()) < MIN_WHY:
            gaps.append(f"F5/C3: {label} `why` is missing or too short to be an "
                        f"explanation (< {MIN_WHY} chars)")
        if cid not in known_ids:
            gaps.append(f"F1: {label} candidate_id '{cid}' is not in the "
                        "re-derived candidate set — stale or invented")
        elif cid in blocked_ids:
            if not e.get("blocker"):
                gaps.append(f"C3: {label} is blocked but names no blocker")
        if profile.get("thin_history") and e.get("fit_reason"):
            gaps.append(f"F4/C7: {label} carries a fit_reason while the operator "
                        "history is thin — fit weighting must be skipped")

    # ---- C5: repair takes the NBA slot --------------------------------------
    if cands_after.get("inconsistencies"):
        nba_cand = next((c for c in cands_after.get("candidates", [])
                         if nba and c["id"] == (nba or {}).get("candidate_id")), None)
        if not nba_cand or nba_cand.get("lane") != "repair":
            gaps.append("C5: the model has inconsistencies but the NBA is not a "
                        "repair-lane action")

    # ---- F4/C7: thin-history notice -----------------------------------------
    if profile.get("thin_history") and not (rec.get("fit_notice") or "").strip():
        gaps.append("F4/C7: thin history but the artifact carries no fit_notice")

    # ---- F6: coverage — no silent omission ----------------------------------
    listed = {e.get("candidate_id") for e in all_entries if e}
    cut = set(rec.get("cut_for_cap") or [])
    missing = sorted(runnable_ids - listed - cut)
    if missing:
        gaps.append("F6: runnable candidate(s) neither listed nor declared "
                    "cut_for_cap: " + ", ".join(missing))

    report = {"ok": not gaps, "gaps": gaps,
              "entries_total": len(all_entries), "cap": CAP,
              "runnable_candidates": len(runnable_ids),
              "inconsistencies": len(cands_after.get("inconsistencies", [])),
              "thin_history": bool(profile.get("thin_history"))}
    print(json.dumps(report, indent=2))
    return 0 if not gaps else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
