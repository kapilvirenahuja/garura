#!/usr/bin/env python3
"""
lint_grounding.py — the SHARED structural linter for product-model grounding docs.

This is the mechanical floor described in
`standards/schemas/product-os/grounding/_content-standard.md`. It enforces SHAPE and
LINK INTEGRITY — never content quality (that is the rubric eval's job). Concretely:

  - HEADINGS: each grounding doc carries exactly its kind's locked heading set
    (the H1 title + the required H2 sections), in order, with NO missing heading and
    NO invented/unknown H2. This is the anti-drift guard.
  - SUBSTANCE FLOOR: no required section is empty, no section falls below a coarse
    word floor, no top-level bullet is a telegraphic label. This catches obvious
    thinness only — "fully understandable" is judged by the eval, not here.
  - SPINE CONSISTENCY (when --spine is given): every spine node points at a grounding
    doc that exists and whose kind matches the node type; every epic's
    functionality_refs resolve to real functionality nodes; no orphan grounding doc
    sits on disk unreferenced by the spine.

Layer rule: reads files on disk only; never shells to git/gh or the network.

Usage:
    # one doc (kind inferred from its H1 title, or forced with --kind)
    python3 lint_grounding.py --doc path/to/capability.md
    python3 lint_grounding.py --doc path/to/draft.md --kind functionality

    # a whole tree of grounding docs (kind inferred per doc)
    python3 lint_grounding.py --root <product-os dir>

    # full consistency: spine <-> docs
    python3 lint_grounding.py --root <product-os dir> --spine <product-os dir>/_spine.yaml

Prints one JSON object {ok, errors[], warnings[], counts} to stdout.
Exit 0 when ok, 1 on any error, 2 on a usage/parse-infrastructure error.
"""

import argparse
import json
import os
import re
import sys

try:
    import yaml
except ImportError:
    yaml = None  # only needed for --spine mode; checked there.

# ---- The locked heading contracts (must match the templates exactly) --------
# H1 title prefix per kind, then the ORDERED required H2 set. Source of truth:
# standards/schemas/product-os/grounding/{kind}.md
CONTRACTS = {
    "domain": {
        "title": "Theme:",
        "h2": [
            "Intent",
            "Business goal",
            "Guiding rules",
            "Capabilities",
            "Scope (In / Out)",
        ],
    },
    "capability": {
        "title": "Capability:",
        # Capability is STAGE-AWARE: /vision writes the directional shape, /understand
        # promotes it to the detailed shape. The spine entry's `detail:` field
        # (directional | detailed) says which applies; absent → inferred from content.
        "stages": {
            "directional": ["Directional intent"],
            "detailed": [
                "Benefit hypothesis",
                "Boundary (In / Out / Never)",
                "Guiding rules",
                "Functionalities",
            ],
        },
    },
    "functionality": {
        "title": "Functionality:",
        "h2": [
            "What it does",
            "Inputs / Outputs",
            "Rules & behavior",
            "Acceptance criteria",
            "Out of scope",
        ],
    },
    "epic": {
        "title": "Epic:",
        "h2": [
            "Intent (goals)",
            "Constraints",
            "Failures",
            "Expectations / success",
            "Context (persona / systems / scope)",
            "Outcome",
            "User check",
            "Surface",
            "Delivers — functionalities (linked)",  # em dash, exact
            "Acceptance criteria",
        ],
    },
    # --- The seven realize lenses (per-slice grounding docs). H1 is exactly "<Type> Lens". ---
    "lens-quality": {"title": "Quality Lens", "exact_title": True,
                     "h2": ["Intent", "Gates"]},
    "lens-ux": {"title": "UX Lens", "exact_title": True,
                "h2": ["Intent", "Screens", "States", "Visual core"]},
    "lens-agentic": {"title": "Agentic Lens", "exact_title": True,
                     "h2": ["Is it an agent?", "Load weights", "Controls"]},
    "lens-architecture": {"title": "Architecture Lens", "exact_title": True,
                          "h2": ["Intent", "Components", "Stack", "Vertical build"]},
    "lens-measure": {"title": "Measure Lens", "exact_title": True,
                     "h2": ["Focus", "Metrics", "Out of scope"]},
    "lens-run": {"title": "Run Lens", "exact_title": True,
                 "h2": ["Environments", "Rollout", "Migrations", "Config & secrets", "CI/CD"]},
    "lens-marketing": {"title": "Marketing Lens", "exact_title": True,
                       "h2": ["Intent", "Discoverability", "Accessibility", "Marketing analytics"]},
}

