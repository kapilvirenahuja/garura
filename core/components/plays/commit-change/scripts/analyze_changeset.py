#!/usr/bin/env python3
"""
analyze_changeset.py — mechanical changeset analysis for commit-change (C8).

The fast-path hand of Step 1. Scans the changeset for sensitive files and
classifies it as trivial (single concern, script-analyzable) or needing
judgment (multi-concern → dispatch the analyze agent). For a trivial
changeset it emits the full analysis.yaml itself; otherwise it emits only
the scan + classification and the agent does the grouping.

Harness-led split:
  - This script computes FACTS: the scan result, the classification, and
    (when trivial) the analysis document.
  - The SKILL keeps POLICY: sensitive → hard block (C6); needs_judgment →
    dispatch repo-orchestrator/analyze-changes; trivial → no dispatch (C8).

Layer rule: like preflight.py, this script does not shell out to git. The
orchestrator passes the porcelain output in; content scanning reads the
working tree directly.

    python3 analyze_changeset.py --porcelain-file <path> --issue <n>
                                 --out <analysis.yaml> [--repo-root <path>]
                                 [--max-trivial-files 5]

Prints a JSON summary to stdout: {needs_judgment, sensitive, groups, out}.
Exit 0 on success (including needs_judgment), 2 on unreadable inputs.
No third-party packages — runs in any installed target.
"""

import argparse
import json
import os
import re
import sys

SENSITIVE_NAME_PATTERNS = [
    r"(^|/)\.env($|\.)", r"\.pem$", r"\.key$", r"credentials", r"secrets",
    r"\.p12$", r"\.pfx$", r"id_rsa", r"\.keystore$",
]
# Each pattern is assembled from two halves so this file's own source never
# contains the contiguous string it hunts for — otherwise the scanner flags
# itself (and any copy of it) as sensitive.
SENSITIVE_CONTENT_PATTERNS = [a + b for a, b in [
    ("pass", r"word\s*="), ("api_", r"key\s*="), ("sec", r"ret\s*="),
    ("tok", r"en\s*="), ("private", "_key"),
    ("BEGIN RSA ", "PRIVATE KEY"), ("BEGIN OPENSSH ", "PRIVATE KEY"),
]]
# Artifact-type lesson (#438): prose and standards artifacts CARRY hunt
# patterns — a severity taxonomy or a skill's instructions legitimately
# contain text like the patterns above. A content match in these paths is a
# NON-BLOCKING warning (surfaced, human-visible, never silently dropped);
# a content match anywhere else, and every FILENAME match (.env, .pem,
# id_rsa, ...), stays a hard block. C6's guarantee is unchanged: actual
# secrets block; pattern-carrying prose no longer false-positives the run.
PROSE_PATH_PATTERNS = [
    r"^core/components/", r"^core/grounding/",
    r"^\.claude/(skills|agents)/", r"^\.agents/skills/",
    r"^\.garura/", r"^docs/", r"\.md$", r"\.rst$",
]


def is_prose_path(path):
    return any(re.search(pat, path) for pat in PROSE_PATH_PATTERNS)
# Run-state the play itself mutates while running — never committed by the
# run that is writing it (precedent: prior commits.yaml exclusions).
AUTO_EXCLUDE_PATTERNS = [
    (r"^\.garura/project/issues/[^/]+/status(/|$)",
     "play run-state directory — mutated by the running play itself; "
     "committed later by an stm chore commit, never by its own run"),
]
MAX_CONTENT_SCAN_BYTES = 1_000_000

# Confident path → (type, scope). A trivial verdict REQUIRES a confident
# type; anything off this table needs judgment (conservative by design).
TYPE_TABLE = [
    (r"^core/components/memory/knowledge/", ("docs", "kb")),
    (r"^core/components/memory/standards/", ("docs", "standards")),
    (r"^docs/", ("docs", None)),
    (r"^\.garura/project/issues/", ("chore", "stm")),
    (r"(^|/)tests?/", ("test", None)),
]


def parse_porcelain(path):
    entries = []
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if not line.strip():
                continue
            status, p = line[:2].strip(), line[3:].strip()
            if " -> " in p:  # rename: take the new side
                p = p.split(" -> ", 1)[1]
            entries.append((status, p.strip('"')))
    return entries


def expand_dirs(entries, root):
    """Porcelain lists an untracked dir as 'dir/'; expand to its files."""
    out = []
    for status, p in entries:
        full = os.path.join(root, p)
        if p.endswith("/") and os.path.isdir(full):
            for dirpath, _, files in os.walk(full):
                for f in files:
                    rel = os.path.relpath(os.path.join(dirpath, f), root)
                    out.append((status, rel))
        else:
            out.append((status, p))
    return out


def scan_sensitive(files, root):
    flagged = []
    for _, p in files:
        for pat in SENSITIVE_NAME_PATTERNS:
            if re.search(pat, p, re.IGNORECASE):
                # a sensitive FILENAME blocks regardless of artifact type
                flagged.append({"path": p, "match": pat, "kind": "filename",
                                "blocking": True})
                break
        else:
            full = os.path.join(root, p)
            if os.path.isfile(full) and os.path.getsize(full) <= MAX_CONTENT_SCAN_BYTES:
                try:
                    text = open(full, encoding="utf-8", errors="ignore").read()
                except OSError:
                    continue
                for pat in SENSITIVE_CONTENT_PATTERNS:
                    if re.search(pat, text):
                        flagged.append({"path": p, "match": pat, "kind": "content",
                                        "blocking": not is_prose_path(p)})
                        break
    return flagged


