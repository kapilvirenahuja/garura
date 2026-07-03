#!/usr/bin/env python3
"""
check_spec.py — the crisp-spec boundary gate for /implement (C16/F14).

Before the human approves and the autonomous build runs, the play authors a
SPEC: a crisp, human-readable, ICE-shaped boundary document — Intent (what the
build delivers), Context (the rules, patterns, design decisions, and config the
build must hold to, plus the existing-code map), Expectation (acceptance + done
bar). It states boundaries, never code, and stays tight enough to read in one
sitting. This script checks that mechanically — the judgment (are the boundaries
the RIGHT ones) stays with the human at the approval gate; this does the counting:

  exists    — the spec file exists and is non-empty.
  shape     — ICE-shaped: a header each for Intent, Context, Expectation
              (markdown headers, case-insensitive), and the Context section
              non-empty (the boundaries actually present).
  no-code   — no fenced code block (``` ... ```). The spec REFERENCES code and
              states rules/patterns/ports; it never copies the implementation.
              Short inline `spans` (a port number, a symbol name) are fine.
  size      — within the readable bound: <= max-lines and <= max-words. Over the
              bound it is no longer a crisp boundary doc — it is drifting toward
              code/spec-bloat (F14). Defaults: ~1-2 pages.

When --product-base and --epic are given, the script also runs the SURFACE-DOWNGRADE
gate (C19/F15, surface-contract.md). It reads the epic's `surface_type` from its spine
entry and
the spec's own declared surface (a `Surface: <type>` line), and compares them by
the contract's ordering:

  web_dashboard | server_api | cli   (rank 2, user-facing)
  service_read_model | library       (rank 1, non-user-facing)

A spec surface BELOW the epic's declared surface is a DOWNGRADE — the build is
halted for explicit human approval of a recut, never built silently. A missing
epic surface (legacy epic) or a missing/unknown spec surface is a hard error:
the surface must be DECLARED before building, never defaulted.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_spec.py --spec <spec.md> [--product-base <pb> --epic <epic-id>]
                          [--max-lines 160] [--max-words 1100]

Prints {ok, errors[], warnings[], counts{}} JSON. Exit 0 clean, 1 gaps, 2 usage.
"""

import argparse
import json
import os
import re
import sys

ICE_SECTIONS = ("intent", "context", "expectation")
FENCE = re.compile(r"(?m)^\s*(```|~~~)")
HEADER = re.compile(r"(?m)^(#{1,6})\s+(.*)$")