# H1 prefix -> kind, for inferring a doc's kind from its title.
TITLE_TO_KIND = {v["title"]: k for k, v in CONTRACTS.items()}

# Coarse substance floor — a FLOOR, not a quality bar. Tuned to catch labels
# ("Local fixtures only") without false-failing terse-but-real content. The eval
# is what actually judges understandability.
MIN_SECTION_WORDS = 12
MIN_BULLET_WORDS = 5


def _read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def parse_sections(text):
    """Return (title_line, [(h2_text, [body_lines])]) ignoring fenced code blocks.

    title_line is the first H1 ('# ...') outside a fence, or None.
    """
    title = None
    sections = []  # list of [heading_text, body_lines]
    in_fence = False
    cur = None
    for raw in text.splitlines():
        stripped = raw.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            if cur is not None:
                cur[1].append(raw)
            continue
        if in_fence:
            if cur is not None:
                cur[1].append(raw)
            continue
        if stripped.startswith("# ") and title is None:
            title = stripped[2:].strip()
            continue
        if stripped.startswith("## "):
            cur = [stripped[3:].strip(), []]
            sections.append(cur)
            continue
        if cur is not None:
            cur[1].append(raw)
    return title, sections


def _words(s):
    return len(re.findall(r"\S+", s))


def infer_kind(title):
    if not title:
        return None
    for prefix, kind in TITLE_TO_KIND.items():
        if title.startswith(prefix):
            return kind
    return None


def resolve_stage_h2(stages, got, expected_stage, path, errors):
    """For a stage-aware kind, pick the required H2 list. Prefer the spine-declared
    stage; else infer from the doc's own headings; else default by a marker heading."""
    if expected_stage in stages:
        return stages[expected_stage]
    for swant in stages.values():
        if set(got) == set(swant):
            return swant
    # ambiguous — fall back to the directional shape iff its marker is present
    if "Directional intent" in got:
        return stages["directional"]
    return stages["detailed"]