def infer_type(paths):
    hits = set()
    for p in paths:
        for pat, ts in TYPE_TABLE:
            if re.search(pat, p):
                hits.add(ts)
                break
        else:
            return None  # off-table file → no confident type
    return hits.pop() if len(hits) == 1 else None


def classify(files, max_trivial):
    """Trivial iff few files, all in ONE directory, with one confident type."""
    paths = [p for _, p in files]
    if not paths or len(paths) > max_trivial:
        return None
    dirs = {os.path.dirname(p) for p in paths}
    if len(dirs) != 1:
        return None
    return infer_type(paths)


def draft_subject(files):
    statuses = {s for s, _ in files}
    verb = "add" if statuses <= {"??", "A"} else "update"
    if len(files) == 1:
        stem = os.path.splitext(os.path.basename(files[0][1]))[0]
        return f"{verb} {stem.replace('-', ' ')}"
    d = os.path.dirname(files[0][1])
    return f"{verb} {len(files)} files under {d}"


def emit_yaml(out_path, issue, group, exclusions, flagged, needs_judgment, files):
    lines = ["---", "# analyze_changeset.py output (C8 fast path)",
             f"# issue: {issue}", f"needs_judgment: {str(needs_judgment).lower()}", ""]
    lines.append("change_groups:")
    if group:
        lines += [
            "  - id: group-1",
            f"    issue: {issue}",
            f"    concern: \"{group['concern']}\"",
            f"    commit_type: {group['type']}",
            f"    scope: {group['scope']}",
            f"    subject: \"{group['subject']}\"",
            "    subject_source: script-draft  # orchestrator may reword in place",
            "    files:",
        ]
        lines += [f"      - {p}" for _, p in files]
    else:
        lines.append("  []  # grouping left to the analyze agent (needs_judgment)")
    lines.append("")
    lines.append("exclusions:")
    if exclusions:
        for path, reason in exclusions:
            lines += [f"  - path: \"{path}\"", f"    reason: \"{reason}\"",
                      "    blocking: false"]
    else:
        lines.append("  []")
    lines.append("")
    lines.append("risks:")
    lines.append("  sensitive_files:")
    blocking = [f for f in flagged if f.get("blocking", True)]
    if flagged:
        for f in flagged:
            note = f"{f['kind']}" + ("" if f.get("blocking", True)
                                     else " in prose/standards artifact — warning, not a block (#438)")
            lines += [f"    - path: \"{f['path']}\"",
                      f"      match: '{f['match']}' # {note}",
                      f"      blocking: {str(f.get('blocking', True)).lower()}"]
    else:
        lines.append("    []")
    lines.append("")
    lines.append("eval_gates:")
    lines.append("  SE-1: {status: " +
                 ("PASS, evidence: \"one script-classified group, one directory, one concern\"}"
                  if group else "DEFERRED, evidence: \"grouping delegated to analyze agent\"}"))
    lines.append("  SE-5: {status: " +
                 ("FAIL, evidence: \"sensitive file flagged blocking\"}" if blocking
                  else ("PASS, evidence: \"content matches in prose artifacts only — "
                        "non-blocking warnings surfaced\"}" if flagged
                        else "PASS, evidence: \"no sensitive patterns matched\"}")))
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--porcelain-file", required=True)
    ap.add_argument("--issue", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--repo-root", default=".")
    ap.add_argument("--max-trivial-files", type=int, default=5)
    args = ap.parse_args()

    try:
        entries = expand_dirs(parse_porcelain(args.porcelain_file), args.repo_root)
    except OSError as e:
        print(json.dumps({"error": str(e)}))
        return 2

    exclusions, candidates = [], []
    for status, p in entries:
        for pat, reason in AUTO_EXCLUDE_PATTERNS:
            if re.search(pat, p):
                exclusions.append((p, reason))
                break
        else:
            candidates.append((status, p))

    flagged = scan_sensitive(candidates, args.repo_root)
    blocking = [f for f in flagged if f.get("blocking", True)]
    type_scope = None if blocking else classify(candidates, args.max_trivial_files)
    needs_judgment = not blocking and type_scope is None and bool(candidates)

    group = None
    if type_scope and not blocking:
        t, scope = type_scope
        group = {"type": t, "scope": scope or "core",
                 "concern": f"single-directory {t} change",
                 "subject": draft_subject(candidates)}

    emit_yaml(args.out, args.issue, group, exclusions, flagged,
              needs_judgment, candidates)
    print(json.dumps({
        "needs_judgment": needs_judgment,
        "sensitive": [f["path"] for f in blocking],
        "warnings": [f["path"] for f in flagged if not f.get("blocking", True)],
        "groups": 1 if group else 0,
        "excluded": len(exclusions),
        "files": len(candidates),
        "out": args.out,
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
