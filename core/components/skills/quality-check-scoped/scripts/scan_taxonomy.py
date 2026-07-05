#!/usr/bin/env python3
"""
scan_taxonomy.py — deterministic PR severity scan for quality-check-scoped.

Replaces the LLM-run match loop with a real glob/regex engine (#454). Given the PR
severity taxonomy (standards/rules/pr.md) and a unified diff, it:

  1. derives changed paths + added lines from the diff,
  2. classifies every path by ARTIFACT TYPE (first-match glob, from the taxonomy's
     Artifact-Type Scoping table),
  3. evaluates every severity row's match rule against the diff:
       - grep / grep+path grep-half: eligible only on CODE artifact types,
       - path / grep+path path-half: on a PROSE artifact type it fires only when the
         matched glob is docs-targeting (the #454 prose guard) — otherwise dropped,
  4. rolls the CODE-20 `**/*` catch-all into a single count, never per-file findings,
  5. emits findings.yaml (stable-sorted, byte-identical across runs bar generated_at).

Pure regex/glob. No inference, no loose substring matching. Two runs on the same
(diff, taxonomy) produce identical findings.
"""
import argparse
import datetime
import re
import sys

PROSE_TYPES = {"garura-prose", "productos-model", "stm-evidence", "wireframe", "docs-planning"}
CODE_TYPES = {"runtime-code", "deployable-config", "tests"}
DEFAULT_ARTIFACT = "runtime-code"

DOCS_GLOB_TOKENS = (
    "docs/", "readme", "changelog", "security", "contributing", "license",
    ".env.example", ".env.sample", "openapi", "swagger", "api-spec",
)
DOCS_GLOB_SUFFIXES = (".md", ".rst", ".txt")


# --------------------------------------------------------------------------- globs
def split_globs(s):
    """Split a comma-separated glob list, respecting {a,b} brace groups."""
    parts, depth, cur = [], 0, []
    for ch in s:
        if ch == "{":
            depth += 1
            cur.append(ch)
        elif ch == "}":
            depth -= 1
            cur.append(ch)
        elif ch == "," and depth == 0:
            parts.append("".join(cur).strip())
            cur = []
        else:
            cur.append(ch)
    if cur:
        parts.append("".join(cur).strip())
    return [p for p in parts if p]


def glob_to_regex(glob):
    """Translate a path glob to an anchored regex.

    `**` spans path segments, `*`/`?` stay within one segment, `{a,b}` is
    alternation, `schema*` matches a final segment starting with 'schema'.
    """
    i, n, out = 0, len(glob), []
    while i < n:
        c = glob[i]
        if c == "*":
            if i + 1 < n and glob[i + 1] == "*":
                # `**` — consume, and swallow a following '/' so `**/x` also matches `x`
                i += 2
                if i < n and glob[i] == "/":
                    out.append("(?:.*/)?")
                    i += 1
                else:
                    out.append(".*")
            else:
                out.append("[^/]*")
                i += 1
        elif c == "?":
            out.append("[^/]")
            i += 1
        elif c == "{":
            out.append("(?:")
            i += 1
        elif c == "}":
            out.append(")")
            i += 1
        elif c == "," :
            out.append("|")
            i += 1
        else:
            out.append(re.escape(c))
            i += 1
    return "".join(out)


def glob_matches(glob, path):
    """True if `path` matches `glob`. Globs with no '/' match the basename."""
    pattern = glob_to_regex(glob)
    if "/" not in glob:
        base = path.rsplit("/", 1)[-1]
        return re.fullmatch(pattern, base) is not None
    return re.fullmatch(pattern, path) is not None


def is_docs_glob(glob):
    g = glob.lower()
    if g.endswith(DOCS_GLOB_SUFFIXES):
        return True
    return any(tok in g for tok in DOCS_GLOB_TOKENS)


# --------------------------------------------------------------------------- taxonomy
def _backtick_tokens(cell):
    return re.findall(r"`([^`]*)`", cell)


def parse_taxonomy(text):
    """Return (artifact_rows, severity_rows).

    artifact_rows: list of (artifact_type, [globs]) in table order (runtime-code omitted).
    severity_rows: list of dicts {id, severity, kind, ...} parsed from the Severity Table.
    """
    lines = text.splitlines()

    # --- artifact-type classification table ---
    artifact_rows = []
    in_class = False
    for ln in lines:
        if "Classification table" in ln:
            in_class = True
            continue
        if in_class:
            if not ln.strip().startswith("|"):
                if artifact_rows:  # table ended
                    break
                continue
            cells = ln.split("|")
            if len(cells) < 3:
                continue
            type_tokens = _backtick_tokens(cells[1])
            if not type_tokens:
                continue  # header / separator row
            atype = type_tokens[0]
            if atype == "runtime-code":
                break  # default fallback — no globs
            globs = _backtick_tokens(cells[2])
            artifact_rows.append((atype, globs))

    # --- severity table ---
    severity_rows = []
    for ln in lines:
        s = ln.strip()
        if not s.startswith("|"):
            continue
        inner = s.strip("|")
        if "|" not in inner:
            continue
        first = inner.index("|")
        std = inner[:first].strip()
        if not re.fullmatch(r"[A-Z]+-\d+", std):
            continue
        rest = inner[first + 1:]
        second = rest.index("|")
        sev = rest[:second].strip()
        if not re.fullmatch(r"P\d", sev):
            continue
        rest2 = rest[second + 1:]
        last = rest2.rindex("|")  # evidence column has no pipe/backtick
        rule = rest2[:last].strip().strip("`").strip()
        row = {"id": std, "severity": sev}
        row.update(parse_match_rule(rule))
        severity_rows.append(row)
    return artifact_rows, severity_rows