def check_doc(path, text, kind, errors, warnings, expected_stage=None):
    """Validate one grounding doc against its kind's contract. Bumps nothing; caller counts."""
    contract = CONTRACTS[kind]
    title, sections = parse_sections(text)
    got_pre = [h for h, _ in sections]
    if "stages" in contract:
        want_h2 = resolve_stage_h2(contract["stages"], got_pre, expected_stage, path, errors)
    else:
        want_h2 = contract["h2"]

    # --- H1 title ---
    if title is None:
        errors.append(f"{path}: no H1 title line")
    elif contract.get("exact_title"):
        # lens docs are titled exactly "<Type> Lens" — no trailing name
        if title.strip() != contract["title"]:
            errors.append(f"{path}: H1 '{title}' must be exactly '{contract['title']}'")
    elif not title.startswith(contract["title"]):
        errors.append(f"{path}: H1 '{title}' must start with '{contract['title']}' for a {kind} doc")
    elif _words(title[len(contract['title']):]) < 1:
        errors.append(f"{path}: H1 '{title}' has no name after '{contract['title']}'")

    got = [h for h, _ in sections]
    want = want_h2

    # --- exact set + order: no missing, no extra, right order ---
    missing = [h for h in want if h not in got]
    extra = [h for h in got if h not in want]
    for h in missing:
        errors.append(f"{path}: missing required section '## {h}'")
    for h in extra:
        errors.append(f"{path}: unknown section '## {h}' — not in the {kind} contract (drift)")
    if not missing and not extra and got != want:
        errors.append(f"{path}: sections out of order — expected {want}, got {got}")

    # --- substance floor per required section ---
    body_by_h = {h: lines for h, lines in sections}
    for h in want:
        if h not in body_by_h:
            continue  # already reported missing
        lines = body_by_h[h]
        content = "\n".join(l for l in lines).strip()
        if not content:
            errors.append(f"{path}: section '## {h}' is empty")
            continue
        has_bullets = any(re.match(r"^[-*]\s+", l.strip()) for l in lines)
        # Section-total floor applies to PROSE sections only. List sections vary in
        # length (a one-functionality capability is legitimately short); their
        # substance is guarded per-bullet below, so the section-total floor would
        # double-penalize and false-fail them.
        if not has_bullets and _words(content) < MIN_SECTION_WORDS:
            errors.append(
                f"{path}: section '## {h}' is below the substance floor "
                f"({_words(content)} words < {MIN_SECTION_WORDS}) — looks like a label, not an explanation")
        # per top-level bullet floor
        for l in lines:
            s = l.strip()
            m = re.match(r"^[-*]\s+(.*)$", s)
            if not m:
                continue
            item = m.group(1)
            # strip a leading "Label:" prefix so "In: <real content>" is judged on content
            item_body = re.sub(r"^[A-Za-z][A-Za-z /&]{0,30}:\s*", "", item)
            if _words(item_body) < MIN_BULLET_WORDS:
                errors.append(
                    f"{path}: bullet in '## {h}' is a telegraphic label "
                    f"(\"{item[:50]}\") — explain it (>= {MIN_BULLET_WORDS} words)")


def load_spine(path):
    if yaml is None:
        sys.stderr.write("lint_grounding.py: PyYAML required for --spine mode (pip install pyyaml)\n")
        sys.exit(2)
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def check_spine(root, spine_path, errors, warnings, counts):
    spine = load_spine(spine_path)
    domains = spine.get("domains") or []
    capabilities = spine.get("capabilities") or []
    functionalities = spine.get("functionalities") or []
    epics = spine.get("epics") or []
    slices = spine.get("slices") or []

    referenced_docs = set()
    domain_ids = {d.get("id") for d in domains}
    cap_ids = {c.get("id") for c in capabilities}
    func_ids = {f.get("id") for f in functionalities}

    # --- tree: each collection's entries point at a doc of the matching kind ---
    # The kind is implied by the collection (no `type` field); the parent relation is
    # named (`domain` / `capability`) and must resolve to a real entry.
    for section, kind, parent_field, parent_ids in (
        ("domains", "domain", None, None),
        ("capabilities", "capability", "domain", domain_ids),
        ("functionalities", "functionality", "capability", cap_ids),
    ):
        for e in spine.get(section) or []:
            eid = e.get("id", "<no-id>")
            if not e.get("one_line"):
                errors.append(f"spine {kind} '{eid}': missing one_line descriptor")
            if parent_field:
                pref = e.get(parent_field)
                if not pref:
                    errors.append(f"spine {kind} '{eid}': missing '{parent_field}' parent ref")
                elif pref not in parent_ids:
                    errors.append(f"spine {kind} '{eid}': {parent_field} '{pref}' does not "
                                  f"resolve to a known {parent_field}")
            doc = e.get("doc")
            if not doc:
                errors.append(f"spine {kind} '{eid}': missing doc pointer")
                continue
            full = os.path.join(root, doc)
            referenced_docs.add(os.path.normpath(full))
            if not os.path.isfile(full):
                errors.append(f"spine {kind} '{eid}': grounding doc not found at '{doc}'")
                continue
            text = _read(full)
            title = infer_kind(parse_sections(text)[0])
            if title != kind:
                errors.append(f"spine {kind} '{eid}': its doc '{doc}' reads as '{title}' — mismatch")
            check_doc(full, text, kind, errors, warnings,
                      expected_stage=e.get("detail") if kind == "capability" else None)
            counts[kind] = counts.get(kind, 0) + 1

    # --- epics: doc exists + contract, and functionality_refs resolve (link integrity) ---
    for e in epics:
        eid = e.get("id", "<no-id>")
        doc = e.get("doc")
        for ref in e.get("functionality_refs") or []:
            if ref not in func_ids:
                errors.append(
                    f"spine epic '{eid}': functionality_ref '{ref}' does not resolve to a "
                    f"functionality node in the spine (dangling link)")
        if not doc:
            errors.append(f"spine epic '{eid}': missing doc pointer")
            continue
        full = os.path.join(root, doc)
        referenced_docs.add(os.path.normpath(full))
        if not os.path.isfile(full):
            errors.append(f"spine epic '{eid}': grounding doc not found at '{doc}'")
            continue
        text = _read(full)
        check_doc(full, text, "epic", errors, warnings)
        counts["epic"] = counts.get("epic", 0) + 1

    # --- slices: record exists ---
    for s in slices:
        sid = s.get("id", "<no-id>")
        rec = s.get("record")
        if rec and not os.path.isfile(os.path.join(root, rec)):
            errors.append(f"spine slice '{sid}': record not found at '{rec}'")

    # --- reverse: orphan grounding docs on disk not referenced by the spine ---
    for dirpath, _dirs, files in os.walk(root):
        for fn in files:
            if not fn.endswith(".md"):
                continue
            full = os.path.normpath(os.path.join(dirpath, fn))
            text = _read(full)
            kind = infer_kind(parse_sections(text)[0])
            if kind is None:
                continue  # not a grounding doc (e.g. a README)
            if full not in referenced_docs:
                errors.append(
                    f"orphan grounding doc '{os.path.relpath(full, root)}' "
                    f"({kind}) — present on disk but no spine node/epic references it")


