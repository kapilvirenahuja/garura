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

Structure (#466 Batch D, PR #472 P3s): each check lives in its own check_* function
taking the shared parse context and returning a list of (ok, label, detail) result
tuples; main() is parse -> load -> run the check list -> report. No behavioral
change — the checks' logic, messages, and exit codes are the pre-restructure ones.
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


def load_context(path, text):
    """Parse everything the checks share once: sections, declared/referenced id
    sets, frontmatter, and the D2 position verdict (reused by D2b and the
    next-command check)."""
    fm = re.match(r"(?s)^---\n(.*?)\n---", text)
    pos_ok, pos_val = False, None
    pos_detail = "frontmatter missing or has no 'position' field (D2)"
    if fm:
        pm = re.search(r"(?m)^position:\s*(\S+)\s*$", fm.group(1))
        if pm:
            pos_val = pm.group(1).strip().strip("\"'")
            if pos_val in {"start", "end", "both", "none"}:
                pos_ok, pos_detail = True, f"position: {pos_val}"
            else:
                pos_detail = f"invalid position '{pos_val}' (must be start|end|both|none)"
        elif "Recommended Codex profile:" in text:
            # Codex accepts only name + description in installed skill
            # frontmatter. Prefer the installer's deterministic marker, then
            # fall back to older installed copies' compiled-play prose.
            pm = re.search(
                r"(?i)Garura pipeline position:\s*`(start|end|both|none)`",
                text,
            )
            if not pm:
                pm = re.search(
                    r"(?i)\*\*Pipeline position:\s*(start|end|both|none)\.?\*\*",
                    text,
                )
            if pm:
                pos_val = pm.group(1).lower()
                pos_ok, pos_detail = True, f"position: {pos_val} (Codex body marker)"
    ctx = {
        "path": path,
        "text": text,
        "play_dir": os.path.dirname(os.path.abspath(path)),
        "fm": fm,
        "pos_ok": pos_ok,
        "pos_val": pos_val,
        "pos_detail": pos_detail,
        "workflow": section_body(text, "Workflow") or "",
        "scen_val": section_body(text, "Scenario Validation") or "",
        "preflight": section_body(text, "Pre-flight") or "",
        "recovery": section_body(text, "Recovery") or "",
        "meta": section_body(text, "Compilation Metadata") or "",
    }
    cf = section_body(text, "Compiled From")
    ctx["dC"], ctx["dF"], ctx["dS"] = (collect_ids(cf, p) for p in "CFS")
    ctx["step_F"] = collect_ids(ctx["workflow"], "F")
    ctx["step_C"] = collect_ids(ctx["workflow"], "C")
    ctx["scen_S"] = collect_ids(ctx["scen_val"], "S")
    ctx["pre_C"] = collect_ids(ctx["preflight"], "C")
    ctx["rec_F"] = collect_ids(ctx["recovery"], "F")
    return ctx


# --- required sections -------------------------------------------------------
def check_sections(ctx):
    missing = [s for s in REQUIRED_SECTIONS if find_header(ctx["text"], s)[0] is None]
    return [(not missing, "required sections",
             "all present" if not missing else "missing: " + ", ".join(missing))]


# --- declared set (source of truth) + coverage --------------------------------
def check_coverage(ctx):
    results = []
    dC, dF, dS = ctx["dC"], ctx["dF"], ctx["dS"]
    if not (dC or dF or dS):
        results.append((False, "declared set",
                        "could not read C/F/S ranges from 'Compiled From' — coverage "
                        "and orphan checks below are unreliable"))
    if dF:
        miss = dF - ctx["step_F"]
        results.append((not miss, "failure coverage",
                        "every failure has a step eval" if not miss
                        else "no step eval references: " + fmt("F", miss)))
    if dS:
        miss = dS - ctx["scen_S"]
        results.append((not miss, "scenario coverage",
                        "every scenario has a scenario eval" if not miss
                        else "no scenario eval references: " + fmt("S", miss)))
    if dC:
        miss = dC - (ctx["pre_C"] | ctx["step_C"])
        results.append((not miss, "constraint coverage",
                        "every constraint is in pre-flight or a step eval" if not miss
                        else "not referenced in pre-flight or any eval (confirm structural): "
                             + fmt("C", miss)))
    return results


# --- recovery one-per-failure --------------------------------------------------
def check_recovery(ctx):
    if not ctx["dF"]:
        return []
    problems = []
    for f in sorted(ctx["dF"], key=int):
        n = len(re.findall(rf"\bF{f}\b", ctx["recovery"]))
        if n != 1:
            problems.append(f"F{f}: {'no recovery' if n == 0 else f'{n} recovery rows'}")
    return [(not problems, "recovery 1:1",
             "exactly one recovery per failure" if not problems else "; ".join(problems))]


# --- orphans --------------------------------------------------------------------
def check_orphans(ctx):
    dC, dF, dS = ctx["dC"], ctx["dF"], ctx["dS"]
    if not (dC or dF or dS):
        return []
    orphans = []
    for prefix, declared, refs in (("C", dC, ctx["pre_C"] | ctx["step_C"]),
                                   ("F", dF, ctx["step_F"] | ctx["rec_F"]),
                                   ("S", dS, ctx["scen_S"])):
        orphans += [prefix + n for n in sorted(refs - declared, key=int)]
    return [(not orphans, "no orphans",
             "no references to undeclared C/F/S" if not orphans
             else "references to undeclared ids: " + ", ".join(orphans))]


# --- D2: pipeline position (frontmatter) ----------------------------------------
def check_position(ctx):
    return [(ctx["pos_ok"], "pipeline position (D2)", ctx["pos_detail"])]


# --- D2b: durable model writes ride the end pipeline (#437) ---------------------
def check_model_writes(ctx):
    # A play that persists durable product-model artifacts must not declare
    # position none unless it records an explicit exception. The write signal
    # is deterministic: an explicit `model_writes` metadata row, or — in the
    # Workflow — an Apply/Persist phase or step, or an apply_*.py script call.
    meta, workflow = ctx["meta"], ctx["workflow"]
    mw_row = re.search(r"(?im)^\|\s*model_writes\s*\|\s*(\S+)", meta)
    if mw_row:
        model_writes = mw_row.group(1).strip().lower() in {"yes", "true"}
    else:
        model_writes = bool(
            re.search(r"(?im)^###\s+Phase:\s*(Apply|Persist)\b", workflow)
            or re.search(r"(?im)^\*\*Step \d+ — Persist", workflow)
            or re.search(r"\bapply_\w+\.py\b", workflow))
    pos_val = ctx["pos_val"]
    exception = re.search(r"(?im)^\|\s*position_exception\s*\|\s*\S.*\|", meta)
    if model_writes and pos_val == "none" and not exception:
        return [(False, "model-write position (D2b)",
                 "play persists durable product-model artifacts but declares "
                 "position none — declare end/both, or record a "
                 "| position_exception | <reason> | metadata row (#437)")]
    if model_writes:
        return [(True, "model-write position (D2b)",
                 f"model-writing play, position {pos_val}"
                 + (" (explicit exception recorded)" if exception and pos_val == "none" else ""))]
    return []


# --- D1: Standard Play Close anchors ---------------------------------------------
def check_close_anchors(ctx):
    text = ctx["text"]
    opener = "# --- Standard Play Close (canonical; see standards/rules/play-close.md) ---"
    closer = "# --- end Standard Play Close ---"
    close_ok = (opener in text and closer in text
                and text.index(opener) < text.index(closer))
    return [(close_ok, "standard play close (D1)",
             "evidence close block present"
             if close_ok else "missing or misordered Standard Play Close anchors")]


# --- pre-flight resolver (non-breaking: only if the SKILL references it) ---------
def check_preflight_resolver(ctx):
    if "scripts/preflight.py" not in ctx["text"]:
        return []
    pf_path = os.path.join(ctx["play_dir"], "scripts", "preflight.py")
    pf_ok = os.path.isfile(pf_path)
    return [(pf_ok, "pre-flight resolver",
             "scripts/preflight.py present"
             if pf_ok else "Pre-flight references scripts/preflight.py but the "
                           "file is missing — stamp it from references/preflight.py")]


# --- stop condition (#464; gated: only when the ICE declares Done means) ---------
def check_stop_condition(ctx):
    # A play whose reference/ice.md carries "### Done means" must be compiled
    # with a baked stop-condition.yaml (>=1 content.done clause, each with a
    # closed-set check type) and the stamped checker script. Plays without the
    # ICE section are legacy and skip this check entirely (non-breaking).
    play_dir = ctx["play_dir"]
    ice_path = os.path.join(play_dir, "reference", "ice.md")
    ice_text = ""
    if os.path.isfile(ice_path):
        with open(ice_path, encoding="utf-8") as fh:
            ice_text = fh.read()
    if not re.search(r"(?im)^###\s+Done means\b", ice_text):
        return []
    sc_path = os.path.join(play_dir, "stop-condition.yaml")
    chk_path = os.path.join(play_dir, "scripts", "check_stop_condition.py")
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
    return [(not sc_problems, "stop condition (#464)",
             "Done means baked: manifest + checker present, clause types valid"
             if not sc_problems else "; ".join(sc_problems))]


# --- fingerprint ------------------------------------------------------------------
def check_fingerprint(ctx):
    fp = re.search(r"(?im)fingerprint.*", ctx["meta"])
    bad = (fp is None) or bool(re.search(
        r"(?i)placeholder|todo|tbd|xxx|\bold\b|sha256:\s*$|\.\.\.|…", fp.group(0)))
    return [(not bad, "fingerprint",
             "present" if not bad
             else "missing or placeholder — compute a real one with shasum -a 256")]


# --- next-command recommendation (pipeline-next.md) --------------------------------
def check_next_command(ctx):
    # A compiled play with a valid position must resolve in the successor map and
    # render a Next line at close — unless it is meta_exempt. Non-breaking: only
    # runs when the play has a valid position AND pipeline-next.md is found.
    if not (ctx["fm"] and ctx["pos_ok"]):
        return []
    nm = re.search(r"(?m)^name:\s*(\S+)", ctx["fm"].group(1))
    play_name = (nm.group(1).strip().strip("\"'") if nm
                 else os.path.basename(ctx["play_dir"]))
    map_path = os.path.normpath(os.path.join(
        ctx["play_dir"], "..", "..", "memory", "standards", "rules", "pipeline-next.md"))
    if not os.path.isfile(map_path):
        return []
    with open(map_path, encoding="utf-8") as fh:
        mp = fh.read()
    after_exempt = re.split(r"meta_exempt:", mp)[1] if "meta_exempt:" in mp else ""
    exempt = set(re.findall(r"(?m)^\s*-\s*([a-z0-9-]+)\s*$", after_exempt))
    mapped = set(re.findall(r"(?m)^\s{2,}([a-z0-9-]+):\s*\{", mp))
    if play_name in exempt:
        return [(True, "next-command (pipeline-next)",
                 f"{play_name} is meta_exempt — no Next required")]
    in_map = play_name in mapped
    renders = "pipeline-next.md" in ctx["text"]
    ok = in_map and renders
    detail = ("resolves in pipeline-next.md and the close renders Next" if ok
              else f"{play_name} has no entry in pipeline-next.md (add one, or meta_exempt it)"
              if not in_map
              else "the close does not render the Next line from pipeline-next.md")
    return [(ok, "next-command (pipeline-next)", detail)]


# --- concurrent read-only fan-out declaration (#468; convergence-lint) ------------
def check_fanout_declaration(ctx):
    # Non-breaking: fires ONLY when the play invokes the concurrent read-only
    # fan-out pattern (cites concurrent-fanout.md). A step that claims concurrency
    # must make its safety visible — the JOIN barrier and the READ-ONLY condition
    # (standards/rules/concurrent-fanout.md). A play that never fans out is silent.
    text = ctx["text"]
    if "concurrent-fanout.md" not in text:
        return []
    low = text.lower()
    missing = []
    if "join" not in low:
        missing.append("the join barrier ('join')")
    if "read-only" not in low:
        missing.append("the read-only condition ('read-only')")
    return [(not missing, "concurrent fan-out (#468)",
             "fan-out declares its join + read-only safety"
             if not missing else "cites concurrent-fanout.md but does not declare "
                                  + " and ".join(missing))]


# --- no unbacked recommendation (the cardinal rule) -------------------------------
def check_unbacked_recommendation(ctx):
    # Fires ONLY on a play that says it recommends. The trigger is the frontmatter
    # description — a play whose stated job is to advise is in scope; a play that
    # merely mentions the word in passing is not. See
    # standards/rules/no-unbacked-recommendation.md.
    #
    # Convergence-lint, same shape as check_fanout_declaration: the linter proves the
    # guard is WIRED, the play's own eval proves a given run. A recommending play must
    # cite the rule and carry both a constraint and a failure condition for it, so an
    # unbacked default cannot be added later without something failing.
    if not ctx["fm"]:
        return []
    dm = re.search(r"(?ms)^description:\s*(.*?)(?=^\w+:|\Z)", ctx["fm"].group(1))
    if not dm:
        return []
    desc = dm.group(1).lower()
    # Strip NEGATED mentions first — a play that advertises "no recommendations
    # attached" (grill) is declaring it does not advise, and must not be dragged in
    # scope by its own disclaimer.
    desc = re.sub(r"\b(no|never|without|not)\s+(any\s+)?(recommend\w*|suggest\w*"
                  r"|advis\w*|rank\w*)", " ", desc)
    if not re.search(r"\brecommend|\bsuggests?\b|\badvises?\b|\branks?\b", desc):
        return []

    text = ctx["text"]
    cites = "no-unbacked-recommendation" in text
    if not cites:
        return [(False, "no-unbacked-recommendation",
                 "this play's description says it recommends — it must cite "
                 "standards/rules/no-unbacked-recommendation.md and wire the rule "
                 "(constraint + failure condition + step eval + strip-not-replace recovery)")]

    low = text.lower()
    missing = []
    # The rule demands FOUR pieces, not two. Check all four, so the rule's own
    # "Enforced" claim is not broader than what is enforced.
    if not re.search(r"(?m)^\s*-\s*C\d+\s*[—-].*(no recommendation|unbacked|cannot back"
                     r"|silence beats)", text, re.I) \
       and not re.search(r"C\d+[^\n]{0,200}(no recommendation|unbacked|silence beats)",
                         text, re.I):
        missing.append("a constraint stating the rule")

    # The failure condition, and which F-id it is. A play has many failures, so
    # collect every candidate and accept if ANY ONE of them is fully wired —
    # picking the first match would grade the wrong failure condition.
    candidates = set(re.findall(
        r"\b(F\d+)\b[^\n]{0,200}(?:unbacked|given (?:a recommendation|one) anyway"
        r"|default|generic pointer|substitute)", text, re.I))
    if not candidates:
        missing.append("a failure condition for a substituted recommendation")
    else:
        def fully_wired(fid):
            # A step eval must cite it...
            if not re.search(r"SE-\d+[^\n]{0,160}\b" + fid + r"\b", text):
                return False
            # ...and its recovery row must STRIP, never substitute another answer.
            row = re.search(r"(?m)^\|\s*" + fid + r"\s*\|.*$", text)
            return bool(row) and bool(re.search(
                r"strip|remove|withhold|leav\w+ it blank|carry no recommendation",
                row.group(0), re.I))
        if not any(fully_wired(f) for f in candidates):
            missing.append(
                "the rule's failure condition (" + "/".join(sorted(candidates)) +
                ") needs BOTH a step eval citing it AND a recovery that strips the "
                "recommendation rather than choosing another")

    if "no recommendation" not in low:
        missing.append("a named no-recommendation state")
    ok = not missing
    return [(ok, "no-unbacked-recommendation",
             "recommending play cites the rule and wires all four pieces "
             "(constraint + failure + step eval + strip-not-replace recovery)" if ok
             else "cites the rule but is missing: " + "; ".join(missing))]


CHECKS = [
    check_sections,
    check_coverage,
    check_recovery,
    check_orphans,
    check_position,
    check_model_writes,
    check_close_anchors,
    check_preflight_resolver,
    check_stop_condition,
    check_fingerprint,
    check_next_command,
    check_fanout_declaration,
    check_unbacked_recommendation,
]


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

    ctx = load_context(argv[1], text)
    results = []
    for check in CHECKS:
        results.extend(check(ctx))

    gaps = [r for r in results if not r[0]]
    print(f"PLAY LINT: {argv[1]}")
    for ok, label, detail in results:
        print(f"  [{'PASS' if ok else 'GAP '}] {label}: {detail}")
    print(f"VERDICT: {'PASS' if not gaps else 'FAIL'} ({len(gaps)} gap(s))")
    return 0 if not gaps else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