def _split_unescaped_pipe(s):
    """Split at the LAST unescaped '|' — the grep+path separator (regex uses '\\|')."""
    idx = None
    i = 0
    while i < len(s):
        if s[i] == "|" and (i == 0 or s[i - 1] != "\\"):
            idx = i
        i += 1
    if idx is None:
        return s, ""
    return s[:idx], s[idx + 1:]


def grep_to_regex(pattern):
    return pattern.replace("\\x60", "`").replace("\\|", "|")


def parse_match_rule(rule):
    if rule.startswith("grep+path:"):
        payload = rule[len("grep+path:"):]
        regex_part, glob_part = _split_unescaped_pipe(payload)
        return {"kind": "grep+path", "regex": grep_to_regex(regex_part),
                "globs": split_globs(glob_part)}
    if rule.startswith("grep:"):
        return {"kind": "grep", "regex": grep_to_regex(rule[len("grep:"):])}
    if rule.startswith("path:"):
        return {"kind": "path", "globs": split_globs(rule[len("path:"):])}
    return {"kind": "unknown", "raw": rule}


def path_part(globs):
    """Split a glob list into (includes, excludes)."""
    inc = [g for g in globs if not g.startswith("!")]
    exc = [g[1:] for g in globs if g.startswith("!")]
    return inc, exc


def path_hits(globs, path):
    """Return the matched include glob for `path`, or None (honours ! excludes)."""
    inc, exc = path_part(globs)
    if any(glob_matches(g, path) for g in exc):
        return None
    for g in inc:
        if glob_matches(g, path):
            return g
    return None


# --------------------------------------------------------------------------- diff
def parse_diff(text):
    """Return (changed_paths, added_lines).

    added_lines: list of (path, new_lineno, text) for every added ('+') line.
    """
    changed, added = [], []
    cur = None
    new_no = 0
    for ln in text.splitlines():
        if ln.startswith("+++ "):
            p = ln[4:].strip()
            if p == "/dev/null":
                cur = None
                continue
            if p.startswith("b/"):
                p = p[2:]
            cur = p
            if p not in changed:
                changed.append(p)
        elif ln.startswith("--- "):
            p = ln[4:].strip()
            if p.startswith("a/") and p != "a/dev/null":
                p = p[2:]
                if p not in changed:
                    changed.append(p)
        elif ln.startswith("@@"):
            m = re.search(r"\+(\d+)", ln)
            new_no = int(m.group(1)) if m else 0
        elif ln.startswith("+") and not ln.startswith("+++"):
            if cur is not None:
                added.append((cur, new_no, ln[1:]))
            new_no += 1
        elif ln.startswith("-") and not ln.startswith("---"):
            pass  # removed line — no new-file line number
        else:
            new_no += 1  # context line
    return changed, added


# --------------------------------------------------------------------------- classify
def classify(path, artifact_rows):
    for atype, globs in artifact_rows:
        if any(glob_matches(g, path) for g in globs):
            return atype
    return DEFAULT_ARTIFACT


