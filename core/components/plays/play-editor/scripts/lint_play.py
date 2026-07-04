#!/usr/bin/env python3
"""
lint_play.py — mechanical consistency check for a compiled play.

The skill keeps the judgment (interviewing, generating, deciding). This script does
the counting the model should not waste tokens doing by hand — and would sometimes
get wrong: coverage, one-recovery-per-failure, dangling references, missing sections,
and a real (non-placeholder) fingerprint.

It is NOT a substitute for thought. It can tell whether an eval *exists*, not whether
it is *meaningful*; whether a constraint is *referenced*, not whether it is truly
structural. Treat a clean run as "the mechanical wiring holds" and a gap as "fix the
wiring" — writing the missing eval/recovery/section is still the model's job.

Usage:   python3 lint_play.py <path-to-compiled-play.md>
Exit:    0 = clean, 1 = gaps found, 2 = could not read the file.

Checks
  - Required sections present (matched anywhere in a header — a phase counts).
  - Every declared constraint / failure / scenario is covered:
        failure    -> referenced by a step eval
        scenario   -> referenced by a scenario eval
        constraint -> referenced in pre-flight or a step eval (else: confirm structural)
  - Exactly one recovery entry per failure condition.
  - No orphans: nothing references a C/F/S outside the declared set.
  - The Compilation Metadata carries a real fingerprint (not a placeholder).

The "declared set" comes from the "Compiled From" section, which states the ranges
(e.g. "constraints (C1-C7) ... failure conditions (F1-F4) ... scenarios (S1-S2)").
That is the source of truth for what must exist; references outside it are orphans.
"""

import os
import re
import sys

REQUIRED_SECTIONS = [
    "Compiled From",
    "Role",
    "Pre-flight",
    "Task DAG",
    "Workflow",
    "Scenario Validation",
    "Recovery",
    "Pause and Resume",
    "Compilation Metadata",
]

DASHES = r"[-‐‑‒–—]"  # ascii hyphen + common unicode dashes


def find_header(text, title):
    """First markdown header line containing <title>; returns (match, level) or (None, None)."""
    for m in re.finditer(r"(?m)^(#{1,6})\s+(.*)$", text):
        if title.lower() in m.group(2).lower():
            return m, len(m.group(1))
    return None, None


def section_body(text, title):
    """Body under the header containing <title>, up to the next header of equal/higher level."""
    m, level = find_header(text, title)
    if not m:
        return None
    start = m.end()
    for nxt in re.finditer(r"(?m)^(#{1,6})\s", text[start:]):
        if len(nxt.group(1)) <= level:
            return text[start: start + nxt.start()]
    return text[start:]


def collect_ids(text, prefix):
    """IDs like C1/F2/S3 in text — including ranges (C1-C7 -> C1..C7), as a set of numbers."""
    found = set()
    if not text:
        return found
    for m in re.finditer(rf"{prefix}(\d+)\s*{DASHES}\s*{prefix}?(\d+)", text):
        lo, hi = int(m.group(1)), int(m.group(2))
        if hi >= lo:
            found |= {str(i) for i in range(lo, hi + 1)}
    found |= set(re.findall(rf"\b{prefix}(\d+)\b", text))
    return found


def fmt(prefix, nums):
    return ", ".join(prefix + n for n in sorted(nums, key=int))


