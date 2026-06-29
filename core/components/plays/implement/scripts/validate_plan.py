#!/usr/bin/env python3
"""
validate_plan.py — build-plan validity gate for /implement (C3/C5/C11/C13, F3/F10).

The breakdown (author-build-plan's draft) is the working spine: stories, tasks,
tests, docs as PIECES with dependency edges forming a DAG, each piece grounded
in the box. This gate checks the plan mechanically before it is published:

  shape     — plan.epic_ref matches; pieces non-empty; ids unique; kinds valid
              (story|task|test|docs); statuses valid (planned|in_progress|done|blocked).
  DAG       — every depends_on resolves to a piece id; no cycles; at least one
              piece has no dependencies.
  grounding — every piece carries >= 1 grounding citation whose source is one of
              epic|ice|lens|repo with a non-empty ref (C3/F3 — no invented work).
  test-first— >= 1 test piece; every epic acceptance criterion index is covered
              by >= 1 test piece's acceptance_refs; no test piece depends on a
              story/task piece sharing its acceptance_refs (tests derive from the
              spec, not from the implementation).
  docs      — >= 1 docs piece, OR plan.docs_waiver carries a non-empty reason (C11).
  questions — plan.open_questions is a list (may be empty); each entry has a
              non-empty `question` (these gate the skippable checkpoint).

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_plan.py --plan <plan.yaml> --product-base <pb> --epic <epic-id>

The epic id resolves to its spine `epics` entry; its acceptance criteria come from
the epic.md grounding doc (one criterion per top-level bullet under
"## Acceptance criteria" — the stable enumeration the index cross-checks rely on).

Prints {ok, errors[], warnings[], counts{}, open_questions} JSON.
Exit 0 valid, 1 invalid, 2 usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_plan.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

KINDS = {"story", "task", "test", "docs"}
STATUSES = {"planned", "in_progress", "done", "blocked"}
SOURCES = {"epic", "ice", "lens", "repo"}


def md_section_bullets(md_path, heading):
    """Top-level '- '/'* ' bullets under a '## heading' in a grounding doc, each
    joined across wrapped continuation lines. The stable enumeration the
    acceptance-index cross-checks rely on."""
    try:
        text = open(md_path, encoding="utf-8").read()
    except OSError:
        return []
    items, capturing, cur = [], False, None
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("## "):
            if capturing:
                break
            capturing = s[3:].strip().lower() == heading.strip().lower()
            continue
        if not capturing:
            continue
        if s.startswith("- ") or s.startswith("* "):
            if cur is not None:
                items.append(cur.strip())
            cur = s[2:].strip()
        elif s and cur is not None:
            cur += " " + s
    if cur is not None:
        items.append(cur.strip())
    return [i for i in items if i]


def spine_epic(product_base, epic_id):
    """The epic's spine `epics` entry (and the loaded spine), or (None, spine)."""
    spine = load(os.path.join(product_base, "product-os", "_spine.yaml"))
    entry = next((e for e in (spine.get("epics") or [])
                  if isinstance(e, dict) and e.get("id") == str(epic_id).split("/")[-1]), None)
    return entry, spine


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def has_cycle(pieces):
    deps = {p["id"]: list(p.get("depends_on") or []) for p in pieces}
    state = {}  # 0 visiting, 1 done

    def visit(n):
        if state.get(n) == 0:
            return True
        if state.get(n) == 1:
            return False
        state[n] = 0
        for d in deps.get(n, []):
            if d in deps and visit(d):
                return True
        state[n] = 1
        return False

    return any(visit(n) for n in deps)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Build-plan validity gate.")
    ap.add_argument("--plan", required=True)
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--epic", required=True, help="epic id")
    args = ap.parse_args(argv)

    errors, warnings = [], []
    try:
        plan = (load(args.plan).get("plan") or {})
        entry, _spine = spine_epic(args.product_base, args.epic)
        if entry is None:
            print(json.dumps({"ok": False,
                              "errors": [f"epic '{args.epic}' not in the spine epics index"],
                              "warnings": []}, indent=2))
            return 1
        acceptance = md_section_bullets(
            os.path.join(args.product_base, "product-os", entry.get("doc") or ""),
            "Acceptance criteria")
        epic = {"id": entry.get("id"), "acceptance": acceptance}
    except (OSError, yaml.YAMLError) as exc:
        print(json.dumps({"ok": False, "errors": [f"unreadable input: {exc}"],
                          "warnings": []}, indent=2))
        return 1

    pieces = [p or {} for p in (plan.get("pieces") or [])]
    out = {"ok": False, "errors": errors, "warnings": warnings,
           "counts": {}, "open_questions": plan.get("open_questions") or []}

    # --- shape -----------------------------------------------------------------
    if plan.get("epic_ref") != epic.get("id"):
        errors.append(f"plan.epic_ref '{plan.get('epic_ref')}' != epic id "
                      f"'{epic.get('id')}' — plan is not this epic's box (C2)")
    if not pieces:
        errors.append("plan has no pieces (C13/F10)")
    ids = [p.get("id") for p in pieces]
    if len(ids) != len(set(ids)) or any(not i for i in ids):
        errors.append("piece ids must be present and unique (C13)")
    for p in pieces:
        pid = p.get("id") or "<no-id>"
        if (p.get("kind") or "") not in KINDS:
            errors.append(f"{pid}: kind '{p.get('kind')}' not in {sorted(KINDS)}")
        if (p.get("status") or "") not in STATUSES:
            errors.append(f"{pid}: status '{p.get('status')}' not in {sorted(STATUSES)}")
        if not (p.get("title") or "").strip():
            errors.append(f"{pid}: title is empty")

        # --- grounding (C3/F3) --------------------------------------------------
        cites = p.get("grounding") or []
        if not cites:
            errors.append(f"{pid}: no grounding citation — ungrounded work is an "
                          f"invented requirement (C3/F3)")
        for c in cites:
            c = c or {}
            if (c.get("source") or "") not in SOURCES or not (c.get("ref") or "").strip():
                errors.append(f"{pid}: grounding citation needs source in "
                              f"{sorted(SOURCES)} + non-empty ref (C3/F3)")

    # --- DAG (C13) ---------------------------------------------------------------
    idset = set(ids)
    for p in pieces:
        for d in (p.get("depends_on") or []):
            if d not in idset:
                errors.append(f"{p.get('id')}: depends_on '{d}' is not a piece (C13)")
    if pieces and not any(not (p.get("depends_on") or []) for p in pieces):
        errors.append("no dependency-free piece — the DAG cannot start (C13)")
    if pieces and not errors and has_cycle(pieces):
        errors.append("dependency cycle detected — not a DAG (C13/F10)")

    # --- test-first coverage (C5 test-first, F7 surface) --------------------------
    tests = [p for p in pieces if p.get("kind") == "test"]
    if not tests:
        errors.append("no test piece — the breakdown must be test-first (C5)")
    acceptance = epic.get("acceptance") or []
    covered = set()
    for t in tests:
        covered.update(t.get("acceptance_refs") or [])
    for idx in range(len(acceptance)):
        if idx not in covered and str(idx) not in {str(c) for c in covered}:
            errors.append(f"epic acceptance[{idx}] is covered by no test piece "
                          f"({(acceptance[idx] or '')[:60]!r}) (C5/F7)")
    impl_kind = {p.get("id"): p.get("kind") for p in pieces}
    for t in tests:
        t_refs = set(t.get("acceptance_refs") or [])
        for d in (t.get("depends_on") or []):
            if impl_kind.get(d) in {"story", "task"}:
                d_piece = next(p for p in pieces if p.get("id") == d)
                if t_refs & set(d_piece.get("acceptance_refs") or []):
                    errors.append(f"{t.get('id')}: test depends on '{d}' which shares its "
                                  f"acceptance — tests derive from the spec, not the "
                                  f"implementation (C6)")

    # --- docs (C11) ----------------------------------------------------------------
    if not any(p.get("kind") == "docs" for p in pieces):
        waiver = ((plan.get("docs_waiver") or {}).get("reason") or "").strip()
        if not waiver:
            errors.append("no docs piece and no docs_waiver.reason — the deliverable "
                          "includes the documentation the change requires (C11)")

    # --- open questions shape -------------------------------------------------------
    for q in (plan.get("open_questions") or []):
        if not ((q or {}).get("question") or "").strip():
            errors.append("open_questions entry with empty question")

    out["counts"] = {"pieces": len(pieces), "tests": len(tests),
                     "acceptance": len(acceptance),
                     "open_questions": len(plan.get("open_questions") or [])}
    out["ok"] = not errors
    print(json.dumps(out, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