def lint_tree(root, errors, warnings, counts):
    """Lint every grounding doc found under root, kind inferred per doc. No spine cross-check."""
    found = 0
    for dirpath, _dirs, files in os.walk(root):
        for fn in files:
            if not fn.endswith(".md"):
                continue
            full = os.path.join(dirpath, fn)
            text = _read(full)
            kind = infer_kind(parse_sections(text)[0])
            if kind is None:
                continue
            found += 1
            check_doc(full, text, kind, errors, warnings)
            counts[kind] = counts.get(kind, 0) + 1
    if found == 0:
        warnings.append(f"{root}: no grounding docs found")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Structural linter for product-model grounding docs.")
    ap.add_argument("--doc", help="lint a single grounding doc")
    ap.add_argument("--kind", choices=sorted(CONTRACTS), help="force the doc kind (else inferred from H1)")
    ap.add_argument("--stage", choices=["directional", "detailed"],
                    help="for a stage-aware kind (capability): which shape to require")
    ap.add_argument("--root", help="product-os tree root to lint")
    ap.add_argument("--spine", help="spine file; enables spine<->doc consistency checks (needs --root)")
    args = ap.parse_args(argv)

    errors, warnings = [], []
    counts = {}

    if args.doc:
        if not os.path.isfile(args.doc):
            sys.stderr.write(f"lint_grounding.py: doc not found: {args.doc}\n")
            return 2
        text = _read(args.doc)
        kind = args.kind or infer_kind(parse_sections(text)[0])
        if kind is None:
            errors.append(f"{args.doc}: cannot infer kind from H1 — pass --kind")
        else:
            check_doc(args.doc, text, kind, errors, warnings, expected_stage=args.stage)
            counts[kind] = counts.get(kind, 0) + 1
    elif args.root:
        if not os.path.isdir(args.root):
            sys.stderr.write(f"lint_grounding.py: root not found: {args.root}\n")
            return 2
        if args.spine:
            if not os.path.isfile(args.spine):
                sys.stderr.write(f"lint_grounding.py: spine not found: {args.spine}\n")
                return 2
            check_spine(args.root, args.spine, errors, warnings, counts)
        else:
            lint_tree(args.root, errors, warnings, counts)
    else:
        ap.error("pass --doc, or --root [--spine]")

    result = {"ok": not errors, "errors": errors, "warnings": warnings, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