# --------------------------------------------------------------------------- scan
def scan(taxonomy_text, diff_text, changed_override=None):
    artifact_rows, severity_rows = parse_taxonomy(taxonomy_text)
    changed, added = parse_diff(diff_text)
    if changed_override:
        changed = changed_override
    atype = {p: classify(p, artifact_rows) for p in changed}

    # added lines grouped by file (only for grep-eligible files)
    added_by_file = {}
    for p, no, txt in added:
        added_by_file.setdefault(p, []).append((no, txt))

    findings, errors = [], []
    catchall = {}

    for row in severity_rows:
        rid, sev, kind = row["id"], row["severity"], row["kind"]

        # CODE-20 style catch-all: count, never per-file findings (#454)
        if rid == "CODE-20":
            catchall[rid] = sum(1 for p in changed if path_hits(row.get("globs", []), p))
            continue

        rx = None
        if kind in ("grep", "grep+path"):
            try:
                rx = re.compile(row["regex"], re.IGNORECASE)
            except re.error as e:
                errors.append({"standard_id": rid, "error": "invalid regex: %s" % e})
                continue

        if kind == "path":
            for p in changed:
                g = path_hits(row["globs"], p)
                if g is None:
                    continue
                t = atype.get(p, DEFAULT_ARTIFACT)
                if t in PROSE_TYPES and not is_docs_glob(g):
                    continue  # #454 prose guard
                findings.append(_finding(rid, sev, p, 1, p, t))

        elif kind == "grep":
            for p in changed:
                t = atype.get(p, DEFAULT_ARTIFACT)
                if t not in CODE_TYPES:
                    continue  # grep ineligible on prose (#438)
                for no, txt in added_by_file.get(p, []):
                    m = rx.search(txt)
                    if m:
                        findings.append(_finding(rid, sev, p, no, m.group(0), t))

        elif kind == "grep+path":
            for p in changed:
                if path_hits(row["globs"], p) is None:
                    continue
                t = atype.get(p, DEFAULT_ARTIFACT)
                if t not in CODE_TYPES:
                    continue  # grep half ineligible on prose
                for no, txt in added_by_file.get(p, []):
                    m = rx.search(txt)
                    if m:
                        findings.append(_finding(rid, sev, p, no, m.group(0), t))

    findings.sort(key=lambda f: (f["severity"], f["file"], f["line"], f["standard_id"]))
    counts = {s: sum(1 for f in findings if f["severity"] == s) for s in ("P1", "P2", "P3", "P4")}
    coverage = 1.0 if changed else 0.0  # every changed path is classified
    return {
        "changed": changed,
        "findings": findings,
        "counts": counts,
        "catchall": catchall,
        "errors": errors,
        "scan_coverage": coverage,
        "standards_relevant": len({f["standard_id"] for f in findings}),
    }


def _finding(rid, sev, path, line, evidence, atype):
    return {
        "standard_id": rid,
        "severity": sev,
        "file": path,
        "line": line,
        "evidence": evidence,
        "artifact_type": atype,
        "taxonomy_rule_id": rid,
    }


# --------------------------------------------------------------------------- yaml out
def _q(s):
    s = str(s)
    return "'" + s.replace("'", "''") + "'"


def to_yaml(result, diff_path, taxonomy_path):
    ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    out = []
    out.append("meta:")
    out.append("  generated_at: %s" % _q(ts))
    out.append("  diff_path: %s" % _q(diff_path))
    out.append("  taxonomy_path: %s" % _q(taxonomy_path))
    out.append("  changed_paths_count: %d" % len(result["changed"]))
    out.append("  scan_coverage: %.4f" % result["scan_coverage"])
    out.append("  standards_relevant: %d" % result["standards_relevant"])
    out.append("  catchall:")
    if result["catchall"]:
        for k in sorted(result["catchall"]):
            out.append("    %s: %d" % (k, result["catchall"][k]))
    else:
        out.append("    {}")
    if result["errors"]:
        out.append("  errors:")
        for e in result["errors"]:
            out.append("    - standard_id: %s" % _q(e["standard_id"]))
            out.append("      error: %s" % _q(e["error"]))
    out.append("findings:")
    if result["findings"]:
        for f in result["findings"]:
            out.append("  - standard_id: %s" % _q(f["standard_id"]))
            out.append("    severity: %s" % f["severity"])
            out.append("    file: %s" % _q(f["file"]))
            out.append("    line: %d" % f["line"])
            out.append("    evidence: %s" % _q(f["evidence"]))
            out.append("    artifact_type: %s" % _q(f["artifact_type"]))
            out.append("    taxonomy_rule_id: %s" % _q(f["taxonomy_rule_id"]))
    else:
        out.append("  []")
    out.append("counts:")
    for s in ("P1", "P2", "P3", "P4"):
        out.append("  %s: %d" % (s, result["counts"][s]))
    return "\n".join(out) + "\n"


# --------------------------------------------------------------------------- cli
def main(argv=None):
    ap = argparse.ArgumentParser(description="Deterministic PR severity scan (#454).")
    ap.add_argument("--taxonomy", required=True, help="path to pr.md severity taxonomy")
    ap.add_argument("--diff", required=True, help="path to unified diff")
    ap.add_argument("--out", required=True, help="path to write findings.yaml")
    ap.add_argument("--paths", help="optional newline-delimited changed-paths override")
    args = ap.parse_args(argv)

    with open(args.taxonomy, encoding="utf-8") as fh:
        taxonomy_text = fh.read()
    with open(args.diff, encoding="utf-8") as fh:
        diff_text = fh.read()
    override = None
    if args.paths:
        with open(args.paths, encoding="utf-8") as fh:
            override = [ln.strip() for ln in fh if ln.strip()]

    result = scan(taxonomy_text, diff_text, override)
    yaml_text = to_yaml(result, args.diff, args.taxonomy)
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(yaml_text)

    c = result["counts"]
    print("scan complete: P1=%d P2=%d P3=%d P4=%d  (CODE-20 catch-all=%s)  errors=%d"
          % (c["P1"], c["P2"], c["P3"], c["P4"],
             result["catchall"].get("CODE-20", 0), len(result["errors"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