# surface-contract.md ordering: user-facing ranks above non-user-facing.
SURFACE_RANK = {
    "web_dashboard": 2, "server_api": 2, "cli": 2,
    "service_read_model": 1, "library": 1,
}
SURFACE_LINE = re.compile(r"(?im)^\s*[-*]?\s*surface\s*[:=]\s*([a-z_]+)")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Crisp ICE-spec boundary gate for /implement.")
    ap.add_argument("--spec", required=True, help="path to the ICE spec (markdown)")
    ap.add_argument("--max-lines", type=int, default=160,
                    help="hard line cap — over this the spec is no longer crisp (default 160)")
    ap.add_argument("--max-words", type=int, default=1100,
                    help="hard word cap (~1-2 pages; default 1100)")
    ap.add_argument("--product-base",
                    help="product base — with --epic, enables the surface-downgrade gate (C19/F15)")
    ap.add_argument("--epic",
                    help="epic id — with --product-base, enables the surface-downgrade gate (C19/F15)")
    args = ap.parse_args(argv)

    errors, warnings = [], []
    counts = {"lines": 0, "words": 0, "code_blocks": 0, "ice_sections": 0}

    if not os.path.isfile(args.spec):
        print(json.dumps({"ok": False, "errors": [f"spec not found: {args.spec} — the "
                          f"build is gated on an approved spec (C16)"],
                          "warnings": [], "counts": counts}, indent=2))
        return 1
    with open(args.spec, encoding="utf-8") as fh:
        text = fh.read()

    if not text.strip():
        errors.append("spec is empty — nothing for the human to approve (C16/F14)")

    lines = text.splitlines()
    counts["lines"] = len(lines)
    counts["words"] = len(text.split())

    # ICE shape: a header for each of Intent / Context / Expectation.
    headers = [m.group(2).strip().lower() for m in HEADER.finditer(text)]
    present = {s for s in ICE_SECTIONS if any(s in h for h in headers)}
    counts["ice_sections"] = len(present)
    for s in ICE_SECTIONS:
        if s not in present:
            errors.append(f"spec is not ICE-shaped — no '{s.capitalize()}' header (C16/F14)")

    # Context must carry actual boundaries (non-empty body under its header).
    if "context" in present and not _section_body(text, "context").strip():
        errors.append("the Context section is empty — a spec with no stated boundaries "
                      "(rules, patterns, designs, config) cannot align the build (C16/F14)")

    # No code: a boundary doc references code, never copies it.
    fences = len(FENCE.findall(text))
    counts["code_blocks"] = fences // 2 if fences else 0
    if fences:
        errors.append(f"spec contains {fences // 2 or 1} fenced code block(s) — the spec "
                      f"states boundaries and references code, it never copies it (C16/F14)")

    # Size: crisp, readable bound.
    if counts["lines"] > args.max_lines:
        errors.append(f"spec is {counts['lines']} lines (cap {args.max_lines}) — past the "
                      f"readable bound, it is drifting toward code/bloat, not a crisp "
                      f"boundary doc (C16/F14)")
    if counts["words"] > args.max_words:
        errors.append(f"spec is {counts['words']} words (cap {args.max_words}) — over the "
                      f"~1-2 page bound (C16/F14)")
    # Early warning before the hard cap, so authors trim before they fail.
    if counts["lines"] <= args.max_lines and counts["lines"] > int(args.max_lines * 0.85):
        warnings.append(f"spec is {counts['lines']} lines — close to the {args.max_lines} "
                        f"cap; keep it crisp")

    # Surface-downgrade gate (C19/F15, surface-contract.md). The spec must not
    # promise a lower user surface than the epic declared, and a legacy epic with
    # no surface must declare one before the build runs.
    if args.product_base and args.epic:
        epic_surface = _epic_surface(args.product_base, args.epic)
        spec_surface = _spec_surface(text)
        counts["epic_surface"] = epic_surface
        counts["spec_surface"] = spec_surface
        if epic_surface is None:
            errors.append("epic declares no surface (legacy epic, ADR 022) — the surface "
                          "is unknown, not a default: declare it before building, never "
                          "assume service_read_model or any other value (C19/F15)")
        elif epic_surface not in SURFACE_RANK:
            errors.append(f"epic surface.type '{epic_surface}' is not in the "
                          f"surface-contract taxonomy (C19/F15)")
        if spec_surface is None:
            errors.append("spec declares no surface — add a 'Surface: <type>' line so the "
                          "build's surface can be compared to the epic's declared surface "
                          "(C19/F15)")
        elif spec_surface not in SURFACE_RANK:
            errors.append(f"spec surface '{spec_surface}' is not in the surface-contract "
                          f"taxonomy (C19/F15)")
        if (epic_surface in SURFACE_RANK and spec_surface in SURFACE_RANK
                and SURFACE_RANK[spec_surface] < SURFACE_RANK[epic_surface]):
            errors.append(f"surface DOWNGRADE: spec surface '{spec_surface}' is below the "
                          f"epic's declared '{epic_surface}' — the promised user surface "
                          f"would be silently downgraded. Halt for explicit human approval "
                          f"of a recut, or regenerate the spec preserving '{epic_surface}' "
                          f"(C19/F15, surface-contract.md)")

    ok = not errors
    print(json.dumps({"ok": ok, "errors": errors, "warnings": warnings,
                      "counts": counts}, indent=2))
    return 0 if ok else 1


def _section_body(text, title):
    """Body under the first header containing <title>, up to the next equal/higher header."""
    m = None
    level = None
    for h in HEADER.finditer(text):
        if title in h.group(2).strip().lower():
            m, level = h, len(h.group(1))
            break
    if not m:
        return ""
    start = m.end()
    for nxt in HEADER.finditer(text[start:]):
        if len(nxt.group(1)) <= level:
            return text[start:start + nxt.start()]
    return text[start:]


def _epic_surface(product_base, epic_id):
    """The epic's declared surface_type from the spine epics entry, or None
    when absent/unreadable (legacy)."""
    try:
        import os
        import yaml
        spine_path = os.path.join(product_base, "product-os", "_spine.yaml")
        with open(spine_path, encoding="utf-8") as fh:
            spine = yaml.safe_load(fh) or {}
    except Exception:
        return None
    epic = next((e for e in (spine.get("epics") or [])
                 if isinstance(e, dict) and e.get("id") == str(epic_id).split("/")[-1]), None)
    if not isinstance(epic, dict):
        return None
    t = epic.get("surface_type")
    return t.strip() if isinstance(t, str) and t.strip() else None


def _spec_surface(text):
    """The spec's declared surface from a 'Surface: <type>' line, or None."""
    m = SURFACE_LINE.search(text)
    return m.group(1).strip().lower() if m else None


if __name__ == "__main__":
    sys.exit(main())
