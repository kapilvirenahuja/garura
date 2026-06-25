#!/usr/bin/env python3
"""
run_codex_judge.py — external-grader dispatcher for the grounding eval (mode b / codex).

Runs the SAME judge prompt + doc through the codex-cli grader in its approved dir, and
writes the verdict JSON for grounding_gate.py to score. This is the strongest-isolation
judge mode: a separate process and a different model, so there is no shared context to
bleed and nothing to reward-hack.

The judge prompt mirrors standards/rules/grounding-eval.md — keep the two in sync.

Usage:
    python3 run_codex_judge.py --doc capability.md --kind capability \
        --dir /Users/.../codex --out verdict.json [--parent domain.md] \
        [--codex-cmd "codex exec"]

codex-cli is run with its working dir set to --dir (codex only operates in its approved
directory). The exact codex invocation is environment-specific; override with
--codex-cmd if your codex build differs. The script extracts the last JSON object from
codex's stdout as the verdict.

Exit 0 on a captured verdict, 2 on a dispatch/parse error.
"""

import argparse
import json
import os
import re
import subprocess
import sys

JUDGE_PROMPT = """\
You are a skeptical reviewer grading ONE product-model grounding doc for whether a
stranger could understand it. You see only the doc (and its parent doc if provided).
You do NOT see the brief that produced it or any author reasoning — if you find
yourself filling in understanding the doc does not state, that is the doc failing.
Default every criterion to fail unless the doc clearly earns a pass.

Score these criteria for the doc:
- completeness: every required section is substantive, not a placeholder.
- self_explanation: each item carries the why/implication, not just the what.
- discreteness_form: discrete points, not story-prose; Agile forms where required
  (acceptance as Given/When/Then; a functionality states behavior, not "as a user I want").
- depth_gradient: detail increases from parent to child — score na unless a parent doc
  is provided.
- stranger_test: a cold reader can explain the node's what, why, and edges from this doc alone.

For each criterion return: verdict (pass|fail|na), the exact text you judged (quote it),
and — if not a pass — the concrete change that would make it pass.

Return ONLY a JSON object of this exact shape, nothing else:
{"doc":"<path>","kind":"<kind>","criteria":[
 {"id":"completeness","verdict":"","evidence":"","fix":""},
 {"id":"self_explanation","verdict":"","evidence":"","fix":""},
 {"id":"discreteness_form","verdict":"","evidence":"","fix":""},
 {"id":"depth_gradient","verdict":"","evidence":"","fix":""},
 {"id":"stranger_test","verdict":"","evidence":"","fix":""}]}
"""


def extract_guidance(template_path):
    """Return the '## Per-section guidance' block of a kind template, WITHOUT the gold
    example (handing the judge the answer turns judgment into pattern-matching)."""
    text = open(template_path, encoding="utf-8").read()
    out, capturing = [], False
    for line in text.splitlines():
        if line.startswith("## Per-section guidance"):
            capturing = True
            out.append(line)
            continue
        if capturing and line.startswith("## "):  # next H2 (e.g. Gold example) ends it
            break
        if capturing:
            out.append(line)
    return "\n".join(out).strip()


def build_prompt(doc_path, kind, parent_path, guidance_path=None):
    parts = [JUDGE_PROMPT, f"\nDOC KIND: {kind}\nDOC PATH: {doc_path}\n"]
    if guidance_path and os.path.isfile(guidance_path):
        g = extract_guidance(guidance_path)
        if g:
            parts.append(f"\n----- PER-SECTION GUIDANCE for a {kind} doc -----\n" + g)
    if parent_path:
        with open(parent_path, encoding="utf-8") as fh:
            parts.append("\n----- PARENT DOC (for depth_gradient) -----\n" + fh.read())
    with open(doc_path, encoding="utf-8") as fh:
        parts.append("\n----- DOC UNDER TEST -----\n" + fh.read())
    return "".join(parts)


def extract_json(text):
    """Return the last balanced top-level JSON object in text, or None."""
    # Prefer a fenced ```json block if present.
    fences = re.findall(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    candidates = list(fences)
    # Also scan for balanced braces as a fallback.
    depth, start = 0, None
    for i, ch in enumerate(text):
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            if depth > 0:
                depth -= 1
                if depth == 0 and start is not None:
                    candidates.append(text[start:i + 1])
    for cand in reversed(candidates):
        try:
            obj = json.loads(cand)
            if isinstance(obj, dict) and "criteria" in obj:
                return obj
        except ValueError:
            continue
    return None


def main(argv=None):
    ap = argparse.ArgumentParser(description="codex-cli grounding judge dispatcher.")
    ap.add_argument("--doc", required=True)
    ap.add_argument("--kind", required=True)
    ap.add_argument("--dir", required=True, help="codex approved working dir")
    ap.add_argument("--out", required=True, help="where to write the verdict JSON")
    ap.add_argument("--parent", default=None)
    ap.add_argument("--guidance", default=None,
                    help="the kind's template (its '## Per-section guidance' is fed to the judge)")
    ap.add_argument("--codex-cmd", default="codex exec",
                    help="codex non-interactive command (prompt piped on stdin)")
    args = ap.parse_args(argv)

    if not os.path.isdir(args.dir):
        sys.stderr.write(f"run_codex_judge.py: codex dir not found: {args.dir}\n")
        return 2
    if not os.path.isfile(args.doc):
        sys.stderr.write(f"run_codex_judge.py: doc not found: {args.doc}\n")
        return 2

    prompt = build_prompt(args.doc, args.kind, args.parent, args.guidance)
    try:
        proc = subprocess.run(
            args.codex_cmd.split(),
            cwd=args.dir,
            input=prompt,
            capture_output=True,
            text=True,
            timeout=300,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        sys.stderr.write(f"run_codex_judge.py: codex dispatch failed: {exc}\n")
        return 2

    verdict = extract_json(proc.stdout) or extract_json(proc.stderr)
    if verdict is None:
        sys.stderr.write("run_codex_judge.py: no verdict JSON found in codex output\n")
        sys.stderr.write(proc.stdout[-2000:] + "\n")
        return 2

    verdict.setdefault("doc", args.doc)
    verdict.setdefault("kind", args.kind)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(verdict, fh, indent=2)
    sys.stderr.write(f"run_codex_judge.py: verdict written to {args.out}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