def main(argv):
    if len(argv) != 2:
        print("usage: python3 lint_play.py <compiled-play.md>", file=sys.stderr)
        return 2
    try:
        with open(argv[1], encoding="utf-8") as fh:
            text = fh.read()
    except OSError as exc:
        print(f"cannot read {argv[1]}: {exc}", file=sys.stderr)
        return 2

    results = []  # (ok, label, detail)

    # --- required sections --------------------------------------------------
    missing = [s for s in REQUIRED_SECTIONS if find_header(text, s)[0] is None]
    results.append((not missing, "required sections",
                    "all present" if not missing else "missing: " + ", ".join(missing)))

    # --- declared set (source of truth) -------------------------------------
    cf = section_body(text, "Compiled From")
    dC, dF, dS = (collect_ids(cf, p) for p in "CFS")
    if not (dC or dF or dS):
        results.append((False, "declared set",
                        "could not read C/F/S ranges from 'Compiled From' — coverage "
                        "and orphan checks below are unreliable"))

    # --- where ids are referenced -------------------------------------------
    workflow = section_body(text, "Workflow") or ""
    scen_val = section_body(text, "Scenario Validation") or ""
    preflight = section_body(text, "Pre-flight") or ""
    recovery = section_body(text, "Recovery") or ""

    step_F = collect_ids(workflow, "F")
    step_C = collect_ids(workflow, "C")
    scen_S = collect_ids(scen_val, "S")
    pre_C = collect_ids(preflight, "C")
    rec_F = collect_ids(recovery, "F")

    # --- coverage -----------------------------------------------------------
    if dF:
        miss = dF - step_F
        results.append((not miss, "failure coverage",
                        "every failure has a step eval" if not miss
                        else "no step eval references: " + fmt("F", miss)))
    if dS:
        miss = dS - scen_S
        results.append((not miss, "scenario coverage",
                        "every scenario has a scenario eval" if not miss
                        else "no scenario eval references: " + fmt("S", miss)))
    if dC:
        miss = dC - (pre_C | step_C)
        results.append((not miss, "constraint coverage",
                        "every constraint is in pre-flight or a step eval" if not miss
                        else "not referenced in pre-flight or any eval (confirm structural): "
                             + fmt("C", miss)))

    # --- recovery one-per-failure ------------------------------------------
    if dF:
        problems = []
        for f in sorted(dF, key=int):
            n = len(re.findall(rf"\bF{f}\b", recovery))
            if n != 1:
                problems.append(f"F{f}: {'no recovery' if n == 0 else f'{n} recovery rows'}")
        results.append((not problems, "recovery 1:1",
                        "exactly one recovery per failure" if not problems else "; ".join(problems)))

    # --- orphans ------------------------------------------------------------
    if dC or dF or dS:
        orphans = []
        for prefix, declared, refs in (("C", dC, pre_C | step_C),
                                       ("F", dF, step_F | rec_F),
                                       ("S", dS, scen_S)):
            orphans += [prefix + n for n in sorted(refs - declared, key=int)]
        results.append((not orphans, "no orphans",
                        "no references to undeclared C/F/S" if not orphans
                        else "references to undeclared ids: " + ", ".join(orphans)))

    # --- D2: pipeline position (frontmatter) --------------------------------
    fm = re.match(r"(?s)^---\n(.*?)\n---", text)
    pos_ok, pos_detail = False, "frontmatter missing or has no 'position' field (D2)"
    if fm:
        pm = re.search(r"(?m)^position:\s*(\S+)\s*$", fm.group(1))
        if pm:
            val = pm.group(1).strip().strip("\"'")
            if val in {"start", "end", "both", "none"}:
                pos_ok, pos_detail = True, f"position: {val}"
            else:
                pos_detail = f"invalid position '{val}' (must be start|end|both|none)"
    results.append((pos_ok, "pipeline position (D2)", pos_detail))

    # --- D2b: durable model writes ride the end pipeline (#437) -------------
    # A play that persists durable product-model artifacts must not declare
    # position none unless it records an explicit exception. The write signal
    # is deterministic: an explicit `model_writes` metadata row, or — in the
    # Workflow — an Apply/Persist phase or step, or an apply_*.py script call.
    meta_d2b = section_body(text, "Compilation Metadata") or ""
    mw_row = re.search(r"(?im)^\|\s*model_writes\s*\|\s*(\S+)", meta_d2b)
    if mw_row:
        model_writes = mw_row.group(1).strip().lower() in {"yes", "true"}
    else:
        model_writes = bool(
            re.search(r"(?im)^###\s+Phase:\s*(Apply|Persist)\b", workflow)
            or re.search(r"(?im)^\*\*Step \d+ — Persist", workflow)
            or re.search(r"\bapply_\w+\.py\b", workflow))
    pos_val = None
    if fm:
        pm2 = re.search(r"(?m)^position:\s*(\S+)\s*$", fm.group(1))
        if pm2:
            pos_val = pm2.group(1).strip().strip("\"'")
    exception = re.search(r"(?im)^\|\s*position_exception\s*\|\s*\S.*\|", meta_d2b)
    if model_writes and pos_val == "none" and not exception:
        results.append((False, "model-write position (D2b)",
                        "play persists durable product-model artifacts but declares "
                        "position none — declare end/both, or record a "
                        "| position_exception | <reason> | metadata row (#437)"))
    elif model_writes:
        results.append((True, "model-write position (D2b)",
                        f"model-writing play, position {pos_val}"
                        + (" (explicit exception recorded)" if exception and pos_val == "none" else "")))

    # --- D1: Standard Play Close anchors ------------------------------------
    opener = "# --- Standard Play Close (canonical; see standards/rules/play-close.md) ---"
    closer = "# --- end Standard Play Close ---"
    close_ok = (opener in text and closer in text
                and text.index(opener) < text.index(closer))
    results.append((close_ok, "standard play close (D1)",
                    "evidence close block present"
                    if close_ok else "missing or misordered Standard Play Close anchors"))

    # --- pre-flight resolver (non-breaking: only if the SKILL references it) -
    if "scripts/preflight.py" in text:
        pf_path = os.path.join(os.path.dirname(os.path.abspath(argv[1])),
                               "scripts", "preflight.py")
        pf_ok = os.path.isfile(pf_path)
        results.append((pf_ok, "pre-flight resolver",
                        "scripts/preflight.py present"
                        if pf_ok else "Pre-flight references scripts/preflight.py but the "
                                      "file is missing — stamp it from references/preflight.py"))

    # --- stop condition (#464; gated: only when the ICE declares Done means) -
    # A play whose reference/ice.md carries "### Done means" must be compiled
    # with a baked stop-condition.yaml (>=1 content.done clause, each with a
    # closed-set check type) and the stamped checker script. Plays without the
    # ICE section are legacy and skip this check entirely (non-breaking).
    play_dir_sc = os.path.dirname(os.path.abspath(argv[1]))
    ice_path = os.path.join(play_dir_sc, "reference", "ice.md")
    ice_text = ""
    if os.path.isfile(ice_path):
        with open(ice_path, encoding="utf-8") as fh:
            ice_text = fh.read()
    if re.search(r"(?im)^###\s+Done means\b", ice_text):
        sc_path = os.path.join(play_dir_sc, "stop-condition.yaml")
        chk_path = os.path.join(play_dir_sc, "scripts", "check_stop_condition.py")
        sc_problems = []
        if not os.path.isfile(sc_path):
            sc_problems.append("stop-condition.yaml missing — bake it from the ICE's Done means")
        else:
            with open(sc_path, encoding="utf-8") as fh:
                sc_text = fh.read()
            clause_types = re.findall(r"type:\s*([a-z_]+)", sc_text)
            if not clause_types:
                sc_problems.append("stop-condition.yaml has no content.done clauses")
            bad_types = [t for t in clause_types
                         if t not in {"artifact_exists", "field_equals", "gate_outcomes_pass"}]
            if bad_types:
                sc_problems.append("unknown check type(s): " + ", ".join(sorted(set(bad_types))))
        if not os.path.isfile(chk_path):
            sc_problems.append("scripts/check_stop_condition.py missing — stamp it from "
                               "references/check_stop_condition.py")
        results.append((not sc_problems, "stop condition (#464)",
                        "Done means baked: manifest + checker present, clause types valid"
                        if not sc_problems else "; ".join(sc_problems)))

    # --- fingerprint --------------------------------------------------------
    meta = section_body(text, "Compilation Metadata") or ""
    fp = re.search(r"(?im)fingerprint.*", meta)
    bad = (fp is None) or bool(re.search(
        r"(?i)placeholder|todo|tbd|xxx|\bold\b|sha256:\s*$|\.\.\.|…", fp.group(0)))
    results.append((not bad, "fingerprint",
                    "present" if not bad
                    else "missing or placeholder — compute a real one with shasum -a 256"))

    # --- next-command recommendation (pipeline-next.md) ---------------------
    # A compiled play with a valid position must resolve in the successor map and
    # render a Next line at close — unless it is meta_exempt. Non-breaking: only
    # runs when the play has a valid position AND pipeline-next.md is found.
    if fm and pos_ok:
        nm = re.search(r"(?m)^name:\s*(\S+)", fm.group(1))
        play_name = (nm.group(1).strip().strip("\"'") if nm
                     else os.path.basename(os.path.dirname(os.path.abspath(argv[1]))))
        play_dir = os.path.dirname(os.path.abspath(argv[1]))
        map_path = os.path.normpath(os.path.join(
            play_dir, "..", "..", "memory", "standards", "rules", "pipeline-next.md"))
        if os.path.isfile(map_path):
            with open(map_path, encoding="utf-8") as fh:
                mp = fh.read()
            after_exempt = re.split(r"meta_exempt:", mp)[1] if "meta_exempt:" in mp else ""
            exempt = set(re.findall(r"(?m)^\s*-\s*([a-z0-9-]+)\s*$", after_exempt))
            mapped = set(re.findall(r"(?m)^\s{2,}([a-z0-9-]+):\s*\{", mp))
            if play_name in exempt:
                results.append((True, "next-command (pipeline-next)",
                                f"{play_name} is meta_exempt — no Next required"))
            else:
                in_map = play_name in mapped
                renders = "pipeline-next.md" in text
                ok = in_map and renders
                detail = ("resolves in pipeline-next.md and the close renders Next" if ok
                          else f"{play_name} has no entry in pipeline-next.md (add one, or meta_exempt it)"
                          if not in_map
                          else "the close does not render the Next line from pipeline-next.md")
                results.append((ok, "next-command (pipeline-next)", detail))

    # --- report -------------------------------------------------------------
    gaps = [r for r in results if not r[0]]
    print(f"PLAY LINT: {argv[1]}")
    for ok, label, detail in results:
        print(f"  [{'PASS' if ok else 'GAP '}] {label}: {detail}")
    print(f"VERDICT: {'PASS' if not gaps else 'FAIL'} ({len(gaps)} gap(s))")
    return 0 if not gaps else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
